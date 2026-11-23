# 18. 韌體測試、程式碼品質與 CI/CD

> **一句話**：「燒進去試試看」不是測試。現代韌體團隊用**單元測試 + 模擬器 + HIL + 靜態分析 + CI**，而這正是軟體工程師最能發揮的領域。

---

## 1. 韌體測試金字塔 🟢

```
              ┌──────────┐
              │ 現場測試   │  Beta 裝置、Dogfooding
            ┌─┴──────────┴─┐
            │  HIL 測試     │  真實硬體 + 自動化測試台
          ┌─┴──────────────┴─┐
          │ 整合測試 / 模擬器  │  QEMU、Renode、Zephyr native_sim
        ┌─┴──────────────────┴─┐
        │  單元測試（PC 上執行）  │  最多、最快、最便宜
        └──────────────────────┘
```

**關鍵思維**：把**與硬體無關的邏輯**（協定解析、狀態機、演算法、資料處理）切出來，在 PC 上用 GCC 編譯測試。韌體中通常 60～80% 的程式碼可以這樣測試。

## 2. 單元測試 🟡

### 2.1 框架

| 框架 | 語言 | 特色 |
|---|---|---|
| **Unity + CMock + Ceedling** | C | 嵌入式最普及，CMock 自動產生 mock |
| **CppUTest** | C/C++ | 《Test-Driven Development for Embedded C》一書採用 |
| GoogleTest + GoogleMock | C++ | 功能完整 |
| **Ztest / Twister** | C | Zephyr 內建測試框架與測試執行器 |
| fff（Fake Function Framework） | C | 輕量 fake 函式 |

### 2.2 如何隔離硬體

| 技巧 | 說明 |
|---|---|
| **介面注入** | 驅動依賴函式指標介面（第 14 章），測試時注入 fake |
| **連結期替換（Link Seam）** | 測試時連結 `fake_hal.c` 取代 `stm32_hal.c` |
| 前處理器替換 | `#ifdef UNIT_TEST`（盡量少用） |
| 暫存器模擬 | 把暫存器定義指向測試用的 RAM 陣列，檢查寫入值 |

### 2.3 測試範例（Unity）

```c
#include "unity.h"
#include "ringbuf.h"

static ringbuf_t rb;
void setUp(void)    { rb_init(&rb); }
void tearDown(void) { }

void test_empty_buffer_returns_false(void) {
    uint8_t b;
    TEST_ASSERT_FALSE(rb_get(&rb, &b));
}

void test_put_then_get_returns_same_byte(void) {
    uint8_t b;
    TEST_ASSERT_TRUE(rb_put(&rb, 0x42));
    TEST_ASSERT_TRUE(rb_get(&rb, &b));
    TEST_ASSERT_EQUAL_HEX8(0x42, b);
}
```

### 2.4 主機端額外好處

在 PC 上可以使用 **AddressSanitizer、UndefinedBehaviorSanitizer、Valgrind**，抓出 MCU 上很難發現的越界、UB、記憶體錯誤。

## 3. 模擬與虛擬硬體 🟡

| 工具 | 說明 |
|---|---|
| **QEMU** | 模擬 CPU 與部分開發板，支援 Cortex-M / A、RISC-V |
| **Renode**（Antmicro） | 專為嵌入式設計：模擬多節點、周邊、無線網路，**可整合 CI**，支援 Robot Framework |
| **Zephyr native_sim** | 將 Zephyr 應用編譯成 Linux 執行檔，快速測試 |
| Wokwi | 線上模擬器（ESP32、Arduino、RP2040），也有 CI 版本 |
| 原廠模擬器 / 數位孿生 | Arm Virtual Hardware（FVP）、車用 SIL |

**SIL / MIL / HIL**：
- **MIL**（Model-in-the-Loop）：Simulink 模型階段
- **SIL**（Software-in-the-Loop）：程式碼在 PC 上搭配模擬環境
- **HIL**（Hardware-in-the-Loop）：真實 ECU/MCU + 模擬的外部環境

## 4. HIL 測試 🔴

```
CI Runner ──燒錄──▶ DUT（受測裝置）◀──模擬輸入── 測試治具（另一顆 MCU、DAC、繼電器、電源控制）
     ▲                  │
     └──── UART / RTT 日誌、量測結果 ──┘
```

- 自動燒錄（J-Link Commander、OpenOCD、pyOCD）→ 執行測試 → 收集結果 → 斷電/上電控制
- 測試框架：**pytest + pyserial / pytest-embedded**、Robot Framework、Twister（Zephyr 支援實體板）
- 驗證項目：開機、通訊、OTA 更新與回滾、低功耗電流、斷電恢復
- 車用：dSPACE、NI、Vector 的 HIL 平台

## 5. 靜態分析與程式碼規範 🟡

| 工具 | 說明 |
|---|---|
| **編譯器警告** | `-Wall -Wextra -Wshadow -Wconversion -Werror`（免費且最有效） |
| **cppcheck** | 開源靜態分析 |
| **clang-tidy**、Clang Static Analyzer | 開源 |
| PC-lint Plus、Coverity、Polyspace、Parasoft、Helix QAC | 商用，可檢查 MISRA |
| **CodeQL** | GitHub 安全分析 |
| clang-format | 統一格式 |

### 5.1 MISRA C

**MISRA C:2012（含 Amendment，已整合為 MISRA C:2023 / 2025）**：車用起源、廣泛用於安全關鍵產業的 C 子集規範。

代表性規則精神：
- 禁用動態記憶體配置
- 禁用遞迴（堆疊用量不可預測）
- 所有 `switch` 要有 `default`
- 不允許隱式型別轉換造成的精度損失
- 函式回傳值必須使用
- 避免 `goto`（有條件允許）
- 單一出口（建議性）

其他規範：**CERT C**（安全導向）、**AUTOSAR C++14 / MISRA C++:2023**、Barr Group Embedded C Coding Standard。

## 6. 程式碼覆蓋率與品質指標 🟡

| 指標 | 說明 |
|---|---|
| 語句覆蓋率（Statement） | 每行是否執行過 |
| 分支覆蓋率（Branch） | 每個 if 的真/假是否都走過 |
| **MC/DC** | 每個條件獨立影響結果；**航太 DO-178C Level A、車用 ASIL D 要求** |
| 圈複雜度 | 函式複雜度，過高應拆分 |

工具：gcov / lcov / gcovr（主機端）、商用工具支援目標端覆蓋率。

## 7. 韌體 CI/CD 🔴

```
Push / PR
  ├─ 格式檢查（clang-format）
  ├─ 靜態分析（cppcheck / clang-tidy / MISRA）
  ├─ 主機端單元測試 + Sanitizers + 覆蓋率
  ├─ 交叉編譯所有目標板（矩陣建置）
  ├─ 記憶體用量檢查（Flash/RAM 超出預算即失敗、PR 中顯示差異）
  ├─ 模擬器測試（Renode / QEMU / native_sim）
  ├─ HIL 測試（self-hosted runner 接實體板）
  ├─ 產生 SBOM、簽章韌體
  └─ 發布：版本標籤 → 上傳 OTA 伺服器 → 分階段推送
```

| 實務 | 說明 |
|---|---|
| **Docker 固定工具鏈** | 所有人與 CI 使用相同編譯器版本，可重現建置 |
| 建置產物 | 保存 ELF（含符號，用於崩潰分析）、BIN、MAP |
| 版本號 | Git tag 自動注入 |
| 秘密管理 | **簽章私鑰放在 HSM / 雲端 KMS**，不放 CI 變數明文 |
| 工具 | GitHub Actions、GitLab CI、Jenkins；Zephyr 官方提供 CI Docker 映像 |

> 這幾乎就是你已經熟悉的 CI/CD，只是多了「交叉編譯、記憶體預算、HIL、韌體簽章」。

---

## 面試常問

### Q1. 韌體如何做單元測試？

把邏輯與硬體分離（分層 + 介面），在 PC 上用 Unity/CppUTest/GoogleTest 編譯執行；硬體相依部分用 mock/fake（CMock、fff、連結期替換）；可額外使用 Sanitizers。硬體互動則靠模擬器與 HIL。

### Q2. 什麼是 HIL 測試？

用真實的目標硬體搭配模擬外部環境的測試設備，自動化地餵入訊號、讀取輸出，驗證韌體在真實硬體上的行為；可整合到 CI，自動燒錄與執行測試。

### Q3. 什麼是 MISRA C？為什麼要遵守？

見 5.1 節。目的：避免 C 語言中未定義、未指定與易出錯的用法，提高可預測性、可攜性與安全性；在 ISO 26262 等功能安全專案中是**事實標準**的編碼規範。

### Q4. 為什麼安全關鍵系統禁止遞迴？

堆疊用量取決於執行期資料，無法靜態證明最大深度；一旦超過就會堆疊溢位。改用迴圈與顯式堆疊結構。

### Q5. 如何在 CI 中防止韌體大小失控？

建置後用 `size` 或解析 `.map` 取得 Flash/RAM 用量，與預算比較並在 PR 中留言顯示差異，超過門檻即失敗。

### Q6. 什麼是 MC/DC？

Modified Condition/Decision Coverage：每個判斷中的**每個條件**都必須被證明能**獨立影響**判斷結果。例如 `if (A && B)` 至少需要三組測試：(T,T)→T、(F,T)→F、(T,F)→F。

## 過時技術（知道就好）

- **只靠手動燒錄與人工測試**：仍常見於小團隊，但已無法滿足現代法規與交付速度。
- **MISRA C:2004**：已被 MISRA C:2012 及後續版本取代。

## 本章回顧

- 60～80% 的韌體邏輯可在 PC 上單元測試
- 隔離硬體：介面注入、連結期替換、CMock
- 模擬器（Renode、QEMU、native_sim）+ HIL 進 CI
- 靜態分析 + MISRA；安全關鍵要求 MC/DC
- 韌體 CI：交叉編譯矩陣、記憶體預算、簽章、SBOM
