# 10. DMA 與資料緩衝設計

> **一句話**：DMA 讓硬體自己搬資料、CPU 去做別的事；搭配**環形緩衝區與雙緩衝**，就是高吞吐、低延遲資料流的標準解法。

---

## 1. 為什麼需要 DMA 🟢

以 UART 921600 bps 接收為例：每秒約 92,000 個 byte。若每個 byte 進一次中斷，CPU 光進出中斷就耗掉大量時間。

**DMA（Direct Memory Access）**：一個獨立的硬體搬運單元，可在**周邊 ↔ 記憶體、記憶體 ↔ 記憶體**之間搬資料，完成後才通知 CPU。

> 類比：CPU 是主管，DMA 是搬運工。主管只需交代「把這 1000 箱從 A 搬到 B，搬完叫我」。

## 2. DMA 設定要素 🟡

| 參數 | 說明 |
|---|---|
| 來源 / 目的位址 | 如 `&USART1->DR` → `rx_buf` |
| 傳輸方向 | P→M、M→P、M→M |
| 資料寬度 | 8 / 16 / 32-bit |
| 位址遞增 | 周邊位址通常固定、記憶體位址遞增 |
| 傳輸數量 | 要搬幾筆 |
| **模式** | Normal（搬完停止）/ **Circular（循環，搬完自動從頭）** |
| 觸發來源 | 哪個周邊的請求（DMA Request / DMAMUX） |
| 優先權 | 多個 DMA 通道競爭時 |
| 中斷 | **半滿（HT）**、全滿（TC）、錯誤（TE） |

## 3. 常見 DMA 應用 🟡

| 應用 | 架構 |
|---|---|
| UART 接收不定長資料 | DMA Circular + **IDLE Line 中斷**（線路閒置即視為一個封包結束） |
| ADC 連續取樣 | 計時器觸發 ADC + DMA Circular + 半滿/全滿中斷（雙緩衝） |
| SPI 螢幕刷新 | DMA M→P 傳送 frame buffer |
| 音訊 I²S | DMA Circular 雙緩衝 |
| 大量記憶體複製 | M→M DMA |
| **Scatter-Gather（鏈結串列 DMA）** | 一次描述多段不連續的傳輸（乙太網路、STM32 的 LPDMA/GPDMA、NXP eDMA） |

## 4. DMA 的陷阱 🔴

| 陷阱 | 說明 |
|---|---|
| **Cache 一致性** | 見第 03 章：TX 前 Clean、RX 後 Invalidate，或用 non-cacheable 區域 |
| 緩衝區位置 | 部分 DMA **無法存取某些 RAM**（如 STM32H7 的 DTCM 不能被 DMA1/2 存取，STM32F4 的 CCM RAM 不能被 DMA 存取） |
| 緩衝區生命週期 | **不能用區域變數當 DMA 緩衝區**：函式返回後堆疊被重用，DMA 仍在寫入 |
| 對齊 | 32-bit 傳輸需要 4-byte 對齊；cache 操作需 32-byte 對齊 |
| 同時被 CPU 修改 | DMA 傳送中修改緩衝區 → 送出混雜資料 |
| 匯流排競爭 | DMA 與 CPU 搶匯流排，影響即時性 |

## 5. 環形緩衝區（Ring Buffer / Circular Buffer）🟡

韌體**最常見的資料結構**，面試手寫題常客。

```
       tail（讀）            head（寫）
         ↓                    ↓
 [ . . . D A T A D A T A . . . . ]
```

### 5.1 設計重點

| 問題 | 解法 |
|---|---|
| 如何區分滿與空 | (a) 犧牲一格：`head == tail` 為空、`(head+1)%N == tail` 為滿；(b) 額外計數器；(c) **索引無限遞增**，用 `head - tail` 計算數量（需 N 為 2 的冪） |
| 取模效能 | N 取 2 的冪，用 `& (N-1)` |
| ISR 安全 | **SPSC**：生產者只寫 head、消費者只寫 tail → 單核不需鎖 |
| 記憶體順序 | 寫入資料**之後**才更新 head；多核或亂序 CPU 需記憶體屏障 |
| 滿了怎麼辦 | 丟棄新資料、覆蓋舊資料、或回報錯誤（依需求） |

### 5.2 實作（SPSC、2 的冪）

```c
#define RB_SIZE 256u                       // 必須是 2 的冪
typedef struct {
    uint8_t buf[RB_SIZE];
    volatile uint32_t head;                // 只由生產者（ISR）修改
    volatile uint32_t tail;                // 只由消費者（主程式）修改
} ringbuf_t;

static inline uint32_t rb_count(const ringbuf_t *rb) { return rb->head - rb->tail; }

bool rb_put(ringbuf_t *rb, uint8_t b) {    // 在 ISR 呼叫
    if (rb_count(rb) >= RB_SIZE) return false;     // 滿
    rb->buf[rb->head & (RB_SIZE - 1)] = b;
    __DMB();                                       // 確保資料先寫入
    rb->head++;
    return true;
}

bool rb_get(ringbuf_t *rb, uint8_t *b) {   // 在主程式呼叫
    if (rb_count(rb) == 0) return false;           // 空
    *b = rb->buf[rb->tail & (RB_SIZE - 1)];
    __DMB();
    rb->tail++;
    return true;
}
```

索引為 `uint32_t` 無限遞增，溢位後 `head - tail` 依然正確（無號減法環繞）。

## 6. 雙緩衝（Double Buffering / Ping-Pong）🟡

```
DMA 寫入 Buffer A ──▶ 半滿中斷：CPU 處理 A，DMA 繼續寫 B
DMA 寫入 Buffer B ──▶ 全滿中斷：CPU 處理 B，DMA 回頭寫 A
```

用一個 DMA Circular 緩衝區的**前半與後半**即可實現（HT / TC 中斷）。

**條件**：CPU 處理半個緩衝區的時間 **必須小於** DMA 填滿另一半的時間，否則資料被覆蓋（overrun）。

應用：音訊、ADC 連續取樣、顯示器（前後景 frame buffer 交換避免畫面撕裂）。

## 7. 其他常見資料結構 🟡

| 結構 | 用途 |
|---|---|
| 固定大小記憶體池 | 取代 malloc（第 06 章） |
| 侵入式鏈結串列（Intrusive Linked List） | RTOS 任務串列、計時器串列，不需額外配置節點（Linux `list_head`） |
| 位元圖 | 資源配置 |
| 查表（LUT） | sin 表、CRC 表、校正曲線，放 Flash |
| 狀態表 | 狀態機（第 14 章） |
| 優先權佇列 / 最小堆 | 軟體計時器 |

---

## 面試常問

### Q1. 什麼是 DMA？優點與注意事項？

見第 1、4 節。優點：釋放 CPU、高吞吐、降低中斷頻率、可在 CPU 睡眠時運作。注意：cache 一致性、緩衝區生命週期與位置、匯流排競爭。

### Q2. 實作一個環形緩衝區，並說明如何在 ISR 與主程式間安全使用。

見第 5 節。重點：2 的冪大小、SPSC 讓 head/tail 各由單一方修改、先寫資料再更新索引。

### Q3. 如何用 DMA 接收長度不固定的 UART 資料？

DMA 設為 Circular 模式持續接收到環形緩衝區，啟用 **UART IDLE 線路偵測中斷**；在 IDLE、DMA HT、TC 三個時機讀取 DMA 剩餘計數（NDTR），計算新資料的位置與長度，交給上層處理。

### Q4. 雙緩衝的原理與限制？

見第 6 節。限制：處理時間必須小於半個緩衝區的填充時間；緩衝區要夠大以吸收處理時間的抖動。

### Q5. 為什麼 DMA 緩衝區不能是區域變數？

DMA 是非同步運作，函式返回後區域變數所在的堆疊空間會被其他函式重用，DMA 持續寫入會破壞其他資料（甚至返回位址）。應使用全域或 static 緩衝區，並確認 DMA 可存取該記憶體區域。

## 過時技術（知道就好）

- **每個 byte 進一次中斷的 UART 接收**：低速（9600 bps）仍可用，但高速通訊應改用 DMA + IDLE 偵測或 FIFO。
- **固定通道對應的 DMA**：新晶片多採 DMAMUX 或通用 DMA（GPDMA），任何請求可對應任何通道。

## 本章回顧

- DMA = 硬體搬運工，完成後中斷通知
- Circular + HT/TC = 雙緩衝
- UART 不定長接收：DMA Circular + IDLE 中斷
- 環形緩衝區：2 的冪、SPSC、先寫資料再移索引
- 注意 cache、緩衝區位置與生命週期
