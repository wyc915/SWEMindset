# 12. RTOS 即時作業系統

> **一句話**：RTOS 讓你把韌體拆成多個任務，並保證**高優先權工作在可預測的時間內被執行**。「即時」不是「快」，而是「**準時、可預測**」。

---

## 1. 韌體軟體架構演進 🟢

| 架構 | 說明 | 適用 |
|---|---|---|
| **Super Loop（大迴圈）** | `while(1)` 依序呼叫各功能 | 簡單裝置 |
| **前後台（Foreground/Background）** | 中斷處理緊急事件（前台）+ 主迴圈（後台） | 中小型裝置，最常見 |
| **協作式排程** | 任務主動讓出 CPU（事件迴圈、protothreads） | 低資源 |
| **搶佔式 RTOS** | 高優先權任務就緒時立即搶佔 | 功能多、即時性要求高 |
| 嵌入式 Linux | 完整 OS | 複雜應用 |

## 2. 即時系統分類 🟢

| 類型 | 錯過截止時間的後果 | 例子 |
|---|---|---|
| **硬即時（Hard）** | 系統失效、危險 | 安全氣囊、ABS、心律調節器 |
| **韌即時（Firm）** | 結果無用但不致命 | 視訊影格 |
| **軟即時（Soft）** | 品質下降 | 音樂播放、UI |

關鍵指標：**確定性（Determinism）**、**最壞執行時間（WCET）**、**抖動（Jitter）**、中斷延遲。

## 3. 任務（Task / Thread）🟡

每個任務擁有：
- **獨立堆疊**
- **TCB（Task Control Block）**：保存暫存器狀態、優先權、狀態、堆疊指標
- 優先權

### 3.1 任務狀態

```
         建立
          ↓
       ┌─────┐  被排程   ┌───────┐
       │Ready│ ───────▶ │Running│
       └─────┘ ◀─────── └───────┘
          ▲      被搶佔      │
          │                 │ 等待事件 / delay / 鎖
     事件發生                ▼
          │            ┌─────────┐
          └─────────── │ Blocked │
                       └─────────┘
       Suspended（被明確暫停，不參與排程）
```

### 3.2 FreeRTOS 任務範例

```c
void sensor_task(void *arg) {
    for (;;) {
        int16_t t = read_temperature();
        xQueueSend(g_temp_q, &t, 0);
        vTaskDelay(pdMS_TO_TICKS(100));     // 阻塞 100ms，讓出 CPU
    }
}
xTaskCreate(sensor_task, "sensor", 256 /* words */, NULL, 2 /* 優先權 */, NULL);
vTaskStartScheduler();                       // 不會返回
```

> 注意：FreeRTOS 的堆疊大小單位是 **word（StackType_t）**，不是 byte（ESP-IDF 的版本例外，單位是 byte）。

## 4. 排程（Scheduling）🟡

| 演算法 | 說明 |
|---|---|
| **固定優先權搶佔式** | RTOS 主流：永遠執行最高優先權的就緒任務 |
| **時間片輪轉（Round Robin）** | 同優先權任務輪流執行一個 tick |
| 協作式 | 任務不主動讓出就不切換 |
| **RMS（Rate Monotonic）** | 週期越短優先權越高；理論可排程上限 U ≤ n(2^(1/n) − 1)，n→∞ 約 69% |
| **EDF（Earliest Deadline First）** | 動態：截止時間最早者優先，上限 100%（Zephyr 支援） |

### 4.1 Tick 與 Tickless

- **System Tick**：週期性中斷（常為 1ms），用於 delay、逾時、時間片
- **Tickless Idle**：沒有任務要執行時停止 tick，直接睡到下一個事件 → **低功耗必備**

### 4.2 Context Switch（Cortex-M）

1. SysTick 或任務 API 觸發 **PendSV**（最低優先權）
2. PendSV Handler：保存目前任務的 R4–R11（R0–R3 等已被硬體壓棧）到其 PSP 堆疊，存 PSP 到 TCB
3. 選出下一個任務，從其 TCB 載入 PSP、恢復 R4–R11
4. 返回 → 硬體從新任務的堆疊出棧

**為什麼用 PendSV 且設為最低優先權**：確保 context switch 不會打斷其他 ISR，所有中斷處理完畢才切換。

## 5. 任務間通訊與同步 🟡

| 機制 | 用途 | 特性 |
|---|---|---|
| **Queue（佇列）** | 傳遞資料 | 複製資料（by value），可阻塞等待 |
| **Binary Semaphore** | 事件通知（ISR → 任務） | 0/1 |
| **Counting Semaphore** | 資源計數、事件累計 | 0～N |
| **Mutex** | 互斥存取共享資源 | **有擁有者、支援優先權繼承**、必須由取得者釋放、不可在 ISR 使用 |
| Recursive Mutex | 同一任務可重複取得 | — |
| **Event Group** | 等待多個條件（AND / OR） | 位元旗標 |
| **Task Notification** | 直接通知某任務 | FreeRTOS 最快最省記憶體，取代二元號誌 |
| Stream / Message Buffer | 位元組流、變長訊息 | 單一讀寫者 |
| 軟體計時器 | 延遲回呼 | 在 Timer 任務中執行 |

### 5.1 Semaphore vs Mutex（必考）

| | Binary Semaphore | Mutex |
|---|---|---|
| 目的 | **同步**（通知事件發生） | **互斥**（保護資源） |
| 擁有權 | 無，任何任務/ISR 可 give | 有，誰 take 誰 give |
| 優先權繼承 | 無 | **有** |
| ISR 可用 | 可 give（FromISR） | 不可 |

## 6. 經典並行問題 🔴

### 6.1 優先權反轉（Priority Inversion）

```
H（高）：  等待 mutex ──────────────── 被卡住 ─────────
M（中）：            ──── 搶佔 L，長時間執行 ────
L（低）：  持有 mutex ─┘                        └─ 釋放
```

H 被**不相干的 M** 間接阻擋。**著名案例：1997 年 NASA 火星探路者號（Mars Pathfinder）反覆重置**，最後透過遠端開啟 VxWorks 的優先權繼承選項修復。

| 解法 | 說明 |
|---|---|
| **優先權繼承（Priority Inheritance）** | L 持鎖時暫時提升到等待者 H 的優先權 |
| **優先權天花板（Priority Ceiling）** | 鎖有預設最高優先權，取得即提升，可同時避免死結 |
| 設計 | 縮短持鎖時間、避免跨優先權共享 |

### 6.2 死結（Deadlock）

四個必要條件（Coffman）：**互斥、持有並等待、不可搶奪、循環等待**。

預防：**固定取鎖順序**（打破循環等待）、取鎖設逾時、一次取得所有資源、減少鎖數量（用訊息傳遞取代共享記憶體）。

### 6.3 其他問題

| 問題 | 說明 |
|---|---|
| **飢餓（Starvation）** | 低優先權任務永遠得不到 CPU（高優先權任務從不阻塞） |
| 活結（Livelock） | 任務持續改變狀態但沒有進展 |
| 任務堆疊溢位 | 每個任務堆疊獨立，必須個別評估 |
| 重入（Reentrancy） | 函式被多任務同時呼叫 → 不可使用 static 狀態（`strtok` 不可重入，應用 `strtok_r`） |

## 7. 設計 RTOS 應用的原則 🔴

- **任務數量不要多**：每個任務要有明確職責與理由（通常 5～15 個）
- 優先權依**時間要求**而非重要性設定（RMS 思維）
- 任務間**優先用 Queue 傳遞訊息**，減少共享狀態（類似 Actor 模型，與你熟悉的 MQ 解耦思維相同）
- 長時間不阻塞的任務應放在低優先權
- **ISR 只通知，不做事**；使用 `xxxFromISR` 版本 API 並處理 `pxHigherPriorityTaskWoken`
- 盡量使用**靜態建立 API**
- 啟用堆疊溢位檢查、`configASSERT`、執行時間統計
- 用 **Tracealyzer、SEGGER SystemView** 可視化排程

## 8. 主流 RTOS 🟡

| RTOS | 特性 | 產業 |
|---|---|---|
| **FreeRTOS** | 最普及、MIT 授權、AWS 維護，核心小 | 通用 IoT、ESP-IDF 內建 |
| **Zephyr** | Linux 基金會主導、**裝置樹 + Kconfig**、內建大量驅動與 BLE/網路堆疊，**業界採用快速成長**（Nordic nRF Connect SDK 以此為基礎） | IoT、穿戴、工業 |
| **ThreadX（Eclipse ThreadX）** | 原 Azure RTOS，2024 年起開源並移交 Eclipse 基金會，有安全認證 | 消費電子、醫療 |
| **NuttX** | POSIX 相容，類 Linux API | 無人機（PX4）、Sony |
| **RT-Thread** | 中國開源，生態豐富 | 中國市場 |
| **VxWorks、QNX、INTEGRITY** | 商用、安全認證（ISO 26262 / DO-178C） | 航太、車用、醫療 |
| **SAFERTOS** | FreeRTOS 的安全認證版本 | 功能安全 |
| **AUTOSAR Classic OS** | 車用 ECU 標準（OSEK 衍生） | 汽車 |

---

## 面試常問

### Q1. 什麼是 RTOS？和一般作業系統有什麼不同？

RTOS 的核心目標是**確定性**：保證任務在可預測的時間內回應，排程以優先權搶佔為主，核心小、中斷延遲低、可在 MCU 上執行。一般 OS（Windows、Linux）追求平均吞吐量與公平性，延遲無法保證上限。

### Q2. Semaphore 與 Mutex 差別？

見 5.1 節。

### Q3. 什麼是優先權反轉？如何解決？

見 6.1 節。

### Q4. 死結的四個條件與預防方法？

見 6.2 節。

### Q5. Context switch 時發生了什麼？為什麼 Cortex-M 使用 PendSV？

見 4.2 節。

### Q6. 如何決定任務的堆疊大小？

靜態分析（`-fstack-usage`）估算最深呼叫鏈 + 中斷壓棧框架（Cortex-M 中斷使用 MSP，任務堆疊只需加上自身的例外框架）+ 安全餘量；實測使用 `uxTaskGetStackHighWaterMark()`；開啟 `configCHECK_FOR_STACK_OVERFLOW`。注意 `printf` 類函式、浮點格式化、大型區域陣列特別吃堆疊。

### Q7. ISR 中可以呼叫哪些 RTOS API？

只能呼叫**ISR 專用版本**（FreeRTOS 的 `xQueueSendFromISR`、`xSemaphoreGiveFromISR`、`vTaskNotifyGiveFromISR`），不可呼叫會阻塞的 API，也不可使用 mutex。結尾呼叫 `portYIELD_FROM_ISR(xHigherPriorityTaskWoken)`，使被喚醒的高優先權任務在 ISR 結束後立刻執行。並確認該中斷的優先權符合 `configMAX_SYSCALL_INTERRUPT_PRIORITY` 限制。

### Q8. 什麼是可重入函式？

可被多個任務或中斷同時呼叫而不出錯的函式：不使用 static/全域可變狀態、不回傳指向 static 資料的指標、只使用參數與區域變數、呼叫的其他函式也都可重入。

### Q9. 何時該用 RTOS、何時用 Super Loop？

功能少、時序簡單、資源極小 → Super Loop / 前後台。多個獨立且有不同時間要求的功能、需要網路或 BLE 堆疊、需要阻塞式 I/O 而不想寫複雜狀態機 → RTOS。代價：RAM（每個任務堆疊）、複雜度、並行問題。

### Q10. `vTaskDelay` 與 `vTaskDelayUntil` 的差別？

`vTaskDelay(n)`：從呼叫時起延遲 n tick，週期會因任務執行時間而漂移。`vTaskDelayUntil(&last, n)`（新版 `xTaskDelayUntil`）：以上次喚醒時間為基準，產生**固定週期**，適合週期性取樣與控制迴路。

## 過時技術（知道就好）

- **µC/OS-II / µC/OS-III**：經典教學 RTOS，2020 年開源（Micrium OS），新專案多改用 FreeRTOS 或 Zephyr。
- **OSEK/VDX**：車用 RTOS 規範，已被 AUTOSAR OS 承接。
- **自行從零開發 RTOS 用於產品**：學習很有價值，但產品應採用經驗證的 RTOS。

## 本章回顧

- 即時 = 可預測，不是快
- 搶佔式固定優先權 + PendSV context switch
- Semaphore 同步、Mutex 互斥（有優先權繼承）
- 優先權反轉（火星探路者）、死結四條件
- 優先用 Queue 傳遞訊息；ISR 只用 FromISR API
- 主流：FreeRTOS、Zephyr（快速成長）
