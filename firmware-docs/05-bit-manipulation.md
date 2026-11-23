# 05. 位元運算實務

> **一句話**：控制硬體就是在暫存器上**設定、清除、翻轉、讀取特定位元**。位元運算是韌體面試出現頻率最高的題型，必須寫到不假思索。

---

## 1. 六個位元運算子 🟢

| 運算子 | 名稱 | 規則 | 範例（8-bit） |
|---|---|---|---|
| `&` | AND | 兩者皆 1 才為 1 | `1100 & 1010 = 1000` |
| `\|` | OR | 任一為 1 即為 1 | `1100 \| 1010 = 1110` |
| `^` | XOR | 不同為 1 | `1100 ^ 1010 = 0110` |
| `~` | NOT | 全部反轉 | `~1100 0000 = 0011 1111` |
| `<<` | 左移 | 往左移，右邊補 0；左移 n 位 ≈ 乘 2ⁿ | `0001 << 3 = 1000` |
| `>>` | 右移 | 無號數左邊補 0（邏輯右移）；有號負數通常補 1（算術右移，實作定義） | `1000 >> 2 = 0010` |

> 不要混淆：`&&`、`||`、`!` 是**邏輯**運算，結果只有 0 或 1。

## 2. 四大基本操作（必背）🟢

```c
reg |=  (1u << n);    // 設定第 n 位（Set）
reg &= ~(1u << n);    // 清除第 n 位（Clear）
reg ^=  (1u << n);    // 翻轉第 n 位（Toggle）
bit = (reg >> n) & 1u;// 讀取第 n 位（Read）
if (reg & (1u << n))  // 判斷第 n 位是否為 1
```

封裝成巨集（業界常見）：

```c
#define BIT(n)            (1u << (n))
#define SET_BIT(r, n)     ((r) |=  BIT(n))
#define CLEAR_BIT(r, n)   ((r) &= ~BIT(n))
#define TOGGLE_BIT(r, n)  ((r) ^=  BIT(n))
#define READ_BIT(r, n)    (((r) >> (n)) & 1u)
```

## 3. 多位元欄位操作（暫存器實務）🟡

暫存器常把多個欄位塞在一個 32-bit 裡。例如某控制暫存器：

```
bit 31..8   7..4      3..1     0
  保留     PRESC[3:0]  MODE[2:0]  EN
```

```c
#define CTRL_EN_Pos     0u
#define CTRL_EN_Msk     (0x1u << CTRL_EN_Pos)
#define CTRL_MODE_Pos   1u
#define CTRL_MODE_Msk   (0x7u << CTRL_MODE_Pos)
#define CTRL_PRESC_Pos  4u
#define CTRL_PRESC_Msk  (0xFu << CTRL_PRESC_Pos)

// 寫入欄位：先清除再設定（Read-Modify-Write）
uint32_t v = CTRL;
v &= ~CTRL_MODE_Msk;
v |= (mode << CTRL_MODE_Pos) & CTRL_MODE_Msk;
CTRL = v;

// 讀取欄位
uint32_t mode = (CTRL & CTRL_MODE_Msk) >> CTRL_MODE_Pos;
```

通用巨集：

```c
#define FIELD_SET(reg, msk, pos, val) \
    ((reg) = ((reg) & ~(msk)) | (((val) << (pos)) & (msk)))
#define FIELD_GET(reg, msk, pos)  (((reg) & (msk)) >> (pos))
```

> 這就是 **CMSIS** 標頭檔（`stm32f4xx.h` 等）的 `_Pos` / `_Msk` 命名慣例，實務上一定會看到。

### 3.1 遮罩產生

```c
// 產生低 n 位全為 1 的遮罩（n < 32）
#define LOW_MASK(n)  ((1u << (n)) - 1u)       // n=4 → 0x0F

// 產生 [hi:lo] 範圍的遮罩
#define GENMASK(hi, lo) (((~0u) >> (31 - (hi))) & ~((1u << (lo)) - 1u))
```

### 3.2 Read-Modify-Write 的風險

`reg |= x` 實際上是「讀 → 改 → 寫」三步。如果中間被中斷打斷、而 ISR 也修改同一暫存器，**ISR 的修改會被覆蓋**。

解法：
- 關中斷保護（Critical Section）
- 使用硬體提供的**原子設定/清除暫存器**（如 STM32 `GPIOx->BSRR`、Nordic `OUTSET/OUTCLR`、RP2040 的 `_SET/_CLR/_XOR` 別名位址）
- **Write-1-to-Clear（W1C）** 狀態暫存器：寫 1 清除旗標，寫 0 無作用 → **不可用 `|=`**，否則會清掉其他旗標！應直接 `REG = FLAG_X;`

## 4. 經典技巧（面試高頻）🟡

| 目的 | 寫法 | 原理 |
|---|---|---|
| 判斷奇偶 | `x & 1` | 最低位為 1 是奇數 |
| 判斷是否為 2 的冪 | `x && !(x & (x - 1))` | 2 的冪只有一個 1 |
| 清除最低位的 1 | `x & (x - 1)` | `1100 → 1000` |
| 取出最低位的 1 | `x & (-x)` 或 `x & (~x + 1)` | `1100 → 0100` |
| 乘以 2ⁿ | `x << n` | |
| 除以 2ⁿ（無號） | `x >> n` | |
| 取餘數 mod 2ⁿ | `x & ((1u << n) - 1)` | 環形緩衝區索引常用 |
| 交換兩數（不用暫存） | `a ^= b; b ^= a; a ^= b;` | ⚠️ a、b 為同一變數時結果歸零 |
| 判斷兩數同號 | `(a ^ b) >= 0` | 符號位 XOR |
| 絕對值（無分支） | `m = x >> 31; (x ^ m) - m` | 依賴算術右移 |
| 向上對齊到 2ⁿ | `(x + (A - 1)) & ~(A - 1)` | A 為 2 的冪，記憶體對齊常用 |

## 5. 常見演算法題 🔴

### 5.1 計算 1 的個數（Population Count）

```c
// 方法 1：逐位檢查，O(位元數)
int popcount_naive(uint32_t x) {
    int c = 0;
    while (x) { c += x & 1u; x >>= 1; }
    return c;
}

// 方法 2：Brian Kernighan，O(1 的個數)
int popcount_bk(uint32_t x) {
    int c = 0;
    while (x) { x &= x - 1; c++; }
    return c;
}

// 方法 3：GCC 內建（可能編譯為單一指令或查表）
int c = __builtin_popcount(x);
```

### 5.2 反轉位元順序

```c
uint32_t reverse_bits(uint32_t x) {
    uint32_t r = 0;
    for (int i = 0; i < 32; i++) {
        r = (r << 1) | (x & 1u);
        x >>= 1;
    }
    return r;
}
// 分治法（O(log n)）：
// x = ((x >> 1) & 0x55555555) | ((x & 0x55555555) << 1);  交換相鄰 bit
// x = ((x >> 2) & 0x33333333) | ((x & 0x33333333) << 2);  交換相鄰 2-bit
// x = ((x >> 4) & 0x0F0F0F0F) | ((x & 0x0F0F0F0F) << 4);  交換 nibble
// x = ((x >> 8) & 0x00FF00FF) | ((x & 0x00FF00FF) << 8);  交換 byte
// x = (x >> 16) | (x << 16);
// ARM 有單一指令 RBIT。
```

### 5.3 找最高位的 1 / 計算前導零

```c
int clz = __builtin_clz(x);      // x 不可為 0（UB）；ARM 指令 CLZ
int msb_index = 31 - __builtin_clz(x);
int ctz = __builtin_ctz(x);      // 尾端零個數 → 最低位 1 的索引
```

應用：RTOS 排程器用 CLZ 在 O(1) 找出最高優先權的就緒任務（FreeRTOS 的 `configUSE_PORT_OPTIMISED_TASK_SELECTION`）。

### 5.4 位元旋轉（Rotate）

```c
uint32_t rotl(uint32_t x, unsigned n) { n &= 31; return (x << n) | (x >> ((32 - n) & 31)); }
```

`& 31` 是為了避免 n=0 時 `x >> 32` 的 UB。

### 5.5 交換奇偶位元

```c
uint32_t swap_odd_even(uint32_t x) {
    return ((x & 0xAAAAAAAAu) >> 1) | ((x & 0x55555555u) << 1);
}
```

### 5.6 位元圖（Bitmap）管理資源

用一個 `uint32_t` 追蹤 32 個資源是否被佔用（例如記憶體池的區塊、GPIO 中斷通道）：

```c
static uint32_t used;
int alloc_slot(void) {
    uint32_t free_mask = ~used;
    if (!free_mask) return -1;
    int idx = __builtin_ctz(free_mask);
    used |= 1u << idx;
    return idx;
}
void free_slot(int idx) { used &= ~(1u << idx); }
```

### 5.7 同位元（Parity）

```c
int parity(uint32_t x) {          // 1 的個數為奇數回傳 1
    x ^= x >> 16; x ^= x >> 8; x ^= x >> 4; x ^= x >> 2; x ^= x >> 1;
    return x & 1u;
}
```

用途：UART 同位檢查位元、簡易錯誤偵測。

## 6. 位元運算與效能 🟡

- 現代編譯器會自動把 `x * 8` 優化成 `x << 3`、`x % 16` 優化成 `x & 15`（無號時），**不需要為了效能刻意寫位元運算**，可讀性優先
- 但**有號數**的 `x / 2` 與 `x >> 1` 結果不同（負數時），編譯器需額外指令修正
- 真正有意義的位元技巧：無分支運算、CLZ/CTZ 硬體指令、環形緩衝區用 2 的冪大小

---

## 面試常問

### Q1. 寫出設定、清除、翻轉、讀取第 n 位元的程式。

見第 2 節。重點：使用 `1u` 而非 `1`，避免第 31 位元的有號溢位。

### Q2. 判斷一個數是否為 2 的冪。

```c
bool is_pow2(uint32_t x) { return x && !(x & (x - 1)); }
```

`x & (x - 1)` 清除最低位的 1；若結果為 0 表示只有一個 1。必須排除 0。

### Q3. 計算整數中 1 的個數，有幾種方法？

見 5.1：逐位、Kernighan 法、查表法（每 8-bit 查 256 項的表）、平行位元計數、`__builtin_popcount`。面試時建議先寫 Kernighan 法，並提到時間複雜度與硬體指令。

### Q4. 不用暫存變數交換兩個整數，有什麼風險？

XOR 交換法在 `a` 與 `b` 指向同一記憶體時會把值清成 0；且現代 CPU 上未必比使用暫存變數快（有資料相依性）。實務上用暫存變數即可。

### Q5. 暫存器的 bit[6:4] 為 MODE 欄位，寫入值 5，不影響其他位元。

```c
reg = (reg & ~(0x7u << 4)) | ((5u & 0x7u) << 4);
```

### Q6. 什麼是 Write-1-to-Clear 暫存器？使用時要注意什麼？

狀態旗標寫 1 才會清除、寫 0 不影響。**不能用 `reg |= FLAG`**：讀出來的其他已設定旗標會被一起寫 1 而意外清除。正確做法 `reg = FLAG;`。

### Q7. 為什麼 `1 << 31` 有問題？

`1` 是有號 `int`，左移進入符號位在 C 標準中是 UB（C++20 前亦同）。應寫 `1u << 31` 或 `1UL << 31`。同理 `1 << 32` 對 32-bit 型別也是 UB。

### Q8. 將 32-bit 數的位元順序反轉。

見 5.2，先寫迴圈法，再提出分治法與 ARM 的 `RBIT` 指令加分。

### Q9. 如何將位址對齊到 8 的倍數？

```c
uintptr_t aligned = (addr + 7u) & ~(uintptr_t)7u;
```

### Q10. 環形緩衝區大小為什麼常設為 2 的冪？

索引取模可用 `idx & (SIZE - 1)` 取代 `%`，避免除法（Cortex-M0 沒有硬體除法指令，除法很慢），且搭配無號整數自然溢位，讀寫索引可無限遞增。

## 過時技術（知道就好）

- **手寫位元技巧取代乘除法**：早期編譯器較弱時常見，現代編譯器會自動最佳化，應優先可讀性。
- **以 bit-field 定義暫存器結構**：可攜性差，業界改用 CMSIS `_Pos` / `_Msk` 風格。

## 本章回顧

- Set `|=`、Clear `&= ~`、Toggle `^=`、Read `>> n & 1`
- 欄位操作：先遮罩清除，再移位寫入
- 常數用 `1u`，移位量小於型別寬度
- W1C 暫存器不可用 `|=`；RMW 要防中斷
- 必背：`x & (x-1)`、popcount、反轉、CLZ/CTZ、2 的冪對齊
