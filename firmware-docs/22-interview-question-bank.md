# 22. 韌體面試題庫（綜合實戰）

> **一句話**：韌體面試通常包含**C 語言觀念與輸出預測、位元運算、手寫程式、硬體與周邊、RTOS、系統設計、除錯情境**七大類。本章整理高頻題目與參考解答，前面各章的「面試常問」也請一起複習。

---

## 面試流程概覽 🟢

| 關卡 | 內容 |
|---|---|
| 筆試 / 線上測驗 | C 語言選擇題、輸出預測、位元運算、簡單程式 |
| 技術面試一 | C 深度、指標、記憶體、手寫程式（白板或共享編輯器） |
| 技術面試二 | 周邊、通訊協定、中斷、RTOS、專案深挖 |
| 系統設計 / 情境題 | 設計一個裝置的韌體架構、除錯情境 |
| 主管 / HR | 動機、協作、轉職原因 |

---

## 一、C 語言輸出預測 🟡

### Q1. 輸出是什麼？

```c
int a[5] = {1, 2, 3, 4, 5};
int *p = (int *)(&a + 1);
printf("%d %d\n", *(a + 1), *(p - 1));
```

**答案**：`2 5`。`&a` 的型別是 `int (*)[5]`，`&a + 1` 前進**整個陣列**（20 bytes），指向陣列尾端之後；`p - 1` 回到最後一個元素。

### Q2. 輸出是什麼？

```c
char s[] = "hello";
char *t   = "hello";
printf("%zu %zu %zu\n", sizeof(s), sizeof(t), strlen(s));
```

**答案**（32-bit ARM）：`6 4 5`。陣列包含結尾 `'\0'`；`t` 是指標（64-bit 系統為 8）；`strlen` 不含 `'\0'`。

### Q3. 輸出是什麼？

```c
uint8_t x = 0x80;
int8_t  y = (int8_t)x;
printf("%d %d\n", x >> 1, y >> 1);
```

**答案**：`64 -64`。`x` 為 128，提升為 int 後右移 → 64。`y` 為 -128，算術右移（實作定義，GCC/ARM 為算術）→ -64。

### Q4. 輸出是什麼？

```c
static int f(void) { static int n = 0; return ++n; }
int main(void) { f(); f(); printf("%d\n", f()); }
```

**答案**：`3`。`static` 區域變數只初始化一次，跨呼叫保留值。

### Q5. 這段程式有什麼問題？

```c
void delay(void) { int i; for (i = 0; i < 100000; i++); }
```

開啟最佳化後，編譯器可能**整個刪除**這個沒有副作用的迴圈。若要保留需使用 `volatile int i`，但更好的做法是使用計時器。

### Q6. 輸出是什麼？

```c
unsigned char c = 255;
c++;
printf("%d\n", c);
signed char d = 127;
d++;
printf("%d\n", d);
```

**答案**：`0`，以及 `-128`（實作上）。`c` 為無號，環繞為 0。`d++` 的運算本身以 int 進行（128），轉回 `signed char` 時超出範圍屬於**實作定義**的轉換（GCC 為 -128），而非有號溢位 UB。

### Q7. `sizeof` 是多少？（32-bit ARM，預設對齊）

```c
struct A { char c; double d; int i; };
struct B { char c; char d; int i; };
union  U { char c[5]; int i; };
```

**答案**：A = **24**（c@0, pad 7, d@8, i@16, pad 4 → 24；AAPCS 中 double 對齊 8）；B = **8**；U = **8**（最大成員 5 bytes，對齊 int 的 4 → 8）。

### Q8. 這兩行有何差別？

```c
const char *p = "abc";  p[0] = 'x';
char        q[] = "abc"; q[0] = 'x';
```

第一行修改**字串字面值**是 UB（通常放在 Flash/唯讀區，會 fault 或無效）；第二行 `q` 是 RAM 中的陣列副本，可以修改。

### Q9. 輸出是什麼？

```c
#define MUL(a, b) a * b
printf("%d\n", MUL(2 + 3, 4 + 5));
```

**答案**：`2 + 3 * 4 + 5 = 19`（不是 45）。巨集參數未加括號。

### Q10. 輸出是什麼？

```c
int x = 5;
int y = x++ + ++x;
```

**未定義行為**：同一序列點間修改 `x` 兩次。正確回答是指出 UB，而不是猜數字。

---

## 二、觀念快問快答 🟡

| 問題 | 重點答案 |
|---|---|
| `volatile` 用途？ | 硬體暫存器、ISR 共用、多任務共用；防最佳化，不保證原子性 |
| `const volatile` 可以嗎？ | 可以，唯讀狀態暫存器 |
| 指標可以是 volatile 嗎？ | 可以：`int * volatile p`（指標本身會被 ISR 改變） |
| `static` 全域與一般全域差別？ | 內部連結，只有本檔案可見 |
| 堆疊與堆積差別？ | 堆疊自動配置、LIFO、快；堆積手動配置、可能碎片化 |
| 什麼是記憶體洩漏？ | 配置後未釋放且失去參考 |
| `#include <>` 與 `""` 差別？ | `<>` 搜尋系統路徑；`""` 先搜尋目前目錄 |
| 什麼是 inline？ | 建議編譯器展開函式以減少呼叫開銷 |
| 函式參數如何傳遞？（ARM） | R0–R3 前四個參數，其餘放堆疊；回傳值 R0（64-bit 用 R0:R1） |
| 大端小端？ | 見第 01 章 |
| 什麼是 ISR？為什麼要短？ | 見第 09 章 |
| 什麼是 DMA？ | 見第 10 章 |
| Mutex vs Semaphore？ | 見第 12 章 |
| 優先權反轉？ | 見第 12 章 |
| I²C vs SPI？ | 見第 11 章 |
| 什麼是看門狗？ | 見第 08 章 |
| 什麼是 Bootloader？ | 見第 07 章 |
| 中斷與輪詢比較？ | 見第 09 章 |
| `.bss` 與 `.data`？ | 見第 04、06 章 |
| 什麼是可重入函式？ | 見第 12 章 |
| 什麼是 memory barrier？ | 確保記憶體存取順序：DMB/DSB/ISB |

---

## 三、手寫程式題（高頻）🔴

> 面試重點：**先問清楚需求與邊界條件**、處理 NULL 與長度、說明時間/空間複雜度、提到測試案例。

### P1. 實作 `memcpy` 與 `memmove`

```c
void *my_memcpy(void *dst, const void *src, size_t n) {
    uint8_t *d = dst;
    const uint8_t *s = src;
    while (n--) *d++ = *s++;
    return dst;
}

void *my_memmove(void *dst, const void *src, size_t n) {
    uint8_t *d = dst;
    const uint8_t *s = src;
    if (d == s || n == 0) return dst;
    if (d < s) {                       // 往前複製
        while (n--) *d++ = *s++;
    } else {                           // 重疊且 dst 在後：從尾端往回複製
        d += n; s += n;
        while (n--) *--d = *--s;
    }
    return dst;
}
```

追問：**memcpy 與 memmove 差別**（記憶體重疊時 memcpy 是 UB）；如何加速（先處理到 4-byte 對齊，再以 word 複製，最後處理尾端；或使用 DMA）。

### P2. 實作 `strlen`、`strcpy`、`strcmp`

```c
size_t my_strlen(const char *s) {
    const char *p = s;
    while (*p) p++;
    return (size_t)(p - s);
}

int my_strcmp(const char *a, const char *b) {
    while (*a && *a == *b) { a++; b++; }
    return (unsigned char)*a - (unsigned char)*b;
}
```

追問：為什麼要轉 `unsigned char`？（標準規定以 unsigned char 比較，避免 `char` 為有號時大於 127 的字元比較錯誤）。`strcpy` 的安全問題 → 使用 `strncpy`（注意不保證 `'\0'` 結尾）或 `snprintf`、`strlcpy`。

### P3. 實作 `atoi`（含正負號與溢位處理）

```c
#include <limits.h>
int my_atoi(const char *s) {
    if (!s) return 0;
    while (*s == ' ' || *s == '\t') s++;
    int sign = 1;
    if (*s == '+' || *s == '-') { if (*s == '-') sign = -1; s++; }
    long long v = 0;
    while (*s >= '0' && *s <= '9') {
        v = v * 10 + (*s - '0');
        if (sign * v > INT_MAX) return INT_MAX;
        if (sign * v < INT_MIN) return INT_MIN;
        s++;
    }
    return (int)(sign * v);
}
```

### P4. 整數轉字串 `itoa`（不使用 sprintf）

```c
char *my_itoa(int32_t value, char *buf) {          // buf 至少 12 bytes
    char tmp[11];
    int  i = 0;
    uint32_t u = (value < 0) ? (uint32_t)(-(int64_t)value) : (uint32_t)value;
    do { tmp[i++] = (char)('0' + u % 10); u /= 10; } while (u);
    char *p = buf;
    if (value < 0) *p++ = '-';
    while (i) *p++ = tmp[--i];
    *p = '\0';
    return buf;
}
```

追問：為什麼要轉成無號？（`-INT32_MIN` 會溢位）

### P5. 反轉字串（原地）

```c
void reverse(char *s) {
    if (!s || !*s) return;
    char *e = s + strlen(s);
    while (s < --e) { char t = *s; *s++ = *e; *e = t; }
}
```

### P6. 反轉單向鏈結串列

```c
typedef struct node { int val; struct node *next; } node_t;

node_t *reverse_list(node_t *head) {
    node_t *prev = NULL;
    while (head) {
        node_t *next = head->next;
        head->next = prev;
        prev = head;
        head = next;
    }
    return prev;
}
```

延伸：偵測環（快慢指標 Floyd）、找中點、合併兩個排序串列。

### P7. 環形緩衝區

見第 10 章第 5 節。面試要能說明：滿/空判斷方式、2 的冪取模、ISR 安全性（SPSC）。

### P8. 按鍵去彈跳（定時輪詢版）

```c
// 每 1ms 由計時器呼叫；raw 為目前讀到的腳位值（按下為 1）
#define DEBOUNCE_MS 20
typedef struct { uint8_t stable; uint8_t last_raw; uint16_t cnt; } debounce_t;

bool debounce_update(debounce_t *d, uint8_t raw, bool *pressed_event) {
    *pressed_event = false;
    if (raw != d->last_raw) {          // 狀態改變，重新計時
        d->last_raw = raw;
        d->cnt = 0;
    } else if (d->cnt < DEBOUNCE_MS) {
        if (++d->cnt == DEBOUNCE_MS && raw != d->stable) {
            d->stable = raw;           // 穩定 20ms，確認新狀態
            if (raw) *pressed_event = true;
            return true;               // 狀態有變化
        }
    }
    return false;
}
```

另一種經典寫法：**移位暫存器法** `state = (state << 1) | raw; if (state == 0xFF) pressed;`（連續 8 次取樣皆為 1）。

### P9. 封包解析狀態機

封包格式：`0xAA | LEN | PAYLOAD[LEN] | CHECKSUM`（CHECKSUM = LEN 與 PAYLOAD 的 XOR）。

```c
typedef enum { WAIT_SOF, WAIT_LEN, WAIT_DATA, WAIT_CHK } pstate_t;

typedef struct {
    pstate_t st;
    uint8_t  len, idx, chk;
    uint8_t  buf[64];
} parser_t;

// 每收到一個 byte 呼叫一次；回傳 true 表示收到完整且正確的封包
bool parser_feed(parser_t *p, uint8_t b) {
    switch (p->st) {
    case WAIT_SOF:
        if (b == 0xAA) p->st = WAIT_LEN;
        break;
    case WAIT_LEN:
        if (b == 0 || b > sizeof(p->buf)) { p->st = WAIT_SOF; break; }  // 長度檢查！
        p->len = b; p->idx = 0; p->chk = b;
        p->st = WAIT_DATA;
        break;
    case WAIT_DATA:
        p->buf[p->idx++] = b;
        p->chk ^= b;
        if (p->idx == p->len) p->st = WAIT_CHK;
        break;
    case WAIT_CHK:
        p->st = WAIT_SOF;
        return (b == p->chk);
    }
    return false;
}
```

追問：如何處理逾時（收到一半斷線）？→ 記錄最後收到 byte 的時間，超過門檻重設為 `WAIT_SOF`。如何避免 payload 中出現 0xAA 造成錯誤同步？→ 依賴長度 + 校驗，或改用 COBS/SLIP 編碼。

### P10. 對齊的 malloc

```c
// 回傳對齊到 align（2 的冪）的記憶體，並能正確釋放
void *aligned_malloc(size_t size, size_t align) {
    void *raw = malloc(size + align - 1 + sizeof(void *));
    if (!raw) return NULL;
    uintptr_t start = (uintptr_t)raw + sizeof(void *);
    uintptr_t aligned = (start + align - 1) & ~(uintptr_t)(align - 1);
    ((void **)aligned)[-1] = raw;      // 在對齊位址前方記錄原始指標
    return (void *)aligned;
}
void aligned_free(void *p) { if (p) free(((void **)p)[-1]); }
```

### P11. 判斷 CPU 端序 / 交換端序

見第 01 章 Q3、Q4。

### P12. 位元題組合

- 計算 1 的個數、判斷 2 的冪、反轉位元、交換奇偶位元 → 見第 05 章
- 找出陣列中唯一出現一次的數（其他都出現兩次）→ 全部 XOR
- 求兩數平均不溢位：`(a & b) + ((a ^ b) >> 1)`

### P13. 實作一個簡單的軟體計時器管理

需求：支援多個一次性/週期性計時器，由 1ms tick 驅動。重點：用陣列或依到期時間排序的串列存放；tick 中只比對與標記到期，**回呼在主迴圈執行**；使用無號差值判斷逾時以處理環繞。

### P14. 移動平均濾波器

```c
#define N 8                                  // 2 的冪
typedef struct { uint16_t buf[N]; uint32_t sum; uint8_t idx; } ma_t;

uint16_t ma_update(ma_t *m, uint16_t x) {
    m->sum += x - m->buf[m->idx];            // O(1)：加新減舊
    m->buf[m->idx] = x;
    m->idx = (m->idx + 1) & (N - 1);
    return (uint16_t)(m->sum / N);           // N 為 2 的冪，編譯器會轉為移位
}
```

注意：`x - m->buf[idx]` 在 int 提升下可為負值，與 `uint32_t sum` 相加依無號環繞仍得到正確結果。

---

## 四、硬體與周邊情境題 🔴

### H1. UART 收到亂碼，你會怎麼查？

鮑率與時脈設定 → 雙方格式（8N1）→ 共地 → TX/RX 是否接反 → 電位標準（RS-232 vs TTL）→ 示波器量 bit 寬度是否正確 → 是否 overrun（中斷來不及處理）。

### H2. I²C 有時候會卡住，整條匯流排都不能用，原因與處理？

Target 在傳輸中途被重置或 Controller 中途重置，Target 持續拉低 SDA。處理：偵測到 SDA 被拉低時，將 SCL 設為 GPIO 送出最多 9 個時脈脈衝，再送 STOP 條件；加入逾時與錯誤恢復；必要時以 GPIO 重置或斷電重啟感測器。

### H3. ADC 讀值跳動很大，怎麼改善？

硬體：檢查參考電壓穩定性、加 RC 濾波、訊號源阻抗與取樣時間、類比與數位接地；軟體：增加取樣時間、多次平均、中位數濾波、在 CPU 安靜時取樣（避免數位雜訊）、校正。

### H4. 系統每隔幾天就會當機一次，如何分析？

見第 17 章 Q5：重置原因、HardFault 記錄、堆疊高水位、資源洩漏趨勢、計數器溢位（49.7 天）、看門狗觸發來源、遠端崩潰分析。

### H5. 新板子燒錄後完全沒反應？

供電電壓 → 時脈（外部晶振是否起振）→ Reset 腳電位 → BOOT 腳設定 → 燒錄位址與 Linker Script 是否相符 → 向量表第一項（SP）是否正確 → 用除錯器停在 Reset_Handler 單步執行 → 是否卡在等待 HSE/PLL 就緒的迴圈。

### H6. 馬達一啟動，MCU 就重開機？

電源下陷觸發 BOR、或雜訊干擾 Reset 腳。檢查：示波器量 MCU 電源與 Reset 腳；馬達與 MCU 電源分離、加大儲能電容、飛輪二極體、改善接地與佈線；讀取重置原因確認。

---

## 五、韌體系統設計題 🔴

### 回答框架

```
1. 釐清需求：功能、效能、功耗、成本、環境、法規、量產規模
2. 硬體選型：MCU（核心、Flash/RAM、周邊、無線）、感測器、電源
3. 軟體架構：裸機 or RTOS、分層、任務切分與優先權、資料流
4. 關鍵機制：中斷/DMA、低功耗策略、儲存、通訊協定
5. 可靠性：看門狗、錯誤處理、斷電保護、OTA 與回滾
6. 安全性：Secure Boot、金鑰、加密通訊、除錯鎖定
7. 測試與量產：單元測試、HIL、產線燒錄與校正、日誌與遠端診斷
```

### S1. 設計一個電池供電的溫濕度感測器，每 5 分鐘上傳到雲端。

- **硬體**：BLE 或 LoRa/NB-IoT（依距離）、低功耗 MCU（nRF52/nRF54、STM32WL、ESP32-C6 若有 Wi-Fi）、I²C 溫濕度感測器（SHT4x）
- **流程**：RTC 喚醒 → 開感測器電源 → I²C 讀值 → 關感測器 → 累積多筆再批次傳送（降低無線耗電）→ 深度睡眠
- **功耗**：計算平均電流與電池壽命；GPIO 設類比；Tickless
- **可靠性**：傳送失敗時本地暫存（環形緩衝區存 Flash）、重傳與退避、看門狗
- **資料**：時間戳記（RTC + 網路校時）、序號去重、CRC
- **安全**：裝置獨立憑證、TLS/DTLS 或 BLE 加密配對、簽章 OTA
- **量產**：工廠校正、序號與金鑰燒錄

### S2. 設計一個透過 BLE 進行韌體更新的機制。

雙 slot Flash 分割 + MCUboot；手機 App 透過自訂 GATT Service 或 **SMP（MCUmgr）** 傳送映像；分段傳輸 + 序號 + 斷點續傳；接收完驗證雜湊與簽章；標記 test → 重開 → 新版自我測試 → confirm；失敗自動回滾；電量不足時拒絕更新；防降級。

### S3. 設計一個馬達控制器的韌體架構。

- **最高優先權 ISR**：PWM 週期中斷內執行電流迴路（FOC），ADC 與 PWM 同步觸發、DMA 讀取
- **中優先權**：速度迴路（1kHz）
- **低優先權任務**：通訊（CAN/UART）、參數管理、診斷
- **保護**：過電流比較器直接觸發 PWM Break（硬體，微秒級，不依賴軟體）、過溫、欠壓、堵轉偵測 → 進入 Safe State
- **時序驗證**：GPIO 打點確認控制迴路執行時間與抖動

### S4. 設計一個資料記錄器，將高速 ADC 資料寫入 SD 卡。

計時器觸發 ADC + DMA 雙緩衝 → 半滿/全滿中斷通知寫檔任務 → 寫檔任務以大區塊（如 4KB 對齊）寫入 SD（FatFs），避免小量寫入；緩衝區需能吸收 SD 卡寫入延遲尖峰（可能達數百 ms）→ 需要更大的多段緩衝佇列；斷電保護：定期 `f_sync`、檔案分段、電源偵測後緊急關檔。

---

## 六、行為與轉職題 🟢

### B1. 為什麼從軟體轉韌體？

建議方向：對「軟體控制實體世界」的興趣 + 具體行動（自學專案、開發板作品）+ 你帶來的價值（CI/CD、測試、雲端整合、架構能力）。避免只說「軟體太競爭」。

### B2. 你沒有韌體工作經驗，憑什麼勝任？

展示：GitHub 上的韌體專案（含 README、架構圖、示波器/邏輯分析儀截圖）、能清楚解釋專案中遇到的問題與除錯過程、與團隊目前痛點的連結（例如「我可以幫團隊建立韌體 CI 與 HIL 測試」）。

### B3. 請描述你遇過最難的 bug。

用 **STAR**（情境、任務、行動、結果）架構，強調**系統化的除錯方法**、使用的工具、根本原因，以及之後做了什麼預防（回歸測試、規範）。

## 本章回顧

- 輸出預測題考：陣列與指標、sizeof、整數提升、static、巨集、UB
- 手寫題高頻：memcpy/memmove、strlen/strcmp、atoi/itoa、鏈結串列、環形緩衝區、去彈跳、封包狀態機
- 情境題：用系統化步驟回答，從硬體到軟體
- 系統設計：需求 → 選型 → 架構 → 機制 → 可靠性 → 安全 → 測試量產
