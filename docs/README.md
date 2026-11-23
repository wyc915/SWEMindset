# 軟體工程師必備常識知識庫

> 給初學者到中階工程師的「觀念地圖」。不教語法、不談演算法，只講**每個技術在解決什麼問題、何時用、面試會問什麼**。分為**軟體工程軌**與**韌體工程軌**。

## 閱讀方式

- 難度：🟢 基礎（入門必懂）｜🟡 進階（能獨立負責）｜🔴 高階（架構決策）
- 每章結構：**一句話重點 → 學習目標 → 核心觀念（含流程圖）→ 動手練習 → 面試常問（附參考解答）→ 過時技術 / 常見誤解 → 本章回顧**
- 面試題建議**先自己回答，再展開解答對照**（網站上解答預設收合）
- 建議依「學習路線」順序閱讀，不必一次讀完

## 章節目錄

### 軟體工程軌

| # | 章節 | 一句話 |
|---|---|---|
| 01 | [電腦科學基礎](01-cs-fundamentals.md) | 程式跑在什麼上面：作業系統、記憶體、網路 |
| 02 | [程式語言版圖與選型](02-languages.md) | 各語言擅長什麼，怎麼選 |
| 03 | [軟體工程實務](03-engineering-practices.md) | Git、程式碼品質、設計模式、測試 |
| 04 | [前端開發](04-frontend.md) | 瀏覽器如何運作、框架與渲染策略 |
| 05 | [後端與 API 設計](05-backend-api.md) | API 怎麼設計、登入與權限怎麼做 |
| 06 | [資料庫](06-database.md) | 交易、索引、SQL vs NoSQL |
| 07 | [快取](07-cache.md) | 讓系統變快的第一招與它的陷阱 |
| 08 | [訊息佇列與事件驅動](08-message-queue.md) | RabbitMQ、Kafka 與非同步解耦 |
| 09 | [軟體架構](09-architecture.md) | 從分層、單體到微服務 |
| 10 | [分散式系統](10-distributed-systems.md) | 多台機器協作時的根本難題 |
| 11 | [高併發與效能](11-high-concurrency.md) | 撐住大流量的手段 |
| 12 | [資訊安全](12-security.md) | 常見攻擊與防禦觀念 |
| 13 | [容器、Kubernetes 與雲端](13-container-k8s-cloud.md) | 應用程式如何被打包與調度 |
| 14 | [CI/CD 與 DevOps](14-cicd-devops.md) | 程式碼如何安全自動上線 |
| 15 | [維運與可觀測性](15-operations-observability.md) | 上線後怎麼知道系統健康 |
| 16 | [AI 輔助開發與 LLM 應用](16-ai-llm.md) | 用 AI 寫程式、把 AI 做進產品 |
| 17 | [系統設計面試框架](17-system-design-interview.md) | 把前面所有章節串起來的實戰 |
| 18 | [軟技能與職涯](18-soft-skills.md) | 技術以外決定你高度的能力 |

### 韌體工程軌

| # | 章節 | 一句話 |
|---|---|---|
| 19 | [嵌入式與韌體總覽](19-embedded-overview.md) | 軟體與韌體的差異、台灣職缺地圖、學習路線 |
| 20 | [嵌入式 C 必懂觀念](20-embedded-c.md) | 記憶體配置、`const` / `static` / `volatile`、對齊 |
| 21 | [MCU 硬體與周邊](21-mcu-hardware.md) | 電子學基礎、Datasheet、GPIO、Timer、ADC、通訊介面 |
| 22 | [RTOS 與嵌入式併發](22-rtos-concurrency.md) | 中斷、競爭條件、任務同步、優先權反轉 |
| 23 | [韌體除錯、測試與量產](23-firmware-debug-test-release.md) | HardFault、HIL、Secure Boot、OTA、資安法規 |
| 24 | [嵌入式 Linux](24-embedded-linux.md) | 開機流程、Device Tree、驅動、Yocto |
| 25 | [BIOS / UEFI 與 BMC](25-bios-uefi-bmc.md) | 伺服器韌體、OpenBMC、Redfish |
| — | [名詞速查](glossary.md) | 常見縮寫一句話解釋 |

## 學習路線

**軟體工程軌**

| 階段 | 目標 | 對應章節 |
|---|---|---|
| 一、基礎 | 寫出能動的應用 | [01](01-cs-fundamentals.md)、[02](02-languages.md)、[03](03-engineering-practices.md)、[04](04-frontend.md)、[05](05-backend-api.md)、[06](06-database.md) |
| 二、工程化 | 交付可維護、可部署的服務 | [07](07-cache.md)、[12](12-security.md)、[13](13-container-k8s-cloud.md)（Docker）、[14](14-cicd-devops.md)、[15](15-operations-observability.md) |
| 三、系統化 | 設計可擴展、高可用系統 | [08](08-message-queue.md)、[10](10-distributed-systems.md)、[11](11-high-concurrency.md)、[13](13-container-k8s-cloud.md)（K8s） |
| 四、架構 | 做技術選型與取捨 | [09](09-architecture.md)、[17](17-system-design-interview.md)、[18](18-soft-skills.md) |

**韌體工程軌**

| 階段 | 目標 | 對應章節 |
|---|---|---|
| 一、入門 | 了解全貌，點亮第一顆 LED | [01](01-cs-fundamentals.md)、[19](19-embedded-overview.md) |
| 二、MCU 基本功 | 會寫裸機程式、操作周邊 | [20](20-embedded-c.md)、[21](21-mcu-hardware.md) |
| 三、系統化 | 多任務、可靠、可測試的韌體 | [22](22-rtos-concurrency.md)、[23](23-firmware-debug-test-release.md) |
| 四、選定方向 | 嵌入式 Linux / 伺服器韌體 | [24](24-embedded-linux.md)、[25](25-bios-uefi-bmc.md) |

> 以 .NET / Vue / Node.js / MSSQL / MariaDB 背景為例：軟體方向優先補 PostgreSQL（06）→ RabbitMQ / Kafka（08）→ Docker / K8s（13）→ CI/CD（14）→ 高併發與分散式（10、11）。轉職韌體則從第 19 章開始，**第 20 章嵌入式 C 是面試第一關**；想善用 Web 後端經驗，可優先考慮 BMC（25）與 IoT 雲端串接方向。
