# 06. 建置流程、連結器與記憶體管理

> **一句話**：韌體沒有作業系統幫你載入程式。**原始碼如何變成燒進 Flash 的二進位檔、變數最後放在哪個位址**，全部由工具鏈與 Linker Script 決定。

---

## 1. 從原始碼到燒錄檔 🟢

```
main.c ──[前處理器]──▶ main.i ──[編譯器]──▶ main.s ──[組譯器]──▶ main.o ┐
uart.c ─────────────────────────────────────────────────────▶ uart.o ├─[連結器 + Linker Script]─▶ firmware.elf
startup.s ──────────────────────────────────────────────────▶ startup.o┘                         │
                                                                              [objcopy]          ▼
                                                                       firmware.bin / .hex ──▶ 燒錄到 Flash
```

| 階段 | 工作 | 輸出 |
|---|---|---|
| 前處理 | 展開 `#include`、`#define`、條件編譯 | `.i` |
| 編譯 | C → 組合語言，做最佳化 | `.s` |
| 組譯 | 組合語言 → 機器碼 | `.o`（目的檔，符號位址未定） |
| 連結 | 合併目的檔、解析符號、**依 Linker Script 決定位址** | `.elf` |
| 轉檔 | 去除除錯資訊 | `.bin` / `.hex` |

## 2. 輸出檔案格式 🟢

| 格式 | 內容 | 用途 |
|---|---|---|
| **ELF** | 程式碼 + 位址資訊 + **除錯符號** | 給除錯器（GDB）使用 |
| **BIN** | 純二進位映像，無位址資訊 | OTA 更新、Bootloader 燒錄 |
| **HEX**（Intel HEX） | 文字格式，每行含位址與 checksum | 燒錄工具、可描述不連續區段 |
| **MAP** | 每個符號的位址與大小 | **分析記憶體使用量** |

## 3. 區段（Section）與記憶體位置 🟡

| 區段 | 內容 | 存放（LMA） | 執行（VMA） |
|---|---|---|---|
| `.isr_vector` | 中斷向量表 | Flash 起始 | Flash |
| `.text` | 程式碼 | Flash | Flash |
| `.rodata` | 常數 | Flash | Flash |
| `.data` | 有初值的全域變數 | Flash（初始值） | **RAM** |
| `.bss` | 零初始化全域變數 | 不佔 Flash | RAM |
| heap | 動態配置 | — | RAM |
| stack | 區域變數 | — | RAM 尾端 |

**LMA（Load Memory Address）**：資料存放的位置。**VMA（Virtual/Run Memory Address）**：程式執行時使用的位置。`.data` 的 LMA 在 Flash、VMA 在 RAM，所以開機時要**複製**。

## 4. Linker Script 🟡

GNU ld 的 Linker Script 範例（簡化）：

```ld
MEMORY
{
  FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 512K
  RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}

_estack = ORIGIN(RAM) + LENGTH(RAM);     /* 堆疊起點：RAM 最高位址 */

SECTIONS
{
  .isr_vector : { KEEP(*(.isr_vector)) } > FLASH
  .text       : { *(.text*) *(.rodata*) } > FLASH

  _sidata = LOADADDR(.data);             /* .data 初始值在 Flash 的位址 */
  .data : {
    _sdata = .;  *(.data*)  _edata = .;
  } > RAM AT > FLASH                     /* VMA 在 RAM，LMA 在 Flash */

  .bss : {
    _sbss = .;   *(.bss*) *(COMMON)  _ebss = .;
  } > RAM
}
```

重點：
- `MEMORY` 定義實體記憶體區域
- `> RAM AT > FLASH` 表示 VMA/LMA 不同
- 符號 `_sdata`、`_ebss` 等讓啟動程式知道要複製/清零的範圍
- `KEEP()` 防止 `--gc-sections` 刪掉向量表

### 4.1 自訂區段

```c
// 把函式放到 RAM 執行（Flash 抹寫時仍能執行，或為了速度）
__attribute__((section(".ramfunc"))) void flash_write(void) { ... }

// 把大緩衝區放到特定 RAM（如 DMA 可存取的區域、不被 cache 的區域）
__attribute__((section(".dma_buffer"), aligned(32))) uint8_t rx_buf[512];

// 斷電重開後保留值（不被啟動程式清零），用於記錄當機原因
__attribute__((section(".noinit"))) uint32_t crash_magic;
```

## 5. 堆疊（Stack）🟡

### 5.1 堆疊用途

函式呼叫時儲存：返回位址、區域變數、被保存的暫存器、超過 4 個的參數。**中斷發生時硬體也會自動壓入 8 個暫存器**（Cortex-M，有 FPU 時更多）。

### 5.2 堆疊溢位（Stack Overflow）

韌體最常見的神秘當機原因之一。堆疊往下成長，超過範圍會**默默覆寫 .bss/.data 或 heap**，造成難以追查的錯誤。

常見原因：
- 遞迴
- 大型區域陣列（`char buf[2048];`）
- 中斷巢狀過深
- RTOS 任務堆疊設定太小

### 5.3 偵測與估算方法

| 方法 | 說明 |
|---|---|
| **靜態分析** | GCC `-fstack-usage` 產生每個函式的堆疊用量（`.su` 檔），搭配呼叫圖計算最壞情況 |
| **著色法（Stack Painting）** | 開機時把堆疊填滿已知值（如 `0xDEADBEEF`），運行後檢查還剩多少未被覆寫（FreeRTOS 的 `uxTaskGetStackHighWaterMark` 即此原理） |
| **MPU 保護區（Guard Region）** | 在堆疊底部設定不可存取區域，溢位立即觸發 MemManage Fault |
| **堆疊限制暫存器** | ARMv8-M（M33）有 **MSPLIM / PSPLIM**，硬體直接偵測 |
| **Canary** | `-fstack-protector`：在返回位址前放檢查值 |
| RTOS 檢查 | FreeRTOS `configCHECK_FOR_STACK_OVERFLOW` |

## 6. 記憶體配置策略 🟡

| 策略 | 適用 | 說明 |
|---|---|---|
| **全靜態配置** | 安全關鍵、小型系統 | 所有記憶體編譯期決定，map 檔即可確認用量 |
| **開機配置、永不釋放** | 中型系統 | 初始化時 `malloc`，之後不 `free`，無碎片 |
| **記憶體池（Memory Pool）** | 需要動態但要可預測 | 固定大小區塊，O(1) 配置釋放，無外部碎片 |
| **RTOS Heap** | FreeRTOS heap_1～heap_5 | heap_1 只配不放、heap_4 合併相鄰空閒區塊、heap_5 跨多段 RAM |
| 一般 `malloc` | 嵌入式 Linux | — |

**記憶體池範例概念**：

```c
#define BLOCK_SIZE  64
#define BLOCK_COUNT 16
static uint8_t  pool[BLOCK_COUNT][BLOCK_SIZE];
static void    *free_list[BLOCK_COUNT];
static int      free_top;
// 初始化把所有區塊放進 free_list；alloc 從 free_list pop，free 時 push 回去
```

### 6.1 碎片化

- **外部碎片**：總空閒足夠，但沒有一塊連續空間足以配置
- **內部碎片**：配置的區塊比需要的大，浪費區塊內空間（記憶體池的代價）

## 7. 分析記憶體使用 🟡

```bash
arm-none-eabi-size firmware.elf
#   text    data     bss     dec     hex filename
#  45632    1204    8840   55676    d97c firmware.elf
```

- **Flash 用量** = text + data
- **RAM 用量** = data + bss（+ heap + stack）

進階工具：
- `.map` 檔：找出佔用最大的函式與變數
- `arm-none-eabi-nm --size-sort -S firmware.elf`：依大小排序符號
- **Bloaty**、**puncover**、IDE 的 Memory Analyzer

**減少 Flash 用量**：`-Os`、`--gc-sections`、newlib-nano（`--specs=nano.specs`）、避免 `printf` 浮點支援、LTO（`-flto`）。

## 8. 建置系統 🟡

| 工具 | 說明 |
|---|---|
| **Make** | 傳統，多數原廠範例 |
| **CMake + Ninja** | **現代主流**，Zephyr、Pico SDK、ESP-IDF、STM32CubeMX 皆支援 |
| **West** | Zephyr 的多倉庫管理與建置前端 |
| **PlatformIO** | 跨平台整合環境，適合學習 |
| **Bazel** | 大型團隊、可重現建置 |
| **Yocto / Buildroot** | 嵌入式 Linux 整套系統建置（見第 13 章） |

**交叉編譯（Cross Compile）**：在 x86 電腦上產生 ARM 的程式碼。CMake 透過 **toolchain file** 指定編譯器。

**可重現建置（Reproducible Build）**：相同原始碼產生 bit-for-bit 相同的二進位，有助於安全稽核與 SBOM 驗證。實務做法：用 Docker 固定工具鏈版本，移除時間戳記。

## 9. 燒錄方式 🟢

| 方式 | 說明 |
|---|---|
| **SWD / JTAG** | 透過除錯器（ST-Link、J-Link、CMSIS-DAP）燒錄，開發階段主流 |
| **ROM Bootloader** | 晶片內建（如 STM32 的 System Memory），透過 UART/USB DFU 燒錄 |
| **USB 隨身碟模式（UF2）** | 拖拉檔案即可燒錄（RP2040、nRF52840 部分開發板） |
| **自訂 Bootloader + OTA** | 量產後的更新方式（第 07、19 章） |
| **ISP / 燒錄座** | 工廠量產，晶片焊上板子前批次燒錄 |

---

## 面試常問

### Q1. 說明從 C 原始碼到可燒錄檔的流程。

見第 1 節：前處理 → 編譯 → 組譯 → 連結（Linker Script 決定位址）→ objcopy 轉成 bin/hex。

### Q2. Linker Script 的作用是什麼？

描述目標裝置的**記憶體配置**（Flash、RAM 的起始位址與大小），並指定每個區段（`.text`、`.data`、`.bss`…）放在哪裡，同時產生啟動程式需要的符號（`.data` 的來源與目的位址、`.bss` 範圍、堆疊頂端）。

### Q3. `.data` 的初始值存在哪裡？如何進入 RAM？

初始值存在 Flash（LMA），開機時由 **Reset Handler（啟動程式）** 從 `_sidata` 複製到 RAM 的 `_sdata ~ _edata`。

### Q4. 如何偵測堆疊溢位？如何決定堆疊大小？

偵測：著色法、MPU guard、MSPLIM/PSPLIM、canary、RTOS 檢查。決定大小：先用 `-fstack-usage` 靜態估計最深呼叫鏈 + 中斷巢狀用量，再以著色法實測高水位，最後**加 20～50% 安全餘量**。

### Q5. ELF、BIN、HEX 有什麼差別？

ELF 含除錯符號與區段資訊，給除錯器用；BIN 是純映像，需要另外知道燒錄位址；HEX 是含位址的文字格式。

### Q6. 什麼是記憶體碎片？如何避免？

見第 6.1 節。避免：靜態配置、記憶體池、只在初始化時配置。

### Q7. 為什麼要把函式放到 RAM 執行？

1. **抹寫 Flash 時**，同一個 Bank 無法讀取，執行 Flash 寫入的程式碼必須在 RAM 或另一個 Bank
2. RAM 執行沒有 Flash wait state，速度較快（用於時間關鍵的 ISR）
3. 部分低功耗模式會關閉 Flash

### Q8. 如何讓某個變數在軟體重置後保留值？

放在 Linker Script 中**不被啟動程式清零**的 `.noinit` 區段，並搭配 magic number 判斷值是否有效（冷開機時 RAM 是隨機值）。常用於記錄當機原因、跨重置傳遞「進入 Bootloader」旗標。

## 過時技術（知道就好）

- **手寫複雜 Makefile 管理大型專案**：逐漸被 CMake / West 取代。
- **全域 `malloc` / `free` 的通用韌體**：現代實務改用 RTOS 靜態 API 與記憶體池。

## 本章回顧

- 原始碼 → .o → 連結 → ELF → BIN/HEX
- Linker Script 決定位址；`.data` 從 Flash 複製到 RAM，`.bss` 清零
- 堆疊溢位是靜默殺手：用著色法、MPU、PSPLIM 偵測
- `size` 與 `.map` 分析 Flash/RAM 用量
- 現代建置：CMake + Ninja，Docker 固定工具鏈
