# 韌體工程師必備知識庫

> 給**軟體工程師轉職韌體**的完整學習地圖：從數字系統、電子學、嵌入式 C，到 RTOS、嵌入式 Linux、IoT、資安、功能安全與面試題庫。

## 閱讀方式

- 難度：🟢 基礎（入門必懂）｜🟡 進階（能獨立負責）｜🔴 高階（產品與架構決策）
- 每章結構：**一句話重點 → 核心觀念 → 面試常問（附參考解答）→ 過時技術（知道就好）→ 本章回顧**
- 第 22 章為綜合面試題庫，建議讀完各章後集中練習

## 章節目錄

| # | 章節 | 一句話 |
|---|---|---|
| 01 | [數字系統與資料表示](01-number-systems.md) | 進位轉換、二補數、端序、浮點與定點 |
| 02 | [基本電子學](02-electronics-basics.md) | 看懂電路圖、上拉下拉、推挽與開汲極 |
| 03 | [計算機組織與 MCU 架構](03-computer-architecture.md) | 記憶體映射 I/O、Cortex-M、Flash、Cache |
| 04 | [嵌入式 C 語言](04-embedded-c.md) | volatile、const、static、指標、對齊、UB |
| 05 | [位元運算實務](05-bit-manipulation.md) | 暫存器操作與高頻位元面試題 |
| 06 | [建置流程、連結器與記憶體管理](06-build-memory.md) | Linker Script、.data/.bss、堆疊溢位 |
| 07 | [開機流程與 Bootloader](07-boot-bootloader.md) | 向量表、啟動程式、A/B 更新、MCUboot |
| 08 | [基本周邊](08-peripherals.md) | GPIO、計時器、PWM、ADC、看門狗 |
| 09 | [中斷、例外與並行安全](09-interrupts.md) | NVIC、ISR 守則、競爭條件、HardFault |
| 10 | [DMA 與資料緩衝設計](10-dma-buffers.md) | DMA、環形緩衝區、雙緩衝 |
| 11 | [有線通訊介面與協定設計](11-communication-interfaces.md) | UART、I²C、SPI、CAN、CRC |
| 12 | [RTOS 即時作業系統](12-rtos.md) | 排程、同步、優先權反轉、FreeRTOS、Zephyr |
| 13 | [嵌入式 Linux 與驅動程式](13-embedded-linux.md) | 開機鏈、Device Tree、驅動模型、Yocto |
| 14 | [韌體架構與設計模式](14-firmware-architecture.md) | 分層、HAL、狀態機、事件驅動 |
| 15 | [低功耗設計](15-low-power.md) | 睡眠模式、省電技巧、功耗量測 |
| 16 | [無線通訊與 IoT 系統](16-wireless-iot.md) | BLE、Wi-Fi、Matter、MQTT、雲端架構 |
| 17 | [除錯工具與量測儀器](17-debugging-tools.md) | SWD、GDB、示波器、邏輯分析儀 |
| 18 | [測試、程式碼品質與 CI/CD](18-testing-quality-cicd.md) | 單元測試、HIL、MISRA、韌體 CI |
| 19 | [韌體資訊安全](19-firmware-security.md) | Secure Boot、金鑰、實體攻擊、CRA 法規 |
| 20 | [功能安全與車用韌體](20-functional-safety-automotive.md) | ISO 26262、ASIL、AUTOSAR、SDV |
| 21 | [產業前沿與技術趨勢](21-industry-trends.md) | Rust、RISC-V、TinyML、台灣產業概況 |
| 22 | [韌體面試題庫](22-interview-question-bank.md) | 輸出預測、手寫程式、情境與系統設計 |
| 23 | [轉職路線與作品集](23-career-roadmap.md) | 學習路線、作品集專案、資源 |
| — | [名詞速查](glossary.md) | 常見縮寫一句話解釋 |

## 學習路線

| 階段 | 目標 | 對應章節 |
|---|---|---|
| 一、基礎 | 看得懂暫存器與電路 | 01、02、03、04、05 |
| 二、MCU 裸機 | 能寫驅動、處理中斷 | 06、07、08、09、10、11 |
| 三、系統化 | 多任務與可維護架構 | 12、14、17、18 |
| 四、產品化 | 連網、省電、安全更新 | 15、16、19 |
| 五、方向深化 | 依職缺選擇 | 13（Linux/BMC）、20（車用）、21（前沿） |
| 面試衝刺 | 題庫與作品集 | 22、23 + 各章面試題 |

> 以 .NET / Vue / Node.js / Linux 背景轉職為例，建議優先：04 → 05 → 09 → 11 → 12，並以第 23 章的「智慧環境監測節點」作為作品集，把你熟悉的後端與前端也整合進去。
