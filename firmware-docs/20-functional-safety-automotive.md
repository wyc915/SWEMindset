# 20. 功能安全與車用韌體

> **一句話**：功能安全（Functional Safety）關心的是「**系統出錯時不會傷人**」。車用、醫療、工業、航太的韌體職缺，都要求理解相關標準與開發流程。

---

## 1. 功能安全 vs 資訊安全 🟢

| | 功能安全（Safety） | 資訊安全（Security） |
|---|---|---|
| 防範 | **隨機硬體故障、系統性錯誤** | **蓄意攻擊** |
| 問題 | 「壞掉時會不會傷人？」 | 「被攻擊時會不會出事？」 |
| 車用標準 | **ISO 26262** | **ISO/SAE 21434** |
| 通用/工業 | IEC 61508 | IEC 62443 |

現代車用專案兩者**必須同時考量**（Safety & Security Co-engineering）。

## 2. 主要標準 🟡

| 標準 | 產業 | 等級 |
|---|---|---|
| **IEC 61508** | 通用（母標準） | SIL 1～4 |
| **ISO 26262** | 道路車輛 | **ASIL A～D**（D 最嚴格），QM 為一般品質管理 |
| **ISO 21448（SOTIF）** | 車用 | 預期功能安全：系統沒壞但功能不足（如 ADAS 感測器誤判） |
| IEC 62304 | 醫療軟體 | Class A/B/C |
| DO-178C | 航空 | DAL A～E |
| EN 50128 / EN 50716 | 鐵路 | SIL 0～4 |
| IEC 60730 | 家電（Class B 軟體自檢） | Class A/B/C |

### 2.1 ASIL 決定方式

**ASIL = f(嚴重度 S, 暴露率 E, 可控性 C)**，透過 **HARA（危害分析與風險評估）**決定。

例：
- 安全氣囊誤爆、轉向失效 → ASIL D
- 車窗夾手 → ASIL A/B 等級
- 娛樂系統 → QM

## 3. ISO 26262 開發流程（V 模型）🟡

```
 需求分析 ────────────────────────────▶ 車輛層級驗證
   系統設計 ──────────────────────▶ 系統整合測試
     軟體架構設計 ──────────────▶ 軟體整合測試
       軟體單元設計 ──────▶ 軟體單元測試
               實作（程式碼）
```

核心要求：
- **雙向可追溯性**：需求 ↔ 設計 ↔ 程式碼 ↔ 測試
- 依 ASIL 等級要求的**方法表**（如 ASIL D 需要 MC/DC 覆蓋率、半形式化驗證）
- 編碼規範（**MISRA C**）
- **工具資格認證**（編譯器、靜態分析工具需要 Tool Qualification）
- 安全案例（Safety Case）：證明系統足夠安全的文件論證

**ASPICE（Automotive SPICE）**：車用軟體**開發流程成熟度**評估模型（Level 0～5），車廠常要求供應商達 Level 2 或 3。

## 4. 韌體層級的安全機制 🔴

| 機制 | 說明 |
|---|---|
| **看門狗（含視窗看門狗、外部看門狗）** | 偵測卡死與流程異常 |
| **程式流程監控（Program Flow Monitoring）** | 檢查關鍵函式是否依預期順序執行（檢查點簽名） |
| **記憶體保護（MPU）** | **免干擾（Freedom from Interference）**：不同 ASIL 等級的軟體互不破壞 |
| RAM / Flash 自檢 | 開機與週期性 March Test、Flash CRC 檢查 |
| CPU 自檢（STL） | 原廠提供的 Self-Test Library 檢查暫存器、ALU |
| **鎖步核心（Lockstep）** | 兩顆核心執行相同指令並比較結果（Cortex-R52、TI Hercules、Infineon AURIX） |
| ECC 記憶體 | 單 bit 錯誤更正、雙 bit 偵測 |
| **E2E 保護** | 通訊資料加上 CRC、計數器、逾時檢查（AUTOSAR E2E Profile） |
| 冗餘 | 雙感測器比對、多數決 |
| **安全狀態（Safe State）** | 偵測到故障時進入已知安全的狀態（如馬達斷電、降級運作） |
| 防禦式程式設計 | 範圍檢查、變數備份（反向儲存比對）、`default` 處理 |

## 5. 車用電子架構與 AUTOSAR 🔴

### 5.1 ECU 與架構演進

| 世代 | 說明 |
|---|---|
| 分散式 | 每個功能一顆 ECU，一台車 70～150 顆 |
| 域控制器（Domain） | 依功能域整合：動力、底盤、車身、座艙、ADAS |
| **區域架構（Zonal）+ 中央運算** | 依實體位置分區，Zone ECU 負責 I/O，中央高效能電腦（HPC）負責運算 → **軟體定義汽車（SDV）** 的基礎 |

### 5.2 AUTOSAR

| | AUTOSAR Classic | AUTOSAR Adaptive |
|---|---|---|
| 目標 | MCU 上的傳統 ECU，硬即時 | 高效能運算（POSIX OS，如 Linux/QNX） |
| 語言 | C | C++14/17 |
| 通訊 | 靜態設定（CAN、LIN、FlexRay、Ethernet） | 服務導向（**SOME/IP**、DDS） |
| 部署 | 編譯期固定 | 動態部署、OTA |

Classic 架構：**應用層（SWC）→ RTE（執行期環境）→ BSW（基礎軟體：通訊、記憶體、診斷、OS）→ MCAL（微控制器抽象層）**。工具：Vector DaVinci、EB tresos。

### 5.3 車用常見知識

| 主題 | 說明 |
|---|---|
| **UDS（ISO 14229）** | 診斷協定：讀故障碼（DTC）、刷寫韌體、安全存取（Seed & Key） |
| **DoIP** | 透過乙太網路做診斷 |
| OBD-II | 法規排放診斷 |
| **FOTA / UN R156** | 車輛軟體更新管理法規 |
| 車用 MCU | **Infineon AURIX TC3xx/TC4x**、NXP S32K / S32G、Renesas RH850 / R-Car、ST Stellar、TI |
| 車用通訊 | CAN FD、LIN、FlexRay（逐漸淘汰）、**車用乙太網路（100/1000BASE-T1、10BASE-T1S）** |
| **SDV 軟體定義汽車** | 軟硬體解耦、中央運算、持續 OTA、虛擬 ECU、雲端原生開發 |

---

## 面試常問

### Q1. 功能安全與資訊安全的差別？

見第 1 節。

### Q2. 什麼是 ASIL？如何決定？

汽車安全完整性等級，A 到 D（D 最嚴），由 HARA 依嚴重度、暴露率、可控性三個參數決定，等級越高要求的開發方法與驗證越嚴格。

### Q3. 什麼是 Freedom from Interference？如何實現？

不同安全等級（或 QM 與 ASIL）的軟體元件共存時，低等級元件的故障不能影響高等級元件。實現：**空間**（MPU 記憶體隔離）、**時間**（時間監控、看門狗、排程保護）、**通訊**（E2E 保護）。

### Q4. 什麼是 Safe State？舉例。

系統偵測到故障時可以進入的、不會造成危險的狀態。例：電動輔助轉向故障 → 逐步降低助力並警示駕駛；馬達控制器 → 關閉 PWM 輸出；煞車系統 → 降級為備援模式。Safe State 不一定是「關機」，某些系統（如線控轉向）需要**失效可運作（Fail-Operational）**。

### Q5. AUTOSAR Classic 與 Adaptive 的差別？

見 5.2 節。

### Q6. UDS 如何刷寫 ECU 韌體？

典型流程：進入擴展/程式設計診斷工作階段（0x10）→ 安全存取 Seed & Key（0x27）→ 抹除記憶體（0x31 Routine Control）→ Request Download（0x34）→ Transfer Data（0x36）多次 → Request Transfer Exit（0x37）→ 檢查完整性（0x31）→ ECU Reset（0x11）。

### Q7. 為什麼 ISO 26262 要求工具資格認證？

編譯器或測試工具本身的錯誤可能引入或掩蓋缺陷（例如編譯器產生錯誤程式碼）。依工具影響度與錯誤偵測能力決定 TCL（Tool Confidence Level），必要時需使用已認證版本或進行驗證。

## 過時技術（知道就好）

- **FlexRay**：曾用於線控與底盤，正被車用乙太網路與 CAN FD/XL 取代。
- **完全分散式 ECU 架構**：新平台轉向 Zonal + 中央運算。
- **OSEK/VDX OS**：已由 AUTOSAR OS 承接。

## 本章回顧

- Safety 防故障、Security 防攻擊，兩者要一起做
- ISO 26262：ASIL A～D、V 模型、雙向追溯、MISRA、工具認證
- 韌體安全機制：看門狗、流程監控、MPU 隔離、自檢、E2E、Safe State
- AUTOSAR Classic（MCU）vs Adaptive（HPC）；SDV 是車用的未來方向
