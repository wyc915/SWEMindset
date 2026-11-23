# 17. 除錯工具與量測儀器

> **一句話**：韌體除錯最大的不同是——**問題可能在軟體、硬體、時序或電源**。你需要「看得見訊號」的工具，以及一套有系統的排查方法。

---

## 1. 除錯介面 🟢

| 介面 | 腳位 | 說明 |
|---|---|---|
| **JTAG** | TCK、TMS、TDI、TDO、(TRST) | 業界標準，可串接多顆晶片（邊界掃描測試） |
| **SWD**（Serial Wire Debug） | SWDIO、SWCLK | **ARM Cortex-M 主流**，只要兩條線 |
| **SWO** | 1 條 | 單向追蹤輸出（ITM printf、事件） |
| ETM / Trace Port | 多條 | 指令級完整追蹤（高階除錯器） |
| cJTAG | 2 條 | 精簡版 JTAG |

### 1.1 除錯器（Debug Probe）

| 除錯器 | 說明 |
|---|---|
| **SEGGER J-Link** | 業界標竿、速度快、支援幾乎所有晶片、RTT、Ozone |
| **ST-LINK** | STM32 開發板內建 |
| **CMSIS-DAP / DAPLink** | ARM 開放標準，便宜（Raspberry Pi Debug Probe） |
| ESP-Prog / ESP32 內建 USB-JTAG | ESP32 |
| Lauterbach TRACE32 | 高階商用，車用/SoC |

### 1.2 軟體

| 工具 | 說明 |
|---|---|
| **GDB** + OpenOCD / pyOCD / J-Link GDB Server | 開源標準組合 |
| VS Code + **Cortex-Debug** 擴充 | 開源 IDE 主流 |
| STM32CubeIDE、MCUXpresso、Keil、IAR | 原廠 / 商用 IDE |
| **SEGGER Ozone** | 獨立除錯器，支援 trace 與 fault 分析 |
| probe-rs | Rust 生態的除錯工具（也可用於 C） |

### 1.3 常用 GDB 指令

| 指令 | 用途 |
|---|---|
| `break main` / `b file.c:42` | 中斷點 |
| `watch var` | **資料監看點（硬體 watchpoint）**：變數被寫入時停止——追查記憶體被誰改壞的利器 |
| `continue` / `step` / `next` / `finish` | 執行控制 |
| `bt` | 呼叫堆疊 |
| `info registers` | 暫存器 |
| `x/16xw 0x20000000` | 檢視記憶體 |
| `p/x var` | 十六進位印出 |
| `monitor reset halt` | 透過 GDB Server 重置晶片 |
| `load` | 燒錄 |

> Cortex-M 的**硬體中斷點數量有限**（M3/M4 通常 6 個、M0+ 通常 4 個，watchpoint 2～4 個），在 Flash 執行的程式碼無法使用軟體中斷點。

## 2. 輸出日誌的方式 🟢

| 方式 | 優點 | 缺點 |
|---|---|---|
| UART printf | 最簡單 | 慢、阻塞、改變時序、占用腳位 |
| **SEGGER RTT** | 透過除錯介面存取 RAM 緩衝區，**極快且幾乎不影響時序** | 需要 J-Link（也有開源實作） |
| **SWO / ITM** | 硬體追蹤，低侵入 | M0/M0+ 不支援 |
| Semihosting | 透過除錯器使用主機的 I/O | **非常慢**，未接除錯器時會卡住 |
| **GPIO 打點（Toggle Pin）** | 最低侵入，配合示波器量時間 | 資訊量少 |
| 日誌存 Flash | 現場事後分析 | 需要管理空間與磨損 |

**Heisenbug（觀察者效應）**：加了 printf 問題就消失 → 通常是**時序或競爭條件**問題，改用 GPIO 打點或 RTT。

## 3. 量測儀器 🟡

### 3.1 三大必備

| 儀器 | 看什麼 | 用途 |
|---|---|---|
| **萬用電表** | 電壓、電流、電阻、通斷 | 確認供電、短路、上拉電阻 |
| **示波器（Oscilloscope）** | **類比波形**、時間、電壓 | 訊號品質（過衝、振鈴、上升時間）、電源雜訊、時序量測 |
| **邏輯分析儀（Logic Analyzer）** | 多通道**數位訊號** + **協定解碼** | UART / I²C / SPI / CAN 解碼，看封包內容與時序 |

| | 示波器 | 邏輯分析儀 |
|---|---|---|
| 通道數 | 2～4（MSO 可加數位通道） | 8～32 |
| 看到的 | 真實電壓波形 | 只有 0/1 |
| 擅長 | 訊號品質、類比問題 | 長時間擷取、協定解碼 |
| 入門選擇 | Rigol、Siglent | **Saleae Logic**（軟體好用）、便宜的 24MHz 8ch + **sigrok / PulseView** |

### 3.2 其他工具

- **可調式電源供應器**（限流保護！避免短路燒板子）
- 電流分析儀（PPK2、Joulescope，見第 15 章）
- 頻譜分析儀（RF、EMI）
- CAN 分析器（PCAN、Kvaser、CANable）
- USB 協定分析儀
- 熱像儀（找發熱/短路元件）

### 3.3 示波器基本操作

- **觸發（Trigger）**：設定在什麼條件下擷取（上升沿、脈寬、協定條件）—— 捕捉偶發問題的關鍵
- 時基（Time/div）、電壓刻度（V/div）
- 探棒接地要短（長接地線會造成假振鈴）、×10 探棒要校正
- 單次擷取（Single）捕捉一次性事件

## 4. 系統化除錯方法 🟡

```
1. 重現：找出穩定重現的條件（溫度、電壓、操作順序、執行時間）
2. 收集證據：日誌、重置原因、fault 暫存器、示波器波形
3. 二分法縮小範圍：
   ├─ 硬體 or 軟體？→ 換板子、跑最小程式、量測訊號
   ├─ 哪個模組？→ 逐一停用功能
   └─ 哪個版本開始？→ git bisect
4. 提出假設 → 設計實驗驗證 → 修正
5. 寫成回歸測試，避免再犯
```

### 4.1 常見症狀與可能原因

| 症狀 | 優先檢查 |
|---|---|
| 完全沒反應 | 供電、時脈、Reset 腳、BOOT 腳、燒錄位址 |
| 隨機當機 / 重開 | **堆疊溢位**、看門狗、電源下陷（BOR）、未初始化變數、中斷競爭 |
| 只有 Release 版出錯 | **缺少 volatile**、UB、時序改變、未初始化變數 |
| 加 printf 就正常 | 競爭條件、時序、堆疊大小改變 |
| 長時間執行後才出錯 | 記憶體洩漏 / 碎片、計數器溢位（49.7 天）、資源未釋放、Flash 磨損 |
| 只有特定板子出錯 | 硬體公差、焊接、晶片批次（查 Errata） |
| 高溫/低溫才出錯 | 時脈飄移、Flash 時序、電源 |
| 通訊亂碼 | 鮑率/時脈、共地、電位、模式設定（SPI mode） |
| 接上除錯器就正常 | 除錯器影響低功耗模式或時序、Reset 時序 |

## 5. 進階：效能分析 🔴

| 方法 | 說明 |
|---|---|
| **DWT CYCCNT** | Cortex-M3 以上的週期計數器，量測函式執行時間 |
| GPIO 打點 + 示波器 | 量 ISR 執行時間與延遲 |
| **SEGGER SystemView、Percepio Tracealyzer** | RTOS 任務排程可視化、CPU 使用率 |
| 取樣式 Profiler | 週期中斷取樣 PC 值統計熱點 |
| ETM 指令追蹤 | 完整執行流程、程式碼覆蓋率 |

```c
// DWT 週期計數器
CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
DWT->CYCCNT = 0;
DWT->CTRL  |= DWT_CTRL_CYCCNTENA_Msk;
uint32_t t0 = DWT->CYCCNT;
do_work();
uint32_t cycles = DWT->CYCCNT - t0;
```

---

## 面試常問

### Q1. JTAG 與 SWD 的差別？

JTAG 是 IEEE 1149.1 標準，4～5 條線，可串接多晶片、支援邊界掃描；SWD 是 ARM 定義的兩線除錯協定，功能涵蓋 Cortex-M 除錯需求、腳位更少，是 Cortex-M 主流。多數 ARM 晶片的 SWJ-DP 同時支援兩者。

### Q2. 示波器與邏輯分析儀何時用哪個？

看訊號品質（雜訊、振鈴、電壓位準、上升時間、電源漣波）→ 示波器；看多條數位訊號的時序關係、協定內容、長時間擷取 → 邏輯分析儀。

### Q3. 程式在 Debug 版正常、Release 版異常，可能原因？

缺少 `volatile`、未定義行為被最佳化利用、未初始化變數（Debug 版可能剛好為 0）、時序改變暴露競爭條件、堆疊用量改變、編譯器 bug（極少）。排查：開啟 `-Wall -Wextra`、UBSan（在主機上跑測試）、靜態分析、逐檔調整最佳化等級。

### Q4. 某個全域變數莫名其妙被改掉，怎麼查？

1. 用**硬體 watchpoint**（`watch g_var`）抓出寫入它的指令
2. 查 `.map` 看它的鄰居：鄰近陣列越界？
3. 檢查堆疊是否溢位到 .bss
4. 檢查 DMA 目的位址與長度
5. 檢查懸空指標

### Q5. 裝置在現場每幾天重開一次，如何分析？

讀取並上報重置原因；在 HardFault 中記錄 PC/LR/CFSR 到 `.noinit` 或 Flash；記錄堆疊高水位與 heap 使用量趨勢；檢查計數器溢位與資源洩漏；看門狗觸發時記錄是哪個任務沒回報；導入遠端崩潰分析平台（如 Memfault）。

### Q6. 如何量測一段 ISR 的執行時間？

進入時拉高 GPIO、離開時拉低，用示波器量脈寬（同時可看延遲與抖動）；或使用 DWT CYCCNT 計算週期數；或使用 SystemView 追蹤。

## 過時技術（知道就好）

- **ICE（In-Circuit Emulator）實體模擬器**：已被晶片內建的除錯單元 + JTAG/SWD 取代。
- **只靠 LED 閃爍除錯**：仍是最後手段，但現代工具（RTT、SWO、邏輯分析儀）已非常便宜。

## 本章回顧

- Cortex-M 除錯靠 SWD；J-Link / ST-LINK / CMSIS-DAP + GDB
- 硬體 watchpoint 抓記憶體被誰改
- RTT / GPIO 打點：低侵入日誌與時序量測
- 三大儀器：萬用電表、示波器、邏輯分析儀
- 二分法：硬體 or 軟體 → 哪個模組 → 哪個版本
