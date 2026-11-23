# 07. 開機流程與 Bootloader

> **一句話**：按下電源到執行 `main()` 之間，有一段韌體工程師必須掌控的流程；而 **Bootloader 決定了裝置能不能安全更新、更新失敗能不能救回來**。

---

## 1. Cortex-M 開機流程 🟢

```
上電 / 重置
   │
   ▼
硬體從位址 0x0000_0000（向量表）讀取：
   [0] 初始 MSP 值  → 載入 SP
   [1] Reset_Handler 位址 → 載入 PC
   │
   ▼
Reset_Handler（啟動程式 startup.s / startup.c）
   ├─ 1. 設定時脈（或交給 SystemInit）
   ├─ 2. 複製 .data：Flash → RAM
   ├─ 3. 清零 .bss
   ├─ 4. 初始化 FPU（若有）
   ├─ 5. 呼叫 C++ 靜態建構子（__libc_init_array）
   └─ 6. 呼叫 main()
```

> 注意：STM32 的 Flash 實體位址是 `0x0800_0000`，開機時透過 **BOOT 腳位**選擇把 Flash / System Memory / SRAM 映射（alias）到 `0x0000_0000`。

### 1.1 向量表（Vector Table）

| 偏移 | 內容 |
|---|---|
| 0x00 | 初始 MSP |
| 0x04 | Reset |
| 0x08 | NMI |
| 0x0C | HardFault |
| 0x10～0x18 | MemManage、BusFault、UsageFault（M3 以上） |
| 0x2C | SVCall |
| 0x38 | PendSV |
| 0x3C | SysTick |
| 0x40 起 | 外部中斷 IRQ0、IRQ1… |

**VTOR（Vector Table Offset Register）**：可將向量表重新定位到其他位址。**Bootloader 跳轉到應用程式時必須設定**。

### 1.2 最小啟動程式（C 版本）

```c
extern uint32_t _sidata, _sdata, _edata, _sbss, _ebss, _estack;
int main(void);

void Reset_Handler(void) {
    uint32_t *src = &_sidata, *dst = &_sdata;
    while (dst < &_edata) *dst++ = *src++;      // 複製 .data
    for (dst = &_sbss; dst < &_ebss; ) *dst++ = 0; // 清零 .bss
    SystemInit();                               // 時脈等設定
    main();
    while (1) { }                               // main 不應返回
}

__attribute__((section(".isr_vector"), used))
const void *vector_table[] = {
    &_estack,
    Reset_Handler,
    NMI_Handler,
    HardFault_Handler,
    /* ... */
};
```

## 2. 重置來源 🟡

| 來源 | 說明 |
|---|---|
| POR（Power-On Reset） | 上電 |
| BOR（Brown-Out Reset） | 電壓過低 |
| 外部 NRST 腳位 | 按 Reset 鍵 |
| **看門狗重置** | IWDG / WWDG 逾時 |
| 軟體重置 | `NVIC_SystemReset()` |
| 低功耗喚醒 | 從 Standby 模式喚醒等同重置 |

**實務**：開機時讀取重置原因暫存器（如 STM32 `RCC->CSR`），**記錄到日誌或回報雲端**。現場裝置頻繁看門狗重置是嚴重警訊。

## 3. 為什麼需要 Bootloader 🟢

| 功能 | 說明 |
|---|---|
| **韌體更新** | 透過 UART、USB、BLE、Wi-Fi 接收新韌體並寫入 Flash |
| **驗證** | 檢查應用程式完整性（CRC）與真實性（數位簽章） |
| **回復** | 更新失敗時退回舊版或進入恢復模式 |
| **安全開機鏈** | 作為信任鏈的第一環（第 19 章） |

## 4. 典型 Flash 分割 🟡

**單分割區（Single Slot）**：

```
┌────────────┬────────────────────────┐
│ Bootloader │ Application            │
└────────────┴────────────────────────┘
```

更新時直接覆寫 Application → 更新中斷電就變磚，只能靠 Bootloader 重新接收。

**雙分割區（A/B 或 Primary/Secondary）**：

```
┌────────────┬─────────────┬─────────────┬─────────┐
│ Bootloader │  Slot A     │  Slot B     │ Scratch │
│  (不更新)   │ （執行中）   │ （下載新版） │（交換用）│
└────────────┴─────────────┴─────────────┴─────────┘
```

| 模式 | 說明 | 優缺點 |
|---|---|---|
| **Swap（交換）** | 驗證後把 B 與 A 交換，新版在 A 執行 | 可回滾；需要 scratch 區與額外抹寫 |
| **Overwrite（覆寫）** | 驗證後把 B 複製到 A | 簡單；無法回滾 |
| **Direct-XIP** | 兩個 slot 都可直接執行，Bootloader 選版本較新且有效者 | 不需搬移，最快；需要位置無關或兩份不同連結位址的映像 |
| **RAM Load** | 從外部 Flash 載入 RAM 執行 | 大型應用 |

## 5. Bootloader 跳轉到應用程式 🔴

```c
#define APP_ADDR 0x08010000u

typedef void (*app_entry_t)(void);

void jump_to_app(void) {
    uint32_t app_sp    = *(volatile uint32_t *)(APP_ADDR + 0);
    uint32_t app_reset = *(volatile uint32_t *)(APP_ADDR + 4);

    // 1. 基本檢查：堆疊指標必須落在 RAM 範圍
    if ((app_sp & 0xFFF00000u) != 0x20000000u) return;

    // 2. 關閉中斷、停用 SysTick、還原用過的周邊
    __disable_irq();
    SysTick->CTRL = 0;
    for (int i = 0; i < 8; i++) { NVIC->ICER[i] = 0xFFFFFFFFu; NVIC->ICPR[i] = 0xFFFFFFFFu; }

    // 3. 設定向量表位址
    SCB->VTOR = APP_ADDR;

    // 4. 設定 MSP 並跳轉
    __set_MSP(app_sp);
    __DSB(); __ISB();
    ((app_entry_t)app_reset)();
}
```

常見錯誤：
- 沒有設定 VTOR → 應用程式的中斷跑到 Bootloader 的處理函式
- 沒有關閉 Bootloader 用過的周邊與中斷 → 跳轉後立刻進入未預期的中斷
- 應用程式的 Linker Script 沒有改起始位址
- 應用程式的 `SystemInit` 又把 VTOR 改回 `0x08000000`

## 6. 主流 Bootloader 🟡

| 名稱 | 適用 | 特色 |
|---|---|---|
| **MCUboot** | MCU（Zephyr、NuttX、Mynewt、ESP-IDF 可選、TF-M） | **業界標準開源安全 Bootloader**：簽章驗證、swap/回滾、加密映像 |
| **TF-M BL2** | ARMv8-M | 基於 MCUboot，配合 TrustZone |
| ESP-IDF Bootloader | ESP32 | 二階段、支援 Secure Boot V2 與 Flash 加密 |
| 原廠 ROM Bootloader | STM32、NXP、Nordic | 晶片內建，無法更改，用於救援 |
| **U-Boot** | 嵌入式 Linux | 初始化 DRAM、載入 Kernel 與 Device Tree |
| **TF-A（Trusted Firmware-A）** | ARMv8-A | 安全世界的開機與執行期服務 |

### 6.1 MCUboot 的 test / confirm 機制

1. 新映像下載到 secondary slot，標記為 **test**
2. 重開機，MCUboot 驗證簽章後 swap 執行新版
3. 新版應用程式自我測試成功後呼叫 **confirm**（`boot_write_img_confirmed()`）
4. 若新版**沒有 confirm 就重開機**（當機、看門狗），MCUboot 自動**還原到舊版**

## 7. 嵌入式 Linux 開機流程 🔴

```
Boot ROM（晶片內建）
   → SPL / TF-A BL2（初始化 DRAM）
   → [TF-A BL31 安全監控（ARMv8-A）]
   → U-Boot（載入 Kernel、Device Tree、initramfs）
   → Linux Kernel（初始化驅動、掛載 rootfs）
   → init（systemd / BusyBox init）
   → 使用者應用程式
```

詳見第 13 章。

## 8. 設計 Bootloader 的原則 🔴

- **Bootloader 越小越好、越少更新越好**：它是唯一無法安全回滾的部分
- **從不信任應用程式區的內容**：每次開機都要驗證
- **任何時間點斷電都要能恢復**：狀態機的每個步驟都要可重入
- 進入條件明確：按鍵、應用程式設定的 `.noinit` 旗標、應用程式無效
- **防降級（Anti-Rollback）**：用安全計數器（OTP/eFuse）防止被刷回有漏洞的舊版
- 保留**救援通道**（UART/USB DFU）

---

## 面試常問

### Q1. MCU 上電到 `main()` 之間發生了什麼？

見第 1 節：硬體從向量表取得初始 SP 與 Reset_Handler，啟動程式複製 `.data`、清零 `.bss`、初始化時脈與 FPU、呼叫 C++ 建構子，最後呼叫 `main()`。

### Q2. 什麼是向量表？VTOR 的用途？

向量表是存放初始堆疊指標與各例外/中斷處理函式位址的陣列。CPU 發生例外時依編號從表中取得處理函式位址。VTOR 讓向量表可以放在 Flash 的任意位置（或 RAM），Bootloader + Application 架構中，跳轉前必須把 VTOR 指向應用程式的向量表。

### Q3. Bootloader 跳轉應用程式要注意什麼？

見第 5 節：驗證映像、關閉中斷與周邊、清除 pending 中斷、設定 VTOR、設定 MSP、跳到 Reset_Handler。

### Q4. 如何設計一個不會變磚的韌體更新機制？

A/B 雙分割區 + 簽章驗證 + test/confirm 自動回滾 + 看門狗 + Bootloader 不可被 OTA 更新 + 斷電安全的狀態紀錄 + 防降級計數器。

### Q5. 如果 `main()` 返回會怎樣？

裸機環境沒有作業系統可以返回，行為取決於啟動程式：通常進入無窮迴圈；若沒有處理可能跳到未定義位址觸發 HardFault。因此韌體的 `main()` 最後一定是 `while (1)` 或啟動 RTOS 排程器（不會返回）。

### Q6. 如何得知裝置為什麼重開機？

讀取重置原因暫存器（RCC_CSR、RSTCAUSE 等），區分 POR、BOR、看門狗、軟體重置、外部腳位；讀完後清除旗標。配合 `.noinit` 區段記錄 HardFault 時的 PC/LR 資訊，下次開機回報。

## 過時技術（知道就好）

- **單分割區直接覆寫更新**：仍見於低成本產品，但不符合現代 OTA 可靠性與資安法規要求。
- **只用 CRC 驗證韌體**：CRC 只能檢查意外損毀，無法防止惡意竄改，現代產品需要**數位簽章**。

## 本章回顧

- 向量表第 0 項是 SP、第 1 項是 Reset_Handler
- 啟動程式：複製 .data、清零 .bss、呼叫 main
- 記錄重置原因
- Bootloader：驗證、更新、回滾；跳轉前設 VTOR 與 MSP
- MCUboot 是 MCU 安全 Bootloader 的業界標準
