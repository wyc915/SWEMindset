# 03. 計算機組織與 MCU 架構

> **一句話**：理解 CPU 如何取指令、如何透過匯流排存取記憶體與周邊，才知道「寫一個位址就能點亮 LED」背後發生了什麼事。

---

## 1. MCU 內部長什麼樣 🟢

```
┌──────────────────────── MCU 晶片 ────────────────────────┐
│  ┌──────────┐    ┌─────────────── 匯流排矩陣 ───────────┐ │
│  │ CPU 核心  │───▶│  AHB（高速）           APB（低速）    │ │
│  │ Cortex-M │    └──┬──────┬──────┬───────────┬────────┘ │
│  │  + NVIC  │       │      │      │           │          │
│  │  + FPU   │     Flash  SRAM   DMA     GPIO/UART/I2C/   │
│  └──────────┘                            SPI/ADC/Timer   │
│           時脈系統（RCC/PLL）   電源管理   看門狗           │
└──────────────────────────────────────────────────────────┘
```

## 2. 馮紐曼 vs 哈佛架構 🟢

| | 馮紐曼（Von Neumann） | 哈佛（Harvard） |
|---|---|---|
| 指令與資料 | 共用同一條匯流排 | 分開的匯流排 |
| 優點 | 簡單 | 可同時取指令與存取資料，效能高 |
| 例子 | Cortex-M0/M0+、x86（概念上） | Cortex-M3/M4/M7（修正型哈佛：匯流排分離，但位址空間統一）、AVR、DSP |

## 3. 記憶體映射 I/O（Memory-Mapped I/O）🟢

**核心觀念**：在 ARM Cortex-M 上，周邊暫存器被放在固定的記憶體位址。**讀寫那個位址 = 操作硬體**。

Cortex-M 的 4GB 位址空間（由 ARM 定義的標準配置）：

| 位址範圍 | 區域 |
|---|---|
| `0x0000_0000` – `0x1FFF_FFFF` | Code（Flash，向量表在這） |
| `0x2000_0000` – `0x3FFF_FFFF` | SRAM |
| `0x4000_0000` – `0x5FFF_FFFF` | **Peripheral（周邊暫存器）** |
| `0x6000_0000` – `0x9FFF_FFFF` | 外部記憶體 |
| `0xE000_0000` – `0xE00F_FFFF` | 私有周邊匯流排（NVIC、SysTick、SCB、除錯單元） |

```c
// 概念示意：寫入 GPIO 輸出暫存器（實際位址依晶片而定）
#define GPIOA_ODR (*(volatile uint32_t *)0x40020014u)
GPIOA_ODR |= (1u << 5);   // PA5 輸出高電位
```

## 4. CPU 執行指令 🟡

### 4.1 指令週期

**取指（Fetch）→ 解碼（Decode）→ 執行（Execute）**，配合**管線（Pipeline）**讓多條指令重疊執行。

| 核心 | 管線深度 |
|---|---|
| Cortex-M0+ | 2 級 |
| Cortex-M3/M4 | 3 級 |
| Cortex-M7 | 6 級超純量（雙發射） |

分支（if、跳躍）會**清空管線**，造成效能損失。M7 有分支預測。

### 4.2 CPU 暫存器（ARM Cortex-M）

| 暫存器 | 用途 |
|---|---|
| R0–R12 | 一般用途；**R0–R3 用來傳遞函式參數與回傳值**（AAPCS 呼叫慣例） |
| R13（SP） | 堆疊指標，有 MSP（主）與 PSP（行程）兩個 |
| R14（LR） | 連結暫存器：函式返回位址；例外時存放特殊值 EXC_RETURN |
| R15（PC） | 程式計數器 |
| xPSR | 狀態旗標（N/Z/C/V）、例外編號 |
| PRIMASK / BASEPRI / FAULTMASK | 中斷遮罩 |
| CONTROL | 選擇 MSP/PSP、特權/非特權模式 |

### 4.3 RISC vs CISC

| | RISC | CISC |
|---|---|---|
| 指令 | 少、固定長度、簡單 | 多、可變長度、複雜 |
| 記憶體存取 | 只有 Load/Store 指令存取記憶體 | 運算指令可直接存取記憶體 |
| 例子 | ARM、RISC-V | x86 |

ARM Cortex-M 使用 **Thumb-2** 指令集：16/32-bit 混合長度，兼顧程式碼密度與效能。

## 5. 主流核心比較 🟡

| 核心 | 特點 | 典型用途 |
|---|---|---|
| **Cortex-M0/M0+** | 最小、最省電、ARMv6-M | 簡單感測器、低成本產品 |
| **Cortex-M3** | ARMv7-M，硬體除法 | 一般控制 |
| **Cortex-M4(F)** | + DSP 指令、可選單精度 FPU | 馬達控制、音訊、感測融合 |
| **Cortex-M7** | 高效能、L1 Cache、雙精度 FPU 可選 | 高階 HMI、工業控制 |
| **Cortex-M23/M33** | ARMv8-M，**TrustZone 安全隔離** | IoT 安全產品（現代主流） |
| **Cortex-M55/M85** | Helium 向量指令（MVE） | 邊緣 AI |
| **Cortex-R** | 即時、高可靠、鎖步（Lockstep） | 車用、硬碟控制器、5G 基頻 |
| **Cortex-A** | 有 MMU，跑 Linux | 嵌入式 Linux、手機 |
| **RISC-V** | 開源指令集、可擴充 | ESP32-C 系列、GD32V、各種 SoC，快速成長 |
| **Xtensa** | Cadence 可配置核心 | ESP32（原版）、ESP32-S3、DSP |

## 6. 記憶體類型 🟡

| 類型 | 揮發性 | 特性 | 用途 |
|---|---|---|---|
| **SRAM** | 揮發 | 快、貴、容量小 | MCU 內部 RAM |
| **DRAM / SDRAM / DDR** | 揮發 | 需刷新、容量大 | MPU 主記憶體 |
| **NOR Flash** | 非揮發 | 可隨機讀取、**可原地執行（XIP）** | MCU 內部 Flash、外部 QSPI Flash |
| **NAND Flash** | 非揮發 | 容量大、便宜、有壞塊、需 ECC | eMMC、SD 卡、SSD |
| **EEPROM** | 非揮發 | 可逐 byte 改寫，壽命長 | 少量設定值 |
| **FRAM / MRAM** | 非揮發 | 寫入快、壽命極長 | 高頻率資料記錄 |

**Flash 的關鍵特性（面試常問）**：
- 寫入只能把 bit 從 **1 變 0**，要變回 1 必須**整個區塊（Sector/Page）抹除**
- 抹除後內容為 `0xFF`
- 有**抹寫次數限制**（NOR 約 1 萬～10 萬次），需要**磨損平均（Wear Leveling）**
- 抹寫期間，同一個 Bank 通常**無法讀取**（無法執行該 Bank 的程式碼）

## 7. Cache 與記憶體一致性 🔴

Cortex-M7、Cortex-A 有 L1 Cache。韌體最常踩到的坑：**DMA 與 Cache 不一致**。

| 情境 | 問題 | 解法 |
|---|---|---|
| CPU 寫入緩衝區 → DMA 傳送出去 | 資料還在 Cache 沒寫回 RAM，DMA 送出舊資料 | 傳送前 **Clean**（寫回）Cache |
| DMA 接收到 RAM → CPU 讀取 | CPU 讀到 Cache 中的舊資料 | 讀取前 **Invalidate**（作廢）Cache |
| 根本解法 | — | 把 DMA 緩衝區放在 **Non-cacheable** 區域（用 MPU 設定） |

另外，Cache 操作以 **Cache Line（M7 為 32 bytes）** 為單位，緩衝區應**對齊 Cache Line**，避免 invalidate 時誤傷相鄰變數。

## 8. MPU vs MMU 🔴

| | MPU（Memory Protection Unit） | MMU（Memory Management Unit） |
|---|---|---|
| 功能 | 設定區域存取權限（讀/寫/執行） | 虛擬位址 → 實體位址轉換 + 權限 |
| 存在於 | Cortex-M3 以上（可選） | Cortex-A |
| 用途 | 堆疊溢位偵測、隔離 RTOS 任務、禁止在 RAM 執行 | Linux 行程隔離 |

> 注意命名衝突：**MPU** 也可能指 **Microprocessor Unit**（微處理器），依上下文判斷。

## 9. 匯流排與周邊時脈 🟡

- **AHB**：高速匯流排，接 Flash、SRAM、DMA、GPIO（部分晶片）
- **APB**：低速匯流排，接 UART、I²C、Timer
- **使用任何周邊前，必須先開啟它的時脈**（如 STM32 的 `RCC->AHB1ENR`）——新手最常見的「暫存器寫了沒反應」原因
- **Flash Wait State**：CPU 時脈高於 Flash 存取速度時，必須設定等待週期，否則會讀錯指令導致當機。提高時脈**前**要先設定 wait state

## 10. 原子操作 🔴

| 方法 | 說明 |
|---|---|
| 關中斷 | 最簡單，單核有效 |
| **LDREX / STREX** | ARMv7-M 的獨佔存取指令，實作無鎖的讀-改-寫（C11 `stdatomic.h` 底層會使用） |
| **Bit-Banding** | Cortex-M3/M4 特有：把單一 bit 映射到一個 word 位址，寫入即原子設定該 bit（M7、M33 已移除） |
| 硬體原子暫存器 | 如 STM32 GPIO 的 **BSRR**（寫 1 設定或清除對應腳位，不需讀-改-寫） |

Cortex-M0/M0+ **沒有** LDREX/STREX，只能關中斷。

---

## 面試常問

### Q1. 什麼是 Memory-Mapped I/O？

周邊的控制與狀態暫存器被映射到 CPU 的記憶體位址空間中，CPU 以一般的 Load/Store 指令讀寫這些位址就能控制硬體。存取時必須透過 `volatile` 指標，避免編譯器最佳化掉讀寫。另一種方式是 **Port-Mapped I/O**（x86 的 `in`/`out` 指令），MCU 較少使用。

### Q2. 哈佛架構與馮紐曼架構差在哪？

見第 2 節。重點：哈佛架構的指令與資料有**分開的匯流排**，可同時存取，效能較好。Cortex-M3/M4 是「修正型哈佛」：有 I-Code / D-Code / System 多條匯流排，但程式看到的是單一統一位址空間。

### Q3. NOR Flash 與 NAND Flash 的差別？

NOR 可隨機存取、支援 XIP（直接執行程式），讀快寫慢、容量小、單價高，用於存程式碼。NAND 以 Page 為單位存取、容量大便宜、有壞塊需要 ECC 與壞塊管理，用於大量資料儲存。

### Q4. 為什麼 Flash 寫入前要先抹除？

Flash 的寫入（Program）只能把 bit 從 1 改成 0，只有抹除（Erase）能把一整個區塊恢復成全 1（`0xFF`）。因此要修改已寫過的資料，必須先抹除整個 Sector，再重新寫入。這也導致抹除區塊大、抹寫次數有限，需要磨損平均與雙區塊交替儲存。

### Q5. DMA 和 Cache 一起用要注意什麼？

見第 7 節：傳送前 clean、接收後 invalidate，或把緩衝區配置在 non-cacheable 區域，並對齊 Cache Line。

### Q6. Cortex-M 中 MSP 與 PSP 的差別？

**MSP（Main Stack Pointer）**：重置後預設使用，例外處理（ISR）一定使用 MSP。**PSP（Process Stack Pointer）**：RTOS 給各任務使用。這樣中斷不會佔用任務的堆疊，每個任務只需預留自己使用的空間，OS 核心與任務的堆疊也彼此分離。

### Q7. 為什麼周邊暫存器寫了沒反應？

最常見原因：
1. **沒開周邊時脈**（RCC）
2. 腳位的 Alternate Function 沒設定
3. 指標沒有 `volatile`，寫入被最佳化掉
4. 寫錯位址 / 寫錯 bit
5. 某些暫存器需要先解鎖（如看門狗、Flash 控制器）
6. 周邊處於重置狀態

## 過時技術（知道就好）

- **8051、PIC16、AVR（ATmega328）**：8-bit 架構，仍見於教學與極低成本產品，新設計多採 32-bit Cortex-M 或 RISC-V（32-bit MCU 價格已降至與 8-bit 接近）。
- **Bit-Banding**：Cortex-M7 與 ARMv8-M 已移除，新程式應改用 BSRR 類硬體原子暫存器或 LDREX/STREX。
- **ARM7TDMI / ARM9**：Cortex 系列之前的 ARM 核心，已被 Cortex-M / Cortex-A 取代。

## 本章回顧

- 周邊 = 記憶體上的某個位址，用 `volatile` 指標存取
- 用周邊前先開時脈；提高主頻前先設定 Flash wait state
- Flash：寫入 1→0、抹除才能回 1、有壽命
- DMA + Cache 要 clean / invalidate
- M33 有 TrustZone，是現代 IoT 安全的主流選擇；RISC-V 正在快速成長
