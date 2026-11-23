# 14. 韌體架構、驅動設計與設計模式

> **一句話**：好的韌體架構讓你**換晶片不用重寫、能在電腦上跑單元測試、多人協作不打架**。這正是軟體工程師轉職的最大優勢所在。

---

## 1. 分層架構 🟢

```
┌───────────────────────────────────────┐
│ Application（應用邏輯、狀態機、業務規則）    │
├───────────────────────────────────────┤
│ Middleware / Services                  │
│ （協定堆疊、檔案系統、OTA、日誌、命令列）   │
├───────────────────────────────────────┤
│ Device Drivers（感測器、Flash、顯示器）    │ ← 依賴 HAL 介面，不依賴特定 MCU
├───────────────────────────────────────┤
│ HAL（UART/I²C/SPI/GPIO 抽象介面）        │
├───────────────────────────────────────┤
│ BSP / MCU Vendor SDK / CMSIS           │
├───────────────────────────────────────┤
│ Hardware                               │
└───────────────────────────────────────┘
```

| 名詞 | 說明 |
|---|---|
| **CMSIS** | ARM 制定的 Cortex-M 標準：CMSIS-Core（暫存器定義、核心函式）、CMSIS-DSP、CMSIS-NN、CMSIS-RTOS2、CMSIS-Driver |
| **HAL** | 硬體抽象層，例：STM32 HAL、Zephyr device API |
| **LL（Low-Layer）** | 原廠提供的輕量暫存器封裝，比 HAL 更快更小 |
| **BSP** | 板級支援套件：特定板子的腳位、時脈、周邊初始化 |

## 2. 驅動程式設計原則 🟡

### 2.1 感測器驅動不要直接呼叫 MCU HAL

```c
// 定義 I²C 抽象介面
typedef struct {
    int (*write_reg)(void *ctx, uint8_t addr, uint8_t reg, const uint8_t *d, size_t n);
    int (*read_reg) (void *ctx, uint8_t addr, uint8_t reg, uint8_t *d, size_t n);
    void *ctx;
} i2c_bus_t;

// 感測器驅動只依賴介面
typedef struct {
    const i2c_bus_t *bus;
    uint8_t addr;
} tmp102_t;

int tmp102_read_celsius_x100(tmp102_t *dev, int32_t *out);
```

好處：
- **換 MCU** 只需實作新的 `i2c_bus_t`
- **單元測試**時注入假的 bus（mock），在 PC 上測試驅動邏輯
- 同一驅動可用於多個實例（多顆感測器）

> 對照你的經驗：這就是 **依賴反轉（DIP）+ 依賴注入**，在 C 中用「結構 + 函式指標」實現。

### 2.2 API 設計慣例

| 慣例 | 說明 |
|---|---|
| 回傳錯誤碼 | `int` 或 `enum`，0 為成功，負數為錯誤（Linux / Zephyr 風格 `-EIO`） |
| 輸出參數 | 資料透過指標回傳 |
| 前綴命名 | `模組_動作()`，例：`uart_init()`、`tmp102_read()`（C 沒有 namespace） |
| 不透明指標（Opaque Pointer） | 標頭只宣告 `typedef struct foo foo_t;`，隱藏內部結構（封裝） |
| 非同步 API | 傳入回呼函式或事件，避免阻塞 |
| 逾時參數 | 所有可能卡住的操作都要有逾時 |
| 錯誤不吞掉 | 每個回傳值都要檢查（MISRA 規定） |

## 3. 狀態機（State Machine）🟡

韌體**最重要的設計模式**。協定解析、按鍵、充電管理、連線流程、UI 都靠它。

### 3.1 switch-case 實作

```c
typedef enum { ST_IDLE, ST_CONNECTING, ST_CONNECTED, ST_ERROR } state_t;
typedef enum { EV_START, EV_OK, EV_FAIL, EV_TIMEOUT, EV_DISCONNECT } event_t;

static state_t s_state = ST_IDLE;

void fsm_handle(event_t ev) {
    switch (s_state) {
    case ST_IDLE:
        if (ev == EV_START) { start_connect(); s_state = ST_CONNECTING; }
        break;
    case ST_CONNECTING:
        if (ev == EV_OK)                         s_state = ST_CONNECTED;
        else if (ev == EV_FAIL || ev == EV_TIMEOUT) { schedule_retry(); s_state = ST_ERROR; }
        break;
    case ST_CONNECTED:
        if (ev == EV_DISCONNECT) s_state = ST_IDLE;
        break;
    case ST_ERROR:
        if (ev == EV_START) { start_connect(); s_state = ST_CONNECTING; }
        break;
    }
}
```

### 3.2 狀態表（Table-Driven）

```c
typedef struct { state_t from; event_t ev; state_t to; void (*action)(void); } transition_t;
static const transition_t table[] = {
    { ST_IDLE,       EV_START, ST_CONNECTING, start_connect },
    { ST_CONNECTING, EV_OK,    ST_CONNECTED,  NULL },
    /* ... */
};
```

優點：轉換規則一目了然、可放 Flash、易於產生文件與測試。

### 3.3 階層式狀態機（HSM）

狀態可以有子狀態，共用父狀態的事件處理，避免重複。代表框架：**QP/C（Quantum Leaps）**，搭配 UML 狀態圖。

### 3.4 設計守則

- 每個狀態的 **entry / exit 動作**要明確
- **處理所有事件**，包含「不預期事件」（記錄並忽略或進入錯誤狀態）
- 搭配逾時事件，**避免永遠卡在某狀態**
- 狀態轉換要記錄日誌，便於現場除錯

## 4. 事件驅動架構 🟡

```
ISR / 驅動 ──產生事件──▶ [事件佇列] ──▶ 事件分派器 ──▶ 各模組的狀態機
```

**Active Object 模式**：每個模組 = 一個任務 + 一個事件佇列 + 一個狀態機，模組間**只透過事件溝通、不共享資料**。避免大部分 mutex 與競爭條件。

> 這和你熟悉的 **訊息佇列 / 事件驅動微服務**是同一思維，只是規模縮小到單晶片內。

## 5. 常用設計模式（韌體版）🟡

| 模式 | 韌體應用 |
|---|---|
| **策略 / 介面** | 結構 + 函式指標實作驅動介面 |
| **觀察者 / 發布訂閱** | 事件匯流排、回呼註冊（Zephyr 的 zbus） |
| **單例** | 硬體只有一個（UART1），用 static 模組變數 |
| **工廠** | 依設定檔或 Device Tree 建立驅動實例 |
| **轉接器（Adapter）** | 包裝原廠 HAL 成自己的介面 |
| **命令（Command）** | CLI 命令表、協定命令分派 |
| **生產者-消費者** | ISR → 環形緩衝區 → 任務 |
| **雙緩衝** | DMA、顯示器 |
| **物件池** | 記憶體池 |

## 6. 設定與參數管理 🟡

| 方式 | 說明 |
|---|---|
| 編譯期設定 | `config.h`、**Kconfig**（Zephyr、ESP-IDF、Linux 使用） |
| 硬體描述 | **Device Tree**（Zephyr、Linux） |
| 執行期設定 | 存在 Flash 的參數區：KV store（Zephyr Settings、ESP NVS）、版本號 + CRC + 雙區備援 |
| 工廠資料 | 序號、校正值、金鑰，存在獨立的保護區或 OTP |

**參數區設計**：結構含 magic、版本、長度、CRC；寫入時交替寫兩個區塊（A/B），讀取時選有效且序號最新者 → 斷電安全。

## 7. 日誌與診斷 🟡

| 項目 | 實務 |
|---|---|
| 日誌等級 | ERROR / WARN / INFO / DEBUG，編譯期可移除 |
| 輸出通道 | UART、**SEGGER RTT**、**SWO/ITM**、USB CDC、存 Flash |
| 延遲格式化 | 只傳格式字串 ID 與參數，PC 端還原（**Trice、Zephyr dictionary logging、defmt（Rust）**），大幅降低 CPU 與 Flash 消耗 |
| CLI 命令列 | 現場除錯神器：讀暫存器、觸發測試、查狀態 |
| 指標（Metrics） | 重開次數、錯誤計數、電池電量、連線品質 |
| 遠端診斷 | **Memfault** 等平台：崩潰傾印、指標、OTA 一體化 |

> 這就是韌體版的**可觀測性**（Logs / Metrics / Traces），你的維運經驗可直接遷移。

## 8. 程式碼組織與版本 🟢

- 原廠程式碼、第三方函式庫與自己的程式碼**分開目錄**（`vendor/`、`third_party/`、`src/`）
- 依賴管理：Git submodule、**Zephyr west manifest**、ESP-IDF Component Manager、CMake FetchContent
- 版本號編入韌體（**SemVer + Git commit hash + 建置時間**），開機時印出並可查詢
- 韌體映像檔含 **header**（版本、大小、雜湊、簽章），給 Bootloader 驗證

---

## 面試常問

### Q1. 如何設計一個可移植、可測試的感測器驅動？

驅動只依賴抽象的匯流排介面（結構 + 函式指標或連結期替換），透過參數注入；所有狀態封裝在 device 結構中支援多實例；回傳錯誤碼並設逾時；測試時注入 mock bus 在 PC 上執行單元測試。

### Q2. 用狀態機設計一個按鍵處理：支援短按、長按、雙擊。

狀態：IDLE → PRESSED（記錄時間）→ 放開時若 < 長按門檻 → WAIT_SECOND（等待雙擊窗口）→ 窗口內再按 → 雙擊；窗口逾時 → 短按；PRESSED 持續超過長按門檻 → 長按並進入 LONG_HELD。輸入事件來自去彈跳後的按下/放開與計時器 tick。

### Q3. HAL 的優缺點？

優點：可移植、開發快、原廠維護。缺點：程式碼大、效能較差、抽象可能不符合需求、有時有 bug 或隱藏行為（如 HAL 在中斷中呼叫回呼）。實務上常**混用**：一般功能用 HAL，時間關鍵部分用 LL 或直接操作暫存器。

### Q4. 韌體如何做到「模組間低耦合」？

分層架構、介面抽象、事件/訊息傳遞取代直接呼叫、`static` 隱藏內部狀態、不透明指標、依賴注入、避免全域變數。

### Q5. 設計一個斷電安全的參數儲存機制。

雙區塊交替寫入；每筆記錄含 magic、序號、長度、CRC；寫入流程：抹除舊區塊 → 寫資料 → 最後寫入有效標記（或 CRC）；讀取時驗證兩區塊，選擇有效且序號較大者。或直接使用 LittleFS / NVS 等有日誌結構（log-structured）的方案。

## 過時技術（知道就好）

- **STM32 StdPeriph Library（SPL）**：已被 STM32Cube HAL/LL 取代。
- **Arduino 風格全域函式（`digitalWrite`）用於產品**：適合原型，量產產品需要更嚴謹的架構與錯誤處理。

## 本章回顧

- 分層：App / Middleware / Driver / HAL / BSP
- 驅動依賴介面，不依賴特定 MCU → 可移植、可測試
- 狀態機是韌體核心設計模式，記得處理逾時與非預期事件
- 事件驅動 + Active Object 減少共享資料
- 日誌、CLI、遠端診斷 = 韌體的可觀測性
