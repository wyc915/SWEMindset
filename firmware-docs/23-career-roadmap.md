# 23. 轉職路線、作品集與學習資源

> **一句話**：從軟體轉韌體，最有效的方式是**買一塊開發板，做出一個從感測器到雲端、含 OTA 與測試的完整專案**，並把過程整理成作品集。

---

## 1. 韌體相關職缺類型 🟢

| 職稱 | 主要工作 | 技術棧 |
|---|---|---|
| **MCU 韌體工程師** | 裸機/RTOS、驅動、通訊 | C、Cortex-M、FreeRTOS/Zephyr |
| **IoT 韌體工程師** | 無線、雲端整合、OTA | BLE/Wi-Fi、MQTT、ESP32/nRF |
| **嵌入式 Linux / BSP 工程師** | 開機、驅動、系統建置 | U-Boot、Kernel、Device Tree、Yocto |
| **BIOS / UEFI 工程師** | x86 平台初始化 | EDK II、ACPI、C |
| **BMC 工程師** | 伺服器管理控制器 | OpenBMC、Yocto、Redfish、IPMI |
| **SSD / 儲存韌體** | Flash 管理 | FTL、NAND、ECC |
| **車用軟體工程師** | ECU 韌體 | AUTOSAR、CAN、ISO 26262、MISRA |
| **韌體測試 / 驗證工程師** | HIL、自動化測試 | Python、pytest、CI |
| **韌體資安工程師** | Secure Boot、滲透測試 | 密碼學、逆向工程 |

> **最適合你的切入點**（.NET / Node.js / Linux / DB 背景）：**IoT 韌體**、**BMC（OpenBMC + Redfish）**、**韌體測試自動化 / DevOps**，之後再往純 MCU 或 Linux BSP 深入。

## 2. 學習路線（約 6～12 個月）🟢

### 階段一：基礎（1～2 個月）

- [ ] C 語言深度：指標、記憶體佈局、位元運算、結構對齊（第 04、05 章）
- [ ] 數字系統（第 01 章）
- [ ] 基本電子學：歐姆定律、上拉下拉、看電路圖（第 02 章）
- [ ] 計算機組織：記憶體映射 I/O（第 03 章）
- [ ] 刷題：LeetCode 位元運算、鏈結串列、字串題（C 語言作答）

### 階段二：MCU 裸機（2～3 個月）

- [ ] 開發板：**STM32 Nucleo（F4/G4/L4）**、**Raspberry Pi Pico 2（RP2350）**、或 **Nordic nRF52840 DK**
- [ ] 不用 HAL，**直接操作暫存器**點亮 LED、讀按鈕（看 Reference Manual）
- [ ] 計時器中斷、PWM 調光
- [ ] UART 收發（中斷 + 環形緩衝區）、自訂封包協定
- [ ] I²C 讀取溫溼度感測器、SPI 驅動 OLED 或 Flash
- [ ] ADC + DMA 取樣
- [ ] 自己寫 Linker Script 與 startup 程式
- [ ] 買一台**邏輯分析儀**（入門款即可）觀察協定

### 階段三：RTOS 與架構（1～2 個月）

- [ ] FreeRTOS：任務、佇列、號誌、mutex，重構前面的專案
- [ ] **Zephyr**：Device Tree、Kconfig、west、內建驅動
- [ ] 分層架構與可測試驅動、狀態機
- [ ] 單元測試（Unity/CppUTest）+ GitHub Actions CI

### 階段四：IoT 與產品化（2～3 個月）

- [ ] ESP32 或 nRF：Wi-Fi/BLE 連線
- [ ] MQTT over TLS 上傳到雲端（AWS IoT Core / 自架 Mosquitto + 你熟悉的後端與資料庫）
- [ ] **MCUboot + OTA 更新 + 回滾**
- [ ] 低功耗最佳化與量測
- [ ] Secure Boot、裝置憑證

### 階段五：方向深化（持續）

- 嵌入式 Linux：樹莓派 / BeagleBone，寫一個字元裝置驅動、用 Buildroot/Yocto 建置映像
- 車用：CAN 通訊專案、讀 MISRA C
- Rust：Embassy 重寫一個小專案

## 3. 作品集專案建議 🟡

### 專案：「智慧環境監測節點」（一個專案涵蓋大部分面試重點）

```
[感測器 SHT4x/BME280] ─I²C─┐
[OLED 顯示器] ─────SPI─────┤
[按鈕（去彈跳+狀態機）] ─GPIO┤
                         MCU（Zephyr / FreeRTOS）
                           │ BLE 或 Wi-Fi
                           ▼
                   MQTT Broker / 雲端
                           │
               後端 API（.NET / Node.js）+ PostgreSQL/TimescaleDB + Vue 儀表板
```

**要展示的能力**：

| 項目 | 對應面試重點 |
|---|---|
| 驅動依賴抽象介面，可在 PC 上單元測試 | 架構、測試 |
| UART CLI 命令列（環形緩衝區 + 封包解析） | 資料結構、狀態機 |
| DMA、中斷、低功耗模式 + 功耗量測數據 | 周邊、低功耗 |
| MCUboot OTA + 回滾示範 | Bootloader、可靠性 |
| TLS + 裝置憑證 + Secure Boot | 資安 |
| GitHub Actions：建置、單元測試、靜態分析、記憶體用量 | CI/CD |
| README：架構圖、邏輯分析儀截圖、功耗曲線、踩坑紀錄 | 溝通能力 |

> 全端能力（後端 + 前端儀表板）是你相較其他韌體求職者的**差異化優勢**。

## 4. 推薦硬體 🟢

| 類別 | 推薦 |
|---|---|
| 入門 MCU | STM32 Nucleo-F446RE / G431RB、Raspberry Pi Pico 2 |
| 無線 | **ESP32-C6 / ESP32-S3 DevKit**、**Nordic nRF52840 DK / nRF54L15 DK** |
| 嵌入式 Linux | Raspberry Pi 4/5、BeagleBone Black / BeaglePlay |
| 除錯器 | 開發板內建 ST-LINK、Raspberry Pi Debug Probe、J-Link EDU（教育版） |
| 量測 | 入門邏輯分析儀（8ch 24MHz）、萬用電表、**Nordic PPK2**、入門示波器（有預算再買） |
| 感測器 | BME280 / SHT4x（I²C）、MPU-6050 / ICM-42688（IMU）、SSD1306 OLED |

## 5. 學習資源 🟢

### 書籍

| 書名 | 內容 |
|---|---|
| *Making Embedded Systems*（Elecia White，第 2 版） | **入門首選**，軟體人轉韌體最友善 |
| *Test-Driven Development for Embedded C*（James Grenning） | 韌體 TDD |
| *The Definitive Guide to ARM Cortex-M3/M4/M23/M33*（Joseph Yiu） | Cortex-M 權威參考 |
| *Embedded C Coding Standard*（Barr Group） | 程式碼規範（免費 PDF） |
| *Linux Device Drivers*（LDD3，舊但概念經典）、*Linux Device Driver Development*（John Madieu） | Linux 驅動 |
| *Mastering Embedded Linux Programming*（Frank Vasquez、Chris Simmonds） | 嵌入式 Linux |
| *C 語言程式設計：現代方法*（K.N. King） | C 語言 |

### 線上資源

| 資源 | 說明 |
|---|---|
| **Interrupt 部落格（Memfault）** | 業界實務文章品質極高（除錯、CI、OTA、HardFault） |
| Embedded Artistry | 架構、實務 |
| Zephyr 官方文件 + Nordic DevAcademy | 免費結構化課程（nRF Connect SDK / Zephyr / BLE） |
| FreeRTOS 官方文件 + *Mastering the FreeRTOS Kernel* | 免費 |
| Bootlin 訓練教材 | **嵌入式 Linux / 驅動 / Yocto 免費投影片** |
| Embedded.fm Podcast | 產業對談 |
| ST / NXP / Nordic 官方 YouTube 與 MOOC | 晶片實作 |
| Phil's Lab（YouTube） | 硬體設計 + 韌體 |
| Low Byte Productions（YouTube） | 從零打造 Bootloader、底層 |

### 面試準備

- 各章「面試常問」+ 第 22 章題庫
- 自己手寫：memcpy/memmove、環形緩衝區、狀態機、位元操作，**不看參考寫到正確**
- 能用 3 分鐘講清楚作品集專案的架構與最難的 bug

## 6. 履歷撰寫建議 🟢

- 把軟體經驗**翻譯成韌體價值**：
  - 「建立 CI/CD 流程，縮短部署時間 X%」→ 可帶進韌體團隊
  - 「設計高併發訊息處理系統（RabbitMQ / Kafka）」→ 對應 IoT 後端與事件驅動架構
  - 「Linux 伺服器維運」→ 嵌入式 Linux 基礎
- 作品集放 GitHub，README 附架構圖與量測截圖
- 列出具體使用過的晶片、協定、工具（STM32F4、I²C、SPI、FreeRTOS、Zephyr、J-Link、邏輯分析儀）
- 可考慮的證照/課程（加分非必要）：ARM Accredited Engineer（已較少見）、Linux Foundation 的 Zephyr / Embedded Linux 課程、ISTQB（測試）

## 本章回顧

- 切入點：IoT 韌體、BMC、韌體測試自動化
- 路線：C 深度 → 裸機暫存器 → RTOS → IoT + OTA + 資安 → 深化方向
- 一個完整的端到端作品集專案，勝過十個 LED 範例
- 全端 + CI/CD + 雲端整合是你的差異化優勢
