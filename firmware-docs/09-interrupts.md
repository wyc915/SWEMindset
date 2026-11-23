# 09. 中斷、例外與並行安全

> **一句話**：中斷讓 MCU 能即時回應外部事件，但也帶來**並行（concurrency）問題**。寫好韌體的關鍵在於：**ISR 要短、共用資料要保護、當機時要能追出原因**。

---

## 1. 輪詢 vs 中斷 🟢

| | 輪詢（Polling） | 中斷（Interrupt） |
|---|---|---|
| 原理 | 主程式不斷檢查狀態 | 事件發生時硬體通知 CPU |
| 優點 | 簡單、時序可預測 | 反應快、CPU 可休眠省電 |
| 缺點 | 浪費 CPU、反應延遲取決於迴圈長度 | 並行問題、除錯困難 |
| 適用 | 高頻且規律的事件、初始化階段 | 不定時事件、低功耗 |

> 類比你的經驗：輪詢 ≈ 定時呼叫 API 查狀態；中斷 ≈ Webhook。

## 2. 中斷處理流程（Cortex-M）🟡

```
1. 周邊產生中斷請求 → NVIC 判斷優先權
2. 硬體自動壓棧（Stacking）：R0–R3、R12、LR、PC、xPSR（8 個 word）
   有使用 FPU 時再加 S0–S15、FPSCR（Lazy Stacking）
3. LR 載入 EXC_RETURN（如 0xFFFFFFF9），PC 載入向量表中的 ISR 位址
4. 執行 ISR（C 函式即可，不需特殊關鍵字）
5. ISR 返回 → 硬體依 EXC_RETURN 自動出棧（Unstacking）
```

**Cortex-M 的設計亮點**：ISR 就是一般的 C 函式，因為硬體自動保存了 AAPCS 規定由呼叫者保存的暫存器。

### 2.1 降低中斷延遲的硬體機制

| 機制 | 說明 |
|---|---|
| **Tail-Chaining** | 一個 ISR 結束時若有另一個中斷等待，直接跳過出棧/壓棧，延遲僅約 6 週期 |
| **Late-Arrival** | 壓棧過程中來了更高優先權中斷，直接改執行高優先權 ISR |
| **Lazy Stacking** | FPU 暫存器只在 ISR 真的使用 FPU 時才保存 |

中斷延遲（Interrupt Latency）：Cortex-M3/M4 約 **12 個時脈週期**（零等待記憶體），M0+ 約 15 週期。

## 3. NVIC 與優先權 🟡

**NVIC（Nested Vectored Interrupt Controller）**：Cortex-M 的中斷控制器。

| 觀念 | 說明 |
|---|---|
| **數字越小，優先權越高** | 0 是最高（可設定的範圍） |
| 優先權位元數 | 晶片實作 3～8 bit，STM32 通常 4 bit（0～15）；**有效位元在高位** |
| **搶佔優先權（Preemption Priority）** | 決定能否打斷正在執行的 ISR |
| **子優先權（Sub-priority）** | 同搶佔等級同時發生時誰先執行，不能互相打斷 |
| 優先權分組 | `NVIC_SetPriorityGrouping()` 決定兩者各佔幾 bit |
| **巢狀中斷** | 高搶佔優先權可打斷低優先權 ISR |
| 固定優先權 | Reset(-3)、NMI(-2)、HardFault(-1) 不可調整 |

### 3.1 中斷遮罩

| 方法 | 效果 |
|---|---|
| `__disable_irq()`（PRIMASK=1） | 關閉所有可設定優先權的中斷 |
| **BASEPRI** | 只遮罩優先權**數值 ≥** 某值的中斷，高優先權中斷仍可執行 |
| FAULTMASK | 連 HardFault 也遮罩（極少用） |

**FreeRTOS 關鍵設定**：`configMAX_SYSCALL_INTERRUPT_PRIORITY`。優先權數值**小於**此值（較高優先權）的中斷**不受 RTOS 臨界區影響、反應最快，但不可呼叫任何 FreeRTOS API**。這是 FreeRTOS 移植最常見的錯誤來源。

## 4. ISR 撰寫守則（必考）🟡

| ✅ 該做 | ❌ 不該做 |
|---|---|
| 讀取資料、**清除中斷旗標** | 長時間運算 |
| 把資料放入緩衝區 / 佇列 | `delay()`、忙碌等待 |
| 設定旗標、通知任務（`...FromISR` API） | `printf`、慢速 I/O |
| 保持短小、可預測 | `malloc` / `free` |
| | 取得 mutex、呼叫會阻塞的 API |
| | 大量浮點運算（增加壓棧成本） |

### 4.1 上半部 / 下半部（Top Half / Bottom Half）

```
ISR（上半部）：搬資料、清旗標、通知 → 立刻返回
任務 / 主迴圈（下半部）：解析協定、運算、寫 Flash、網路傳送
```

Linux 對應機制：softirq、tasklet、workqueue、threaded IRQ。

### 4.2 忘記清除中斷旗標

ISR 返回後旗標仍在 → **立刻再次進入 ISR**，主程式完全無法執行（看起來像當機）。

另一個坑：清除旗標的寫入因為匯流排寫入緩衝**還沒生效**就返回 → 中斷被重複觸發一次。解法：清旗標後讀回暫存器或加 `__DSB()`。

## 5. 共用資料的並行問題 🔴

### 5.1 競爭條件（Race Condition）

```c
volatile uint32_t g_count;

void TIM_IRQHandler(void) { g_count++; }

void main_loop(void) {
    g_count--;     // 讀-改-寫三步驟，中途被中斷打斷 → 遺失更新
}
```

### 5.2 撕裂讀取（Torn Read）

32-bit MCU 讀取 64-bit 變數需要兩條指令，中間可能被中斷更新 → 讀到一半新一半舊的值。8-bit MCU 讀 16-bit 變數也有同樣問題。

```c
// 解法 1：關中斷
uint64_t get_time(void) {
    uint32_t primask = __get_PRIMASK();
    __disable_irq();
    uint64_t t = g_time64;
    __set_PRIMASK(primask);       // 還原原本狀態（支援巢狀呼叫）
    return t;
}

// 解法 2：重複讀取直到一致（無需關中斷）
uint64_t get_time(void) {
    uint32_t hi, lo;
    do {
        hi = g_time_hi;
        lo = g_time_lo;
    } while (hi != g_time_hi);
    return ((uint64_t)hi << 32) | lo;
}
```

### 5.3 保護共用資料的方法

| 方法 | 適用 | 注意 |
|---|---|---|
| **關中斷（臨界區）** | 很短的操作 | 增加中斷延遲；要還原原狀態而非直接開啟 |
| BASEPRI 部分遮罩 | 只擋特定優先權 | M0/M0+ 不支援 |
| **原子指令** | 計數器、旗標 | C11 `<stdatomic.h>`、LDREX/STREX（M3 以上） |
| **單一生產者單一消費者（SPSC）無鎖環形緩衝區** | ISR ↔ 主程式資料流 | 讀寫索引各自只由一方修改 |
| RTOS Mutex | 任務之間 | **不可在 ISR 使用** |
| 硬體原子暫存器 | GPIO 設定 | BSRR |

### 5.4 記憶體屏障

| 指令 | 作用 |
|---|---|
| `__DMB()` | Data Memory Barrier：確保之前的記憶體存取完成後才執行之後的存取 |
| `__DSB()` | Data Synchronization Barrier：等待所有記憶體存取完成 |
| `__ISB()` | Instruction Synchronization Barrier：清空管線，使之後的指令看到新設定（如修改 CONTROL、VTOR 後） |

多核 MCU（RP2040、ESP32、STM32H7 雙核）與 DMA 情境更需要注意。

## 6. 例外（Fault）處理 🔴

| Fault | 常見原因 |
|---|---|
| **HardFault** | 其他 fault 未啟用時升級為 HardFault；M0/M0+ 只有 HardFault |
| **MemManage** | 違反 MPU 設定、執行不可執行區域（XN） |
| **BusFault** | 存取不存在的位址、周邊時脈未開、外部記憶體錯誤 |
| **UsageFault** | 未定義指令、**未對齊存取**（若啟用檢查）、**除以零**（若啟用）、非法狀態（跳到偶數位址，Thumb bit 為 0） |
| SecureFault | ARMv8-M TrustZone 違規 |

### 6.1 HardFault 分析步驟（面試加分）

1. 啟用個別 fault（`SCB->SHCSR`），取得更精確的錯誤類型
2. 在 HardFault Handler 中**判斷使用 MSP 或 PSP**（LR bit 2），取得壓棧框架
3. 從壓棧框架讀出 **PC（出錯指令位址）、LR（呼叫者）**
4. 讀取 **CFSR**（MMFSR/BFSR/UFSR）判斷原因、**MMFAR / BFAR** 得到出錯的資料位址、**HFSR**
5. 用 `arm-none-eabi-addr2line -e firmware.elf 0x0800xxxx` 對應到原始碼行號
6. 現場裝置：把資訊存到 `.noinit` 或 Flash，下次開機上傳（**Crash Dump / Core Dump**）

```c
__attribute__((naked)) void HardFault_Handler(void) {
    __asm volatile(
        "tst lr, #4      \n"   // 判斷 EXC_RETURN bit2
        "ite eq          \n"
        "mrseq r0, msp   \n"
        "mrsne r0, psp   \n"
        "b hardfault_c   \n");
}

void hardfault_c(uint32_t *frame) {
    uint32_t pc = frame[6];   // 壓棧順序：R0,R1,R2,R3,R12,LR,PC,xPSR
    uint32_t lr = frame[5];
    uint32_t cfsr = SCB->CFSR;
    /* 記錄後重置 */
}
```

工具：SEGGER Ozone / J-Link 的 Fault Analyzer、Memfault 等雲端崩潰分析平台、Zephyr 的 coredump 子系統。

## 7. 中斷設計模式 🟡

| 模式 | 說明 |
|---|---|
| 中斷 + 旗標 + 主迴圈 | 最簡單的前後台系統（Foreground/Background） |
| 中斷 + 環形緩衝區 | UART 接收標準做法 |
| 中斷 + RTOS Queue/Notification | RTOS 系統標準做法 |
| **PendSV 延遲處理** | 低優先權軟體中斷，RTOS 用來做 context switch |
| 中斷合併（Coalescing） | 高頻事件累積後一次處理（網路晶片常用） |

---

## 面試常問

### Q1. 中斷發生時 CPU 做了哪些事？

見第 2 節：完成當前指令、硬體自動壓棧 8 個暫存器、載入 EXC_RETURN 到 LR、從向量表讀 ISR 位址跳轉；返回時自動出棧。

### Q2. 為什麼 ISR 要短？哪些事不能在 ISR 做？

見第 4 節。

### Q3. ISR 可以有參數或回傳值嗎？

不行。ISR 由硬體呼叫，沒有呼叫者可以傳參數或接收回傳值。資料交換要透過全域（volatile）變數、緩衝區或 RTOS 佇列。

### Q4. 什麼是中斷延遲？如何降低？

從中斷請求到 ISR 第一條指令執行的時間。影響因素：硬體壓棧週期、正在執行的更高優先權 ISR、**關中斷的臨界區長度**、Flash wait state。降低方法：縮短臨界區、使用 BASEPRI 只遮罩部分中斷、提高關鍵中斷優先權、ISR 與向量表放到 RAM/TCM。

### Q5. 主程式與 ISR 共用一個 64-bit 變數，如何安全讀取？

見 5.2：關中斷讀取（並還原原狀態）、或重複讀取比對高位、或改成 ISR 只寫入、主程式透過 SPSC 佇列取得。

### Q6. 如何追查 HardFault？

見 6.1。

### Q7. 優先權數字 0 和 15 哪個高？

Cortex-M 中**數字越小優先權越高**，0 最高。注意 CMSIS 的 `NVIC_SetPriority()` 會自動處理「有效位元在高位」的移位，直接寫暫存器時要手動左移。

### Q8. 什麼是巢狀中斷？什麼情況會造成問題？

高搶佔優先權中斷可打斷正在執行的低優先權 ISR。問題：堆疊用量疊加（要計算最壞情況）、共用資料的競爭、優先權規劃不當造成延遲。

### Q9. 中斷中發生了中斷旗標沒清除會怎樣？

ISR 返回後立即再次觸發，CPU 卡在中斷中無法執行主程式（中斷風暴）。

## 過時技術（知道就好）

- **8051 / AVR 固定優先權中斷與需要 `interrupt` 關鍵字的 ISR**：Cortex-M 的 ISR 是一般 C 函式，不需要特殊語法。
- **完全依賴關閉全部中斷保護資料**：仍然有效，但現代系統偏好 BASEPRI、原子操作與無鎖結構以降低延遲。

## 本章回顧

- ISR 短、清旗標、交給下半部
- 數字越小優先權越高；FreeRTOS 中斷優先權規則要記熟
- 共用資料：臨界區、原子操作、SPSC 環形緩衝區
- `volatile` ≠ 執行緒安全
- HardFault：取壓棧 PC/LR + CFSR + addr2line
