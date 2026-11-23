# 04. 嵌入式 C 語言

> **一句話**：C 是韌體的母語。面試不考你會不會寫迴圈，而是考**指標、關鍵字語意、記憶體佈局、未定義行為**——這些決定程式在硬體上會不會出事。

---

## 1. 為什麼是 C 🟢

- 可直接操作記憶體與位址
- 執行期幾乎沒有額外負擔（無 GC、無 runtime）
- 每顆 MCU 都有 C 編譯器，原廠 SDK 與 RTOS 都是 C
- 可預測的程式碼大小與執行時間

> 對照你的背景：C# / JavaScript 有 GC 與邊界檢查，C 沒有。**陣列越界不會丟例外，而是默默寫壞別人的記憶體**。

## 2. 固定寬度整數型別 🟢

**永遠使用 `<stdint.h>`**，因為 `int` 的長度依平台而定（8-bit AVR 是 16-bit，ARM 是 32-bit）。

| 型別 | 說明 |
|---|---|
| `uint8_t` / `int8_t` | 8-bit |
| `uint16_t` / `int16_t` | 16-bit |
| `uint32_t` / `int32_t` | 32-bit |
| `uint64_t` | 64-bit（32-bit MCU 上運算較慢） |
| `size_t` | 物件大小，`sizeof` 的結果 |
| `uintptr_t` | 可存放指標的整數 |
| `bool`（`<stdbool.h>`） | 布林 |

## 3. 關鍵字語意（必考）🟡

### 3.1 `volatile`

告訴編譯器：此變數可能在程式碼看不到的地方被改變，**每次存取都必須實際讀寫記憶體**。

```c
volatile bool g_rx_done = false;     // ISR 設定、主迴圈讀取

void UART_IRQHandler(void) { g_rx_done = true; }

int main(void) {
    while (!g_rx_done) { }           // 沒有 volatile，編譯器可能變成無窮迴圈
}
```

使用時機：**硬體暫存器、ISR 與主程式共用變數、多任務共用旗標**。

⚠️ `volatile` **不保證原子性、不提供記憶體屏障（memory barrier）**，不是同步機制。

### 3.2 `const`

| 寫法 | 意義 |
|---|---|
| `const int *p` | 指向的**內容不可改**，指標可改 |
| `int * const p` | **指標本身不可改**，內容可改 |
| `const int * const p` | 都不可改 |

記法：**`const` 修飾它左邊的東西**（若左邊沒東西則修飾右邊）。由右往左讀：`int * const p` → 「p 是 const 指標，指向 int」。

韌體意義：`const` 全域資料會被放在 **Flash（.rodata）**，不佔寶貴的 RAM。查表（lookup table）一定要加 `const`。

### 3.3 `volatile const` 同時使用？

可以。例如**唯讀的硬體狀態暫存器**：程式不能寫（const），但硬體會改變它（volatile）。

```c
#define STATUS_REG (*(volatile const uint32_t *)0x40001000u)
```

### 3.4 `static` 的三種意義

| 位置 | 意義 |
|---|---|
| 函式內區域變數 | 生命週期延長到整個程式，**只初始化一次**，放在 .data/.bss |
| 檔案層級全域變數 | **內部連結（internal linkage）**：只有本檔案看得到，用於封裝 |
| 函式 | 只有本檔案可呼叫 |

韌體慣例：模組內部狀態一律 `static`，類似 C# 的 `private`。

### 3.5 `extern`

宣告變數或函式定義在其他檔案。標頭檔中用 `extern` 宣告，`.c` 檔中定義一次。

### 3.6 `inline`、`restrict`、`register`

- `static inline`：建議編譯器內聯展開，常用於取代函式型巨集
- `restrict`：保證指標是存取該記憶體的唯一途徑，讓編譯器做更積極的最佳化（`memcpy` 的參數就是 restrict）
- `register`：過時，現代編譯器忽略

## 4. 指標（核心中的核心）🟡

### 4.1 基礎

```c
int  x = 10;
int *p = &x;      // p 存放 x 的位址
*p = 20;          // 透過指標修改 x
```

### 4.2 指標運算

指標加 1 會前進 **`sizeof(指向型別)`** 個 byte：

```c
uint32_t arr[4];
uint32_t *p = arr;
p + 1;            // 位址前進 4 bytes
(uint8_t *)p + 1; // 位址前進 1 byte
```

### 4.3 陣列與指標的關係

- 陣列名稱在多數情況會**退化（decay）**成指向首元素的指標
- 但 `sizeof(arr)` 回傳整個陣列大小，`sizeof(ptr)` 回傳指標大小
- **陣列傳入函式後會退化成指標**，函式內無法用 `sizeof` 求長度 → 必須另外傳長度

```c
#define ARRAY_SIZE(a) (sizeof(a) / sizeof((a)[0]))
```

### 4.4 複雜宣告（面試經典）

| 宣告 | 意義 |
|---|---|
| `int *a[10]` | 10 個 `int*` 組成的陣列 |
| `int (*a)[10]` | 指向「10 個 int 陣列」的指標 |
| `int (*f)(int)` | 函式指標：參數 int，回傳 int |
| `int (*f[4])(int)` | 4 個函式指標的陣列 |
| `int **pp` | 指向指標的指標 |

讀法：**順時針螺旋法則**，從變數名開始，先右後左。

### 4.5 函式指標與回呼

韌體大量使用：中斷向量表、驅動程式介面、狀態機、回呼函式。

```c
typedef void (*uart_rx_cb_t)(uint8_t byte);

static uart_rx_cb_t s_cb;
void uart_register_rx_cb(uart_rx_cb_t cb) { s_cb = cb; }
```

用結構 + 函式指標實作「介面」（類似 C# interface）：

```c
typedef struct {
    int (*init)(void);
    int (*read)(uint8_t *buf, size_t len);
    int (*write)(const uint8_t *buf, size_t len);
} serial_ops_t;
```

### 4.6 危險指標

| 名稱 | 說明 |
|---|---|
| **野指標（Wild Pointer）** | 未初始化的指標 |
| **懸空指標（Dangling Pointer）** | 指向已釋放或已離開作用域的記憶體（如回傳區域變數的位址） |
| **NULL 指標解參考** | Cortex-M 上位址 0 通常是向量表，**讀取不一定會當機**，這讓錯誤更難發現 |

## 5. 結構、對齊與填充（必考）🟡

### 5.1 對齊規則

CPU 存取 N-byte 資料時，位址最好（或必須）是 N 的倍數。編譯器會自動在成員間插入**填充（padding）**。

```c
struct A {
    uint8_t  a;   // offset 0
                  // padding 3 bytes
    uint32_t b;   // offset 4
    uint8_t  c;   // offset 8
                  // padding 3 bytes（結構總大小須為最大成員對齊的倍數）
};                // sizeof = 12

struct B {
    uint32_t b;   // offset 0
    uint8_t  a;   // offset 4
    uint8_t  c;   // offset 5
                  // padding 2 bytes
};                // sizeof = 8
```

**優化技巧**：成員**由大到小排列**可減少 padding。

### 5.2 `packed`

```c
typedef struct __attribute__((packed)) {
    uint8_t  type;
    uint32_t value;
} msg_t;          // sizeof = 5
```

用於通訊協定封包。代價：
- 存取未對齊成員較慢
- **Cortex-M0/M0+ 不支援未對齊存取**，直接觸發 HardFault（編譯器通常會自動產生逐 byte 存取，但若取成員位址再透過一般指標存取就會出事）
- 結果不可攜 → 更穩健的做法是**手動序列化**（逐 byte 組合）

### 5.3 位元欄位（Bit-field）

```c
struct {
    uint32_t enable : 1;
    uint32_t mode   : 3;
    uint32_t        : 4;   // 保留
    uint32_t prescale : 8;
} cfg;
```

⚠️ 位元順序、填充、是否跨越儲存單元**由編譯器實作定義**，**不建議用來映射硬體暫存器或通訊協定**。產業主流（CMSIS）做法是用**巨集遮罩與移位**。

### 5.4 `union`

所有成員共用同一塊記憶體。

```c
typedef union {
    uint32_t word;
    uint8_t  bytes[4];
} word_u;
```

用途：型別雙關（type punning，C 中透過 union 是允許的；C++ 中是 UB）、節省記憶體、tagged union。

## 6. 記憶體佈局 🟡

| 區段 | 內容 | 位置 |
|---|---|---|
| **.text** | 程式碼 | Flash |
| **.rodata** | `const` 常數、字串字面值 | Flash |
| **.data** | **有初始值**的全域/static 變數 | 執行時在 RAM，初始值存在 Flash，開機時複製 |
| **.bss** | **未初始化或初始化為 0** 的全域/static 變數 | RAM，開機時清零 |
| **Heap** | `malloc` 配置 | RAM |
| **Stack** | 區域變數、函式返回位址 | RAM，通常由高位址往下成長 |

```c
int g1 = 5;              // .data
int g2;                  // .bss
static int g3 = 0;       // .bss（初始化為 0 也放 .bss）
const int g4 = 7;        // .rodata（Flash）
void f(void) {
    int local;           // stack
    static int cnt;      // .bss
    char *s = "hi";      // s 在 stack，"hi" 在 .rodata
    int *p = malloc(4);  // p 在 stack，指向 heap
}
```

詳細見第 06 章。

## 7. 為什麼韌體避免 `malloc` 🟡

| 問題 | 說明 |
|---|---|
| **記憶體碎片化** | 長期運行後，總空間足夠但沒有連續大區塊 → 配置失敗 |
| 執行時間不確定 | 違反即時性要求 |
| 失敗難以處理 | 嵌入式裝置沒有使用者可以「重開一下」 |
| 非執行緒安全 | 需要額外鎖 |
| 安全規範禁止 | MISRA C 規定不使用動態記憶體 |

**替代方案**：靜態配置、**記憶體池（Memory Pool，固定大小區塊）**、開機時一次配置之後不釋放、RTOS 的靜態建立 API（`xTaskCreateStatic`）。

## 8. 前處理器與巨集 🟡

### 8.1 巨集陷阱

```c
#define SQUARE(x) x * x
SQUARE(1 + 2)   // 展開成 1 + 2 * 1 + 2 = 5，不是 9

#define SQUARE(x) ((x) * (x))   // 正確：每個參數與整體都加括號
SQUARE(i++)                    // 仍有問題：i 被遞增兩次（UB）
```

**多行巨集用 `do { } while (0)`**，確保在 `if` 中使用時行為正確：

```c
#define SWAP(a, b) do { int _t = (a); (a) = (b); (b) = _t; } while (0)
```

**原則**：能用 `static inline` 函式或 `enum` / `const` 就不要用巨集。

### 8.2 常用技巧

- `#ifndef / #define / #endif` 或 `#pragma once`：標頭檔防護
- `#` 字串化、`##` 連接 token
- 條件編譯：`#if defined(STM32F4)` 切換平台
- `_Static_assert(sizeof(msg_t) == 5, "size mismatch");`：**編譯期檢查**（C11）

## 9. 整數提升與隱式轉換（陷阱）🔴

**整數提升（Integer Promotion）**：比 `int` 小的型別在運算前會被提升為 `int`。

```c
uint8_t a = 200, b = 100;
uint8_t c = a + b;          // a+b 以 int 計算 = 300，存回 uint8_t 截斷為 44

uint8_t x = 0x0F;
if (~x == 0xF0) { }         // 永遠不成立！~x 是 int，值為 0xFFFFFFF0
if ((uint8_t)~x == 0xF0) { }// 正確
```

**有號與無號比較**：

```c
int      i = -1;
unsigned u = 1;
if (i < u) { }              // 不成立！i 被轉成 unsigned = 0xFFFFFFFF
```

**移位陷阱**：

```c
uint32_t m = 1 << 31;       // 1 是 int，左移進符號位 → UB（C 標準下）
uint32_t m = 1u << 31;      // 正確
uint64_t n = 1u << 40;      // 錯誤：1u 是 32-bit，移位超過寬度是 UB
uint64_t n = 1ull << 40;    // 正確
```

## 10. 未定義行為（UB）清單 🔴

| UB | 範例 |
|---|---|
| 有號整數溢位 | `INT_MAX + 1` |
| 移位量 ≥ 型別寬度或為負 | `x << 32` |
| 陣列越界 | `arr[10]`（長度 10） |
| 解參考 NULL 或懸空指標 | — |
| 未初始化的區域變數 | 讀取值不確定 |
| 同一序列點間修改同一變數兩次 | `i = i++ + 1;` |
| 違反 strict aliasing | 用 `float*` 讀取 `int` 物件 |
| 有號負數右移 | **實作定義**（非 UB），多數編譯器為算術右移 |

**為什麼重要**：開啟 `-O2` 後，編譯器會利用 UB「不會發生」的假設做最佳化，導致 Debug 版正常、Release 版出錯。

## 11. 編譯器與工具鏈 🟡

| 工具 | 說明 |
|---|---|
| **arm-none-eabi-gcc** | ARM 官方 GNU 工具鏈，開源主流 |
| **Clang/LLVM** | 診斷訊息好，ARM 官方也有 LLVM 工具鏈 |
| **IAR、Keil（ARM Compiler 6）** | 商用，車用/醫療常見，有安全認證版本 |
| **newlib / newlib-nano / picolibc** | 嵌入式 C 標準函式庫 |

常用編譯選項：

| 選項 | 用途 |
|---|---|
| `-mcpu=cortex-m4 -mthumb -mfpu=fpv4-sp-d16 -mfloat-abi=hard` | 指定目標 |
| `-Os` / `-O2` | 最佳化大小 / 速度 |
| `-Wall -Wextra -Werror` | 警告即錯誤 |
| `-ffunction-sections -fdata-sections` + `-Wl,--gc-sections` | 移除未使用的程式碼 |
| `-g` | 除錯資訊（不影響燒錄大小） |

## 12. C++ 在韌體中 🔴

可以用，但通常**限制子集**：
- 禁用例外（`-fno-exceptions`）、RTTI（`-fno-rtti`）
- 避免動態配置與 STL 容器（或使用 ETL —— Embedded Template Library）
- 善用：`constexpr`、template、`enum class`、RAII（如自動釋放鎖）、namespace

---

## 面試常問

### Q1. `volatile` 是什麼？什麼時候用？能保證執行緒安全嗎？

見第 3.1 節。三大使用時機：硬體暫存器、ISR 共用變數、多任務共用變數。**不能保證**執行緒安全：它不保證原子性也不提供記憶體屏障，`counter++` 在 volatile 下仍是「讀-改-寫」三步驟，可能被中斷打斷。

### Q2. `const int *p`、`int const *p`、`int * const p` 差別？

前兩者相同：指向的內容不可改。第三個是指標本身不可改。

### Q3. `static` 有哪些用法？

見第 3.4 節：函式內延長生命週期、檔案層級限制可見性、函式限制可見性。

### Q4. 下列結構的 `sizeof` 是多少？（32-bit ARM）

```c
struct S { char a; int b; short c; char d; };
```

a(0) + pad(1~3) + b(4~7) + c(8~9) + d(10) + pad(11) = **12**。

若重排為 `int b; short c; char a; char d;` → **8**。

### Q5. 寫一個巨集求兩數最大值，有什麼問題？

```c
#define MAX(a, b) ((a) > (b) ? (a) : (b))
```

問題：參數會被求值兩次，`MAX(i++, j)` 會遞增兩次。GCC 可用 statement expression + `__typeof__` 避免，但更好的做法是寫 `static inline` 函式。

### Q6. 如何存取絕對位址 `0x40021000`，寫入 `0xAA55`？

```c
*(volatile uint32_t *)0x40021000u = 0xAA55u;
```

### Q7. 宣告一個函式指標陣列，每個函式接收 `int` 回傳 `void`。

```c
void (*handlers[N])(int);
// 或更易讀：
typedef void (*handler_t)(int);
handler_t handlers[N];
```

### Q8. `.data` 和 `.bss` 差在哪？為什麼要分開？

`.data` 是有非零初始值的全域/static 變數，初始值必須存在 Flash，開機時由啟動程式複製到 RAM。`.bss` 是零初始化的變數，**只需要記錄大小**，開機時清零即可，不必在 Flash 存一堆 0，節省 Flash 空間。

### Q9. 韌體為什麼避免使用 `malloc`？

見第 7 節：碎片化、時間不確定、失敗難處理、MISRA 禁止。替代：靜態配置、記憶體池。

### Q10. 以下程式輸出什麼？

```c
unsigned int a = 6;
int b = -20;
(a + b > 6) ? puts("> 6") : puts("<= 6");
```

輸出 **`> 6`**。`b` 被轉換為 unsigned，-20 變成很大的數，相加結果遠大於 6。考的是**有號無號混合運算的隱式轉換**。

### Q11. 下列程式有什麼問題？

```c
char *get_name(void) {
    char name[16] = "sensor";
    return name;
}
```

回傳**區域陣列的位址**，函式返回後該堆疊空間失效 → 懸空指標。修正：使用 `static`、由呼叫者傳入緩衝區、或回傳字串字面值 `const char *`。

### Q12. `#define` 和 `typedef` 定義指標型別的差別？

```c
#define PCHAR char*
typedef char* pchar_t;
PCHAR  a, b;    // a 是 char*，b 是 char（純文字替換）
pchar_t c, d;   // c、d 都是 char*
```

### Q13. 什麼是 strict aliasing？

C 標準規定，不能用不相容型別的指標存取同一物件（`char*` 例外）。違反時編譯器可能假設兩個指標不重疊而重排讀寫。安全的型別轉換方式是 `memcpy`（會被最佳化成單一指令）或 union。

## 過時技術（知道就好）

- **`register` 關鍵字**：現代編譯器的暫存器分配比人類好，已被忽略（C++17 移除）。
- **K&R 風格函式宣告**：`int f(a, b) int a; int b; { }`，C23 已移除。
- **用 `int` 當布林**：C99 後應使用 `<stdbool.h>`。
- **依賴 bit-field 映射暫存器**：不可攜，改用 CMSIS 風格巨集。

## 本章回顧

- 型別一律用 `stdint.h`
- `volatile` 防最佳化，不保證原子性
- `const` 資料放 Flash 省 RAM；`static` 用於封裝
- 結構成員由大到小排，減少 padding；通訊封包手動序列化
- 小心整數提升、有號無號混合、移位溢位、UB
- 韌體避免 `malloc`，改用靜態配置與記憶體池
