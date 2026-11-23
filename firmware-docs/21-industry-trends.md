# 21. 產業前沿與技術趨勢

> **一句話**：韌體產業正在經歷**Rust 導入、RISC-V 崛起、Zephyr 普及、邊緣 AI、軟體定義汽車、法規驅動的資安**等變化。面試時能談這些，代表你有在追產業脈動。

---

## 1. Embedded Rust 🟡

### 1.1 為什麼受到關注

約 70% 的嚴重安全漏洞來自**記憶體安全問題**（微軟、Google Chromium 的統計），美國 CISA、NSA 等機構呼籲改用記憶體安全語言。

| Rust 優勢 | 說明 |
|---|---|
| 記憶體安全 | 編譯期保證無懸空指標、無資料競爭 |
| 零成本抽象 | 效能與 C 相當 |
| 型別系統表達硬體 | **Typestate 模式**：把「腳位已設為輸出」編碼進型別，錯誤用法無法編譯 |
| 現代工具鏈 | Cargo、套件管理、內建測試 |

### 1.2 生態系

| 項目 | 說明 |
|---|---|
| **embedded-hal 1.0**（2024） | 標準硬體抽象 trait，驅動可跨晶片重用 |
| PAC / HAL crate | 由 SVD 檔自動產生的暫存器存取（svd2rust） |
| **Embassy** | async/await 非同步嵌入式框架，熱門 |
| RTIC | 基於中斷優先權的並行框架 |
| **probe-rs、defmt** | 燒錄除錯與高效日誌 |
| Ferrocene | 通過 ISO 26262 / IEC 61508 認證的 Rust 編譯器 |
| **Linux 核心 Rust** | Linux 6.1 起支援以 Rust 撰寫驅動 |
| 原廠支援 | Espressif 官方支援 Rust（esp-hal）、Infineon、NXP 等陸續投入 |

**現實面**：C 仍是絕對主流，Rust 適合新專案與安全關鍵模組。**建議先精通 C，再學 Rust 作為加分項**。

## 2. RISC-V 🟡

- **開源指令集架構**（ISA），無授權費，可自訂擴充指令
- 模組化：RV32I 基礎 + M（乘除）、A（原子）、F/D（浮點）、C（壓縮）、V（向量）
- 產品：**ESP32-C3/C6/H2/P4**、GD32V、WCH CH32V（極低成本）、Raspberry Pi **RP2350**（同時有 Cortex-M33 與 RISC-V 核心）、SiFive、Andes（**晶心科技，台灣**）、Nordic nRF54 系列的協處理器
- 車用：RISC-V 車用聯盟與 Quintauris（Bosch、Infineon、Nordic、NXP、Qualcomm 合資）
- 對韌體工程師：概念與 Cortex-M 相近，差異在中斷控制器（CLIC/PLIC）、特權模式、工具鏈

## 3. Zephyr 與開源 RTOS 普及 🟡

- Linux 基金會主導，**Nordic、NXP、ST、Intel、Infineon、Espressif** 等廠商投入
- 統一的 **Device Tree + Kconfig + west** 開發模式
- 內建 BLE、Thread、Matter、網路堆疊、檔案系統、MCUboot、日誌、Shell
- 具 LTS 版本與安全認證計畫
- 職缺描述中「Zephyr 經驗」出現頻率快速上升

## 4. 邊緣 AI / TinyML 🔴

在 MCU 上執行機器學習推論：關鍵字辨識、異常偵測（預測性維護）、手勢辨識、影像分類。

| 項目 | 說明 |
|---|---|
| 框架 | **LiteRT for Microcontrollers**（原 TensorFlow Lite Micro）、Edge Impulse、ST Edge AI（STM32Cube.AI）、NXP eIQ、ExecuTorch（PyTorch） |
| 技術 | **INT8 量化**、剪枝、知識蒸餾、CMSIS-NN 加速 |
| 硬體 | Cortex-M55/M85（Helium）、**Arm Ethos-U NPU**、STM32N6（內建 NPU）、ESP32-S3/P4 向量指令、Alif Ensemble |
| 韌體工作 | 感測器資料管線、DSP 前處理（FFT、MFCC）、記憶體規劃（模型放 Flash、tensor arena 放 RAM）、功耗最佳化 |

更大的邊緣裝置（NVIDIA Jetson、高通、NXP i.MX 95）可執行小型語言模型，屬嵌入式 Linux 領域。

## 5. 軟體定義汽車（SDV）🔴

- 從分散式 ECU 轉向**區域架構 + 中央高效能電腦**
- 軟硬體解耦、持續 OTA、新功能訂閱
- 雲端原生工具鏈：虛擬 ECU、容器化、CI/CD、數位孿生
- 開源專案：Eclipse SDV、COVESA、SOAFEE
- 需要同時懂**韌體、嵌入式 Linux、雲端與 DevOps** 的人才 → **對你的背景非常有利**

## 6. 資安法規驅動 🟡

見第 19 章：歐盟 CRA、EN 18031、ISO 21434、IEC 62443 使以下技能成為剛需：
- Secure Boot、安全 OTA、金鑰管理
- **SBOM 產生與漏洞追蹤**
- PSIRT 流程
- 威脅建模

## 7. 其他值得關注 🟡

| 趨勢 | 說明 |
|---|---|
| **Matter 1.x 持續擴展** | 新增裝置類別（能源管理、家電、相機） |
| BLE 6.0 Channel Sounding | 精確測距，數位鑰匙、尋物 |
| **Wi-Fi 6/7、Wi-Fi HaLow** | IoT 省電與長距離 |
| 衛星 IoT（NTN） | NB-IoT over Satellite，偏遠地區連線 |
| 10BASE-T1S 單對線乙太網路 | 車用與工業「乙太網路延伸到邊緣」 |
| **USB-C 強制統一（歐盟）** | 電子產品充電介面統一 |
| 能源與電池管理 | BMS 韌體、電動車、儲能 |
| 機器人與無人機 | ROS 2、micro-ROS、PX4 |
| **AI 輔助韌體開發** | 用 LLM 讀 Datasheet、產生驅動骨架、分析 crash dump、撰寫測試（仍需工程師驗證時序與硬體行為） |
| Chiplet、異質多核 | 單一 SoC 內多種核心（A + M + NPU + DSP） |

## 8. 台灣韌體產業概況 🟢

| 領域 | 代表企業（舉例） |
|---|---|
| IC 設計 | 聯發科、瑞昱、聯詠、群聯（SSD 控制器韌體）、慧榮、新唐（MCU）、晶心（RISC-V IP） |
| 伺服器 / 網通 | 廣達、緯創、英業達、鴻海、智邦、啟碁、中磊（**BMC / BIOS 韌體需求大**） |
| PC / 消費電子 | 華碩、宏碁、微星、技嘉（BIOS/UEFI、EC 韌體） |
| 車用電子 | 和碩、廣達、台達電、和大、車王電、為升 |
| 工業 / IoT | 研華、台達電、四零四科技（Moxa） |
| 外商研發 | NXP、Infineon、Microchip、Garmin、Bosch 等在台據點 |

**台灣特色職缺**：
- **BIOS / UEFI 工程師**：EDK II、ACPI、x86 平台初始化
- **BMC 工程師**：**OpenBMC**（Linux + Yocto）、IPMI、Redfish —— AI 伺服器需求暴增
- **SSD 韌體**：NAND 管理、FTL、磨損平均、ECC
- **EC（Embedded Controller）韌體**：筆電鍵盤、電源、風扇控制

> 你的 .NET / Web API / Linux 背景，在 **BMC（Redfish 是 RESTful API）**與 **IoT 雲端整合**領域特別有優勢。

---

## 面試常問

### Q1. 你怎麼看 Rust 在嵌入式的發展？

Rust 透過編譯期所有權檢查提供記憶體安全與無資料競爭，效能接近 C，embedded-hal 1.0 與 Embassy 讓生態趨於成熟，且已有安全認證編譯器。但 C 仍有龐大既有程式碼、原廠 SDK 與人才基礎，短期內是**漸進導入**：新模組、安全關鍵元件、與 C 互通（FFI）。

### Q2. RISC-V 與 ARM 相比有什麼優缺點？

優點：開放免授權、可客製化擴充、供應鏈自主性。缺點：生態系（工具、除錯器、RTOS 移植、第三方軟體）較 ARM 年輕，不同廠商實作的擴充碎片化。趨勢是兩者並存，RISC-V 在協處理器、IoT 與客製化 SoC 快速成長。

### Q3. 在 MCU 上跑 AI 模型要考慮什麼？

模型大小（Flash）、推論記憶體（tensor arena 的 RAM）、推論延遲、功耗；使用 INT8 量化、CMSIS-NN 或 NPU 加速；資料前處理管線（濾波、特徵擷取）往往與模型同樣重要；模型更新需透過 OTA。

### Q4. 什麼是軟體定義汽車？對韌體工程師有什麼影響？

車輛功能主要由軟體定義並可透過 OTA 持續更新，硬體架構轉向中央運算 + 區域控制器。影響：需要更多嵌入式 Linux、虛擬化（Hypervisor）、服務導向通訊（SOME/IP、DDS）、CI/CD、雲端整合與資安能力，同時 Zone ECU 仍需要傳統 MCU 韌體與功能安全。

## 過時技術（知道就好）

- **Mbed OS**：ARM 已宣布 2026 年 7 月終止支援，使用者多轉往 Zephyr 或 FreeRTOS。
- **Arduino 作為產品平台**：適合原型與教學。
- **TensorFlow Lite Micro 名稱**：已更名為 LiteRT for Microcontrollers。

## 本章回顧

- 先精通 C，再學 Rust 加分
- RISC-V 快速成長，概念與 Cortex-M 相通
- Zephyr 職缺需求上升
- TinyML、SDV、資安法規是成長最快的領域
- 台灣特色：BIOS/UEFI、BMC（OpenBMC）、SSD 韌體、車用電子
