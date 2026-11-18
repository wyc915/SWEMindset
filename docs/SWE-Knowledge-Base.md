# 軟體工程師必備常識知識庫（SWE Knowledge Base）

> 用途：作為後續平台開發的知識庫母本。內容聚焦「概念、用途、取捨、架構、部署維運」，**不列語法、不含演算法**。
>
> 難度標記：🟢 基礎（入門必懂）｜🟡 進階（獨立負責模組）｜🔴 高階（架構 / 技術決策）

---

## 目錄

1. [電腦科學基礎](#1-電腦科學基礎)
2. [程式語言版圖與選型](#2-程式語言版圖與選型)
3. [軟體工程實務](#3-軟體工程實務)
4. [前端開發](#4-前端開發)
5. [後端與 API 設計](#5-後端與-api-設計)
6. [資料庫](#6-資料庫)
7. [快取](#7-快取)
8. [訊息佇列與事件驅動](#8-訊息佇列與事件驅動)
9. [軟體架構](#9-軟體架構)
10. [分散式系統](#10-分散式系統)
11. [高併發與效能](#11-高併發與效能)
12. [資訊安全](#12-資訊安全)
13. [容器、Kubernetes 與雲端](#13-容器kubernetes-與雲端)
14. [CI/CD 與 DevOps](#14-cicd-與-devops)
15. [維運與可觀測性](#15-維運與可觀測性)
16. [AI 輔助開發與 LLM 應用](#16-ai-輔助開發與-llm-應用)
17. [嵌入式與韌體（轉職橋接）](#17-嵌入式與韌體轉職橋接)
18. [軟技能與職涯](#18-軟技能與職涯)
19. [附錄 A：學習路線](#附錄-a學習路線)
20. [附錄 B：名詞速查](#附錄-b名詞速查)

---

## 1. 電腦科學基礎

### 1.1 作業系統 🟢→🟡

| 主題 | 必懂重點 |
|---|---|
| 行程（Process）vs 執行緒（Thread） | 行程有獨立記憶體空間；執行緒共享行程記憶體，切換成本較低但需處理同步 |
| 協程 / 綠色執行緒 | 使用者態排程（Go goroutine、C# async/await、Kotlin coroutine），大量 I/O 併發的基礎 |
| 排程 | 搶佔式 vs 協作式；Context Switch 成本 |
| 同步機制 | Mutex、Semaphore、Monitor、Spin Lock、讀寫鎖；死結四條件（互斥、持有並等待、不可搶佔、循環等待） |
| 記憶體 | 虛擬記憶體、分頁、Stack vs Heap、記憶體洩漏、記憶體碎片 |
| I/O 模型 🟡 | 阻塞 / 非阻塞 / I/O 多工（select、epoll、kqueue、IOCP）/ io_uring；Node.js、Nginx 高併發的根本 |
| 檔案系統 | inode、權限、硬連結/軟連結、fsync 與資料持久化 |
| 系統呼叫 | 使用者態 vs 核心態，為何系統呼叫昂貴 |

### 1.2 計算機組織 🟢→🟡

- CPU 快取層級（L1/L2/L3）、Cache Line、False Sharing（多執行緒效能殺手）
- 位元組序（Big / Little Endian）——網路協定、二進位檔、韌體通訊必碰
- 數值表示：二補數、浮點數誤差（金額禁用 float，改用 decimal / 整數分）
- 字元編碼：ASCII、Unicode、UTF-8 / UTF-16、BOM、亂碼成因

### 1.3 網路 🟢→🔴

| 層級 | 重點 |
|---|---|
| 模型 | OSI 七層 / TCP/IP 四層，知道每層在做什麼即可 |
| IP | IPv4/IPv6、子網路遮罩、CIDR、NAT、私有 IP 範圍 |
| TCP 🟡 | 三次握手 / 四次揮手、TIME_WAIT、流量控制、壅塞控制、Keep-Alive、Nagle |
| UDP | 無連線、低延遲；DNS、串流、遊戲、QUIC 的基礎 |
| DNS | A / AAAA / CNAME / MX / TXT 紀錄、TTL、解析流程、DNS 快取問題 |
| HTTP | 方法語意、狀態碼分類（2xx/3xx/4xx/5xx）、Header、Cookie、CORS |
| HTTP 版本 🟡 | HTTP/1.1（隊頭阻塞）→ HTTP/2（多工、Header 壓縮）→ HTTP/3（QUIC over UDP） |
| TLS 🟡 | 憑證鏈、CA、握手流程、mTLS、憑證過期是常見事故 |
| 代理 | 正向代理 vs 反向代理（Nginx、Envoy）、CDN |

---

## 2. 程式語言版圖與選型

### 2.1 主流語言優勢與用途 🟢

| 語言 | 主要用途 | 優勢 | 劣勢 / 注意 |
|---|---|---|---|
| **C** | 韌體、OS 核心、驅動、嵌入式 | 貼近硬體、可預測、資源極省、生態最廣 | 記憶體安全全靠人；UB（未定義行為）多 |
| **C++** | 遊戲引擎、高頻交易、嵌入式、桌面、瀏覽器 | 零成本抽象、效能頂尖、RAII | 複雜度高、編譯慢、學習曲線陡 |
| **Rust** | 系統程式、嵌入式、WebAssembly、基礎設施工具 | 編譯期保證記憶體安全、無 GC、效能近 C | 學習曲線陡、編譯慢；Linux 核心與嵌入式採用快速成長 |
| **Go** | 雲原生、微服務、CLI、基礎設施（K8s、Docker 皆 Go） | 簡單、編譯快、原生併發（goroutine）、單一執行檔部署 | 抽象能力有限、GC 有延遲 |
| **C# / .NET** | 企業系統、Web API、桌面（WPF/WinForms/MAUI）、遊戲（Unity） | 生態完整、效能佳（.NET 8+）、跨平台、工具鏈強 | 歷史包袱（.NET Framework vs .NET） |
| **Java / Kotlin** | 企業後端、Android、大數據（Hadoop/Spark/Kafka） | JVM 生態最成熟、穩定、人才多 | 記憶體占用較高；Kotlin 為 Android 首選 |
| **JavaScript / TypeScript** | 前端、Node.js 後端、全端、跨平台 App | 唯一瀏覽器原生語言、生態巨大；TS 提供型別安全 | 執行期型別坑、套件品質參差、供應鏈風險 |
| **Python** | AI/ML、資料分析、自動化、腳本、測試、後端 | 開發快、函式庫豐富、AI 生態壟斷 | 效能低、GIL（3.13 起可選擇關閉）、部署依賴管理麻煩 |
| **PHP** | 傳統網站、CMS（WordPress）、Laravel | 部署簡單、虛擬主機普及 | 新專案較少選用 |
| **Swift** | iOS / macOS | Apple 生態原生 | 平台綁定 |
| **SQL** | 資料查詢與處理 | 宣告式、所有關聯式資料庫通用 | 各家方言差異（T-SQL、PL/pgSQL） |
| **Shell（Bash / PowerShell）** | 自動化、維運、CI 腳本 | 隨處可用 | 大型邏輯難維護 |

### 2.2 語言核心概念（選型依據）🟡

| 概念 | 說明 | 影響 |
|---|---|---|
| 編譯 / 直譯 / JIT / AOT | C/Rust 編譯為機器碼；Python 直譯；Java/C# 先 JIT，亦可 AOT（Native AOT、GraalVM） | 啟動速度、執行效能、部署大小 |
| 靜態 vs 動態型別 | 編譯期檢查 vs 執行期檢查 | 大型專案可維護性 |
| 強型別 vs 弱型別 | 是否允許隱式轉換 | 隱藏 bug 的機率 |
| 記憶體管理 | 手動（C）、RAII（C++）、所有權（Rust）、GC（Java/C#/Go）、參考計數（Swift/Python） | 延遲穩定性、安全性、效能 |
| 併發模型 | 執行緒+鎖、async/await、CSP（Go channel）、Actor（Erlang/Akka） | 高併發設計方式 |
| 程式範式 | 程序式、物件導向（OOP）、函數式（FP）、反應式（Rx） | 抽象與組織程式的方式 |

### 2.3 選型原則 🔴

1. **團隊能力 > 語言優劣**：熟悉度決定交付速度與品質。
2. **生態系決定生產力**：函式庫、框架、社群、雲端支援。
3. **非功能需求決定下限**：延遲、記憶體、啟動時間、硬體限制。
4. **招募與長期維護成本**。
5. **領域慣例**：AI 選 Python、韌體選 C/C++（Rust 成長中）、雲原生選 Go、企業 Windows 生態選 .NET。

---

## 3. 軟體工程實務

### 3.1 版本控制（Git）🟢→🟡

- 核心概念：commit、branch、merge vs rebase、tag、remote、HEAD、stash
- 分支策略：
  - **Git Flow**：main / develop / feature / release / hotfix，適合有固定發版週期
  - **GitHub Flow**：main + feature branch + PR，適合持續部署
  - **Trunk-Based Development** 🟡：短命分支 + Feature Flag，高頻部署團隊主流
- 規範：Conventional Commits（`feat:`、`fix:`、`chore:`）、語意化版本 SemVer（MAJOR.MINOR.PATCH）
- Monorepo vs Polyrepo 🔴：共享程式碼便利 vs 獨立部署與權限隔離

### 3.2 程式碼品質原則 🟢→🟡

| 原則 | 一句話 |
|---|---|
| SOLID | 單一職責、開放封閉、里氏替換、介面隔離、依賴反轉 |
| DRY | 不重複相同知識（不是不重複相同程式碼） |
| KISS / YAGNI | 保持簡單；不做現在不需要的功能 |
| 高內聚低耦合 | 模組內部相關、模組之間少依賴 |
| 組合優於繼承 | 降低繼承階層造成的僵化 |
| 依賴注入（DI） | 依賴由外部提供，利於測試與替換（.NET Core 內建 DI 容器） |
| Clean Code | 命名清楚、函式短小、錯誤處理明確、沒有魔術數字 |

### 3.3 設計模式（知道用途即可）🟡

| 類別 | 常用模式 | 典型情境 |
|---|---|---|
| 建立型 | Factory、Builder、Singleton | 物件建立邏輯集中 |
| 結構型 | Adapter、Decorator、Facade、Proxy | 整合舊系統、加橫切功能 |
| 行為型 | Strategy、Observer、Command、State、Template Method | 可替換演算法、事件通知、狀態機 |
| 企業級 | Repository、Unit of Work、CQRS、Specification | 資料存取抽象 |
| 雲原生 | Sidecar、Ambassador、Circuit Breaker、Retry、Bulkhead | 微服務韌性 |

### 3.4 測試 🟢→🔴

- **測試金字塔**：大量單元測試 → 適量整合測試 → 少量 E2E 測試
- 測試類型：單元、整合、契約測試（Pact）、E2E、效能 / 壓力、安全、混沌測試 🔴
- 測試替身：Mock、Stub、Fake、Spy
- 方法論：TDD（先寫測試）、BDD（行為描述）
- 指標：覆蓋率只是參考，重點是**關鍵路徑與邊界條件**
- 工具參考：xUnit/NUnit（.NET）、Jest/Vitest（JS）、pytest、Playwright/Cypress（E2E）、k6/JMeter（壓測）、Testcontainers（整合測試起真實資料庫）

### 3.5 開發流程與協作 🟢

- 敏捷 / Scrum：Sprint、Backlog、Daily、Review、Retro；Kanban：限制 WIP
- Code Review：關注正確性、可讀性、安全、效能，而非個人風格（交給 Linter / Formatter）
- 文件：README、ADR（架構決策紀錄）、API 文件（OpenAPI）、Runbook
- 估算：故事點、拆分任務、識別風險與依賴

---

## 4. 前端開發

### 4.1 基礎 🟢

- HTML 語意化、CSS 版面（Flexbox、Grid）、RWD、無障礙（a11y / WCAG）
- 瀏覽器渲染流程：DOM → CSSOM → Render Tree → Layout → Paint → Composite
- 事件迴圈（Event Loop）：宏任務 / 微任務

### 4.2 框架與架構 🟡

| 框架 | 特點 |
|---|---|
| React | 生態最大，Hooks、Server Components；Next.js 為主流全端框架 |
| Vue | 上手容易，Composition API、Pinia；Nuxt 為全端框架 |
| Angular | 完整企業框架，內建 DI、強制 TypeScript |
| Svelte / Solid | 編譯期優化，執行期輕量 |

- 渲染策略：CSR、SSR、SSG、ISR、Hydration、Islands 架構
- 狀態管理：Local state、全域 store（Pinia/Redux/Zustand）、Server state（TanStack Query）
- 建置工具：Vite（主流）、Webpack、esbuild、Rspack；打包、Tree Shaking、Code Splitting
- 微前端 🔴：Module Federation，適合大型多團隊

### 4.3 效能與品質 🟡

- Core Web Vitals：LCP、INP、CLS
- 資源優化：圖片格式（WebP/AVIF）、延遲載入、快取策略、CDN
- 前端安全：XSS、CSRF、CSP、Token 存放位置（HttpOnly Cookie vs localStorage）

---

## 5. 後端與 API 設計

### 5.1 API 風格比較 🟢→🟡

| 風格 | 適用 | 優點 | 缺點 |
|---|---|---|---|
| REST | 對外公開 API、CRUD | 簡單、通用、易快取 | Over/Under-fetching |
| GraphQL | 前端需求多變、BFF | 客戶端決定欄位 | 快取難、N+1 查詢、權限複雜 |
| gRPC | 內部微服務通訊 | 高效（Protobuf + HTTP/2）、強型別、串流 | 瀏覽器支援需 gRPC-Web |
| WebSocket | 即時雙向（聊天、推播） | 低延遲雙向 | 連線狀態管理、水平擴展難 |
| SSE | 伺服器單向推送（LLM 串流回應常用） | 簡單、走 HTTP | 單向 |
| Webhook | 系統間事件通知 | 解耦 | 需處理重試、驗簽、冪等 |

### 5.2 API 設計原則 🟡

- 資源命名（名詞複數）、HTTP 方法語意、正確狀態碼
- **冪等性（Idempotency）**：GET/PUT/DELETE 天然冪等；POST 需 Idempotency-Key 防重複扣款
- 版本控制：URL（`/v1/`）、Header、Media Type
- 分頁：Offset vs Cursor（大資料量用 Cursor）
- 錯誤格式統一：RFC 9457 Problem Details
- 文件與契約：OpenAPI / Swagger、契約優先（Contract-First）
- 速率限制、逾時、重試（指數退避 + Jitter）

### 5.3 認證與授權 🟡→🔴

| 概念 | 說明 |
|---|---|
| 認證（AuthN）vs 授權（AuthZ） | 你是誰 vs 你能做什麼 |
| Session vs Token | 伺服器端狀態 vs 無狀態（JWT） |
| JWT | Header.Payload.Signature；注意過期時間、撤銷困難、不放敏感資料 |
| OAuth 2.0 | 授權框架；Authorization Code + PKCE 為現行推薦流程 |
| OpenID Connect（OIDC） | 建立在 OAuth 2.0 上的身分層（ID Token） |
| SSO | SAML（企業傳統）、OIDC（現代） |
| 權限模型 | RBAC（角色）、ABAC（屬性）、ReBAC（關係，如 Google Zanzibar） |
| Passkeys / WebAuthn | 無密碼登入，業界逐步普及 |

### 5.4 後端框架參考 🟢

- .NET：ASP.NET Core（Minimal API / MVC）、EF Core、Dapper
- Node.js：Express、Fastify、NestJS
- Java：Spring Boot；Go：Gin、Echo、標準庫 net/http；Python：FastAPI、Django

---

## 6. 資料庫

### 6.1 資料庫分類 🟢

| 類型 | 代表 | 適用 |
|---|---|---|
| 關聯式（RDBMS） | PostgreSQL、MSSQL、MySQL/MariaDB、Oracle | 交易、強一致、複雜查詢 |
| 鍵值 | Redis、DynamoDB | 快取、Session、計數器 |
| 文件 | MongoDB、Couchbase | 結構彈性、JSON 資料 |
| 寬欄 | Cassandra、ScyllaDB、HBase | 超大量寫入、時間序列 |
| 時間序列 | InfluxDB、TimescaleDB、Prometheus TSDB | 監控、IoT 感測資料 |
| 搜尋引擎 | Elasticsearch、OpenSearch | 全文檢索、日誌分析 |
| 圖形 | Neo4j | 社交關係、推薦 |
| 向量 | pgvector、Milvus、Qdrant | AI 語意搜尋、RAG |
| 分析型（OLAP） | ClickHouse、BigQuery、Snowflake、DuckDB | 報表、大數據分析 |

### 6.2 關聯式資料庫核心 🟢→🟡

- 正規化（1NF～3NF / BCNF）vs 反正規化（以空間換查詢效能）
- **ACID**：原子性、一致性、隔離性、持久性
- **隔離等級**與異常：

| 隔離等級 | 髒讀 | 不可重複讀 | 幻讀 |
|---|---|---|---|
| Read Uncommitted | ✔ | ✔ | ✔ |
| Read Committed | ✘ | ✔ | ✔ |
| Repeatable Read | ✘ | ✘ | ✔（MySQL InnoDB 透過 Next-Key Lock 大幅避免） |
| Serializable | ✘ | ✘ | ✘ |

- 鎖：共享鎖 / 排他鎖、樂觀鎖（版本號）vs 悲觀鎖（SELECT ... FOR UPDATE）
- MVCC（多版本併發控制）：PostgreSQL、MySQL InnoDB 讀不擋寫的機制
- 索引 🟡：B-Tree、Hash、複合索引最左前綴、覆蓋索引、叢集 vs 非叢集索引、索引失效情境
- 執行計畫（Execution Plan / EXPLAIN）判讀：Seek vs Scan
- N+1 查詢問題（ORM 常見）

### 6.3 PostgreSQL vs MSSQL vs MariaDB 🟡

| 面向 | PostgreSQL | MSSQL | MariaDB / MySQL |
|---|---|---|---|
| 授權 | 開源（免費） | 商業授權 | 開源 |
| 強項 | 功能最完整、擴充性（JSONB、pgvector、PostGIS、TimescaleDB） | Windows / .NET 生態整合、BI 工具、管理介面 | 簡單、讀取快、Web 生態普及 |
| 程序語言 | PL/pgSQL | T-SQL | SQL/PSM |
| MVCC 實作 | Tuple 多版本，需 VACUUM | 預設鎖定式，可開 RCSI 快照 | Undo Log |
| 適用 | 新專案通用首選、雲原生 | 企業 Windows 環境 | 傳統 Web、LAMP |

### 6.4 擴展與高可用 🟡→🔴

- 讀寫分離、主從複寫（同步 / 非同步 / 半同步）
- 分割（Partitioning，單庫內）vs 分片（Sharding，跨庫）；分片鍵選擇決定成敗
- 連線池（PgBouncer、HikariCP、ADO.NET Pool）
- 高可用：Failover、Patroni（PG）、Always On（MSSQL）、Galera（MariaDB）
- 資料庫遷移（Migration）：EF Core Migrations、Flyway、Liquibase；**向後相容的漸進式遷移**（Expand → Migrate → Contract）

---

## 7. 快取

### 7.1 快取層次 🟢

瀏覽器快取 → CDN → 反向代理 → 應用程式記憶體（In-Process）→ 分散式快取（Redis）→ 資料庫 Buffer Pool

### 7.2 快取策略 🟡

| 策略 | 說明 |
|---|---|
| Cache-Aside | 應用程式先查快取，沒有再查 DB 並寫回（最常用） |
| Read-Through / Write-Through | 由快取層負責讀寫 DB |
| Write-Behind | 先寫快取，非同步寫 DB（快但有遺失風險） |

### 7.3 常見問題 🟡→🔴

| 問題 | 成因 | 解法 |
|---|---|---|
| 快取穿透 | 查詢不存在的資料 | 快取空值、布隆過濾器 |
| 快取擊穿 | 熱點 key 過期瞬間大量請求 | 互斥鎖重建、永不過期 + 背景更新 |
| 快取雪崩 | 大量 key 同時過期或快取掛掉 | 隨機 TTL、多級快取、高可用叢集 |
| 一致性 | DB 與快取不同步 | 先更新 DB 再刪快取、延遲雙刪、CDC 同步 |

- Redis 重點：資料結構（String/Hash/List/Set/ZSet/Stream）、持久化（RDB/AOF）、Sentinel 與 Cluster、淘汰策略（LRU/LFU）

---

## 8. 訊息佇列與事件驅動

### 8.1 為什麼需要 MQ 🟢

- **解耦**：生產者不需知道消費者
- **削峰填谷**：流量高峰時緩衝
- **非同步**：縮短回應時間
- **可靠傳遞**：重試、持久化

### 8.2 RabbitMQ vs Kafka 🟡

| 面向 | RabbitMQ | Kafka |
|---|---|---|
| 模型 | 傳統訊息代理（Broker 推送） | 分散式提交日誌（Consumer 拉取） |
| 路由 | Exchange（Direct/Topic/Fanout/Headers）彈性高 | Topic + Partition |
| 訊息保留 | 消費後刪除 | 依時間 / 大小保留，可重播 |
| 吞吐量 | 中高（萬級~十萬級/秒） | 極高（百萬級/秒） |
| 順序性 | 單一佇列保序 | 單一 Partition 內保序 |
| 適用 | 任務佇列、RPC、複雜路由、低延遲 | 事件串流、日誌收集、CDC、事件溯源、資料管線 |
| 其他選擇 | NATS（輕量）、Azure Service Bus、AWS SQS/SNS | Redpanda、Apache Pulsar |

### 8.3 關鍵概念 🟡→🔴

- 傳遞語意：At-most-once / **At-least-once（最常見）** / Exactly-once（Kafka 交易 + 冪等生產者，仍需端到端設計）
- **消費者必須冪等**：以訊息 ID 去重
- 死信佇列（DLQ）、重試佇列、毒訊息處理
- 背壓（Backpressure）
- Kafka 進階：Consumer Group、Offset 管理、Rebalance、Partition 數規劃、ISR、KRaft（已取代 ZooKeeper）
- **Outbox Pattern** 🔴：DB 交易與發送訊息的一致性（寫入 outbox 表 → CDC/輪詢發送）
- Schema 管理：Avro / Protobuf + Schema Registry

---

## 9. 軟體架構

### 9.1 程式內部架構 🟢→🟡

| 架構 | 重點 |
|---|---|
| 分層架構 | Presentation → Business → Data Access |
| MVC / MVVM | UI 與邏輯分離（ASP.NET MVC、Vue/WPF 的 MVVM） |
| Clean Architecture / Onion / Hexagonal（Ports & Adapters） | 依賴方向朝內，領域核心不依賴框架與資料庫 |
| Vertical Slice | 依功能切片而非技術分層 |

### 9.2 系統部署架構演進 🟡→🔴

| 架構 | 優點 | 缺點 | 適用 |
|---|---|---|---|
| 單體（Monolith） | 簡單、易除錯、交易容易 | 規模大後耦合、部署牽一髮動全身 | 新創、小團隊 |
| **模組化單體（Modular Monolith）** | 邊界清楚又保留單體簡單性 | 需紀律維持邊界 | 多數團隊的務實起點 |
| SOA | 企業服務整合（ESB） | 中心化瓶頸 | 傳統企業 |
| 微服務 | 獨立部署擴展、技術異質、團隊自治 | 分散式複雜度、維運成本高 | 大型組織、多團隊 |
| Serverless / FaaS | 免管伺服器、按用量計費 | 冷啟動、廠商綁定、除錯難 | 事件觸發、突發流量 |
| 事件驅動架構（EDA） | 高度解耦、可擴展 | 最終一致、追蹤困難 | 跨系統整合 |

> 原則：**先模組化單體，有明確痛點再拆微服務**。康威定律：系統架構會反映組織溝通結構。

### 9.3 領域驅動設計（DDD）🔴

- 戰略設計：Bounded Context（界限上下文）、Context Map、Ubiquitous Language（通用語言）
- 戰術設計：Entity、Value Object、Aggregate（交易一致性邊界）、Domain Event、Repository、Domain Service
- 用途：拆微服務邊界的主要依據

### 9.4 進階架構模式 🔴

| 模式 | 說明 |
|---|---|
| CQRS | 讀寫模型分離，讀端可用不同資料庫優化 |
| Event Sourcing | 儲存事件而非狀態，可重播、完整稽核 |
| Saga | 分散式長交易，以補償交易取代 2PC；分 Orchestration（協調者）與 Choreography（事件編排） |
| API Gateway | 統一入口：路由、認證、限流（Kong、YARP、Envoy） |
| BFF（Backend for Frontend） | 為不同前端提供專屬聚合層 |
| Service Mesh | 服務間通訊交給 Sidecar / Ambient（Istio、Linkerd）：mTLS、重試、觀測 |
| Strangler Fig | 漸進式替換舊系統 |
| Anti-Corruption Layer | 隔離舊系統的模型汙染 |

### 9.5 架構品質屬性（非功能需求）🔴

可用性、可擴展性、效能、可靠性、安全性、可維護性、可觀測性、成本。**架構就是在這些屬性間取捨**，並以 ADR 記錄決策理由。

---

## 10. 分散式系統

### 10.1 基本難題 🟡

- 分散式計算八大謬誤：網路可靠、延遲為零、頻寬無限、網路安全、拓撲不變、只有一個管理者、傳輸成本為零、網路同質
- 部分失敗（Partial Failure）：請求逾時 ≠ 失敗，可能已成功

### 10.2 一致性理論 🟡→🔴

| 理論 | 重點 |
|---|---|
| CAP | 網路分區（P）發生時，只能在一致性（C）與可用性（A）擇一 |
| PACELC | 無分區時，仍需在延遲（L）與一致性（C）間取捨 |
| BASE | 基本可用、軟狀態、最終一致（與 ACID 相對） |
| 一致性模型 | 強一致（線性化）→ 循序一致 → 因果一致 → 最終一致 |
| Quorum | W + R > N 保證讀到最新寫入 |

### 10.3 核心機制 🔴

- 共識演算法：Raft（etcd、Consul、Kafka KRaft）、Paxos —— 知道用途：選主、複寫日誌
- 分散式鎖：Redis（Redlock 有爭議）、etcd / ZooKeeper；需搭配 Fencing Token
- 分散式交易：2PC / 3PC（阻塞問題）、Saga、TCC（Try-Confirm-Cancel）、Outbox
- 分散式 ID：UUID v7（時間有序，現行推薦）、Snowflake
- 時鐘：物理時鐘不可靠（NTP 漂移）、邏輯時鐘（Lamport、Vector Clock）、HLC
- 一致性雜湊：節點增減時最小化資料搬移
- 服務發現：Consul、K8s DNS
- 冪等、重試、去重：分散式系統的生存基本功

---

## 11. 高併發與效能

### 11.1 擴展策略 🟢→🟡

- 垂直擴展（Scale Up）vs 水平擴展（Scale Out）
- **無狀態服務**：Session 外移至 Redis / Token，才能水平擴展
- 負載平衡：L4（TCP）vs L7（HTTP）；演算法：Round Robin、Least Connections、一致性雜湊；健康檢查
- 讀寫分離、分庫分表、CDN、靜態資源分離

### 11.2 韌性設計（Resilience）🟡→🔴

| 手段 | 目的 | 工具 |
|---|---|---|
| 逾時（Timeout） | 避免資源被卡死 | 所有外部呼叫都必須設定 |
| 重試 + 指數退避 + Jitter | 處理暫時性錯誤 | Polly（.NET）、Resilience4j |
| 熔斷（Circuit Breaker） | 下游故障時快速失敗，防止連鎖崩潰 | Polly、Istio |
| 限流（Rate Limiting） | 保護系統 | Token Bucket、Leaky Bucket、Sliding Window |
| 降級（Degradation） | 犧牲非核心功能保核心 | Feature Flag |
| 隔艙（Bulkhead） | 隔離資源池，避免單點拖垮全部 | 獨立執行緒池 / 連線池 |
| 負載卸載（Load Shedding） | 過載時主動拒絕 | 回應 429 / 503 |

### 11.3 高併發場景設計 🔴

- 秒殺 / 搶購：前端限流 → 閘道限流 → Redis 預扣庫存（原子操作 / Lua）→ MQ 非同步下單 → DB 最終落地
- 熱點資料：本地快取 + 分散式快取多級、熱點 key 分散
- 防超賣：DB 條件更新（`WHERE stock > 0`）、樂觀鎖、Redis 原子遞減
- 排隊與削峰：MQ 緩衝

### 11.4 效能分析 🟡

- 指標：延遲（看 P95 / P99，而非平均）、吞吐量（QPS/TPS）、錯誤率、資源使用率
- 定律：Amdahl 定律、Little's Law（L = λW，估算併發量）
- 瓶頸定位：CPU / 記憶體 / I/O / 網路 / 鎖競爭 / GC
- 工具：Profiler（dotTrace、PerfView、dotnet-counters、async-profiler、pprof）、APM、火焰圖、壓測（k6、JMeter、Locust）
- 原則：**先量測，再優化**

---

## 12. 資訊安全

### 12.1 OWASP Top 10（2025 版重點）🟢→🟡

存取控制失效（第一名）、安全設定錯誤、軟體供應鏈失效、加密失效、注入攻擊（SQL Injection / XSS 等）、不安全設計、身分驗證失效、軟體與資料完整性失效、日誌與告警失效、例外狀況處理不當。

### 12.2 必懂觀念 🟡

| 主題 | 重點 |
|---|---|
| 加密 | 對稱（AES-GCM）vs 非對稱（RSA、ECC）；雜湊（SHA-256）≠ 加密 |
| 密碼儲存 | 使用 Argon2id / bcrypt / PBKDF2 + Salt，禁用 MD5/SHA1 |
| 傳輸安全 | 全站 HTTPS、HSTS、TLS 1.2+（建議 1.3） |
| 輸入驗證 | 參數化查詢、輸出編碼、白名單驗證 |
| 機密管理 | 不進 Git；使用 Vault、Azure Key Vault、AWS Secrets Manager、K8s Secret（需加密） |
| 最小權限 | 服務帳號、DB 帳號、雲端 IAM 都只給必要權限 |
| 零信任 | 不信任內網，每次請求都驗證 |
| 後量子密碼（PQC）🔴 | NIST 已發布 ML-KEM / ML-DSA 標準，TLS 混合金鑰交換已開始部署 |

### 12.3 DevSecOps 與供應鏈 🔴

- SAST（靜態掃描）、DAST（動態掃描）、SCA（相依套件弱點，如 Dependabot、Snyk）
- 秘密掃描（Secret Scanning）、容器映像掃描（Trivy）
- SBOM（軟體物料清單：SPDX、CycloneDX）——歐盟 CRA（網路韌性法）等法規要求
- 簽章與溯源：Sigstore / cosign、SLSA 框架
- 威脅建模：STRIDE

---

## 13. 容器、Kubernetes 與雲端

### 13.1 容器 🟢→🟡

- 容器 vs 虛擬機：共享主機核心、啟動快、輕量；隔離性較 VM 弱
- 底層：Linux Namespace（隔離）+ cgroups（資源限制）
- Docker 概念：Image、Container、Layer、Registry、Volume、Network
- Dockerfile 最佳實務：多階段建置、最小基底映像（distroless / alpine / chiseled）、非 root 執行、善用層快取、`.dockerignore`
- Docker Compose：本機多服務開發環境
- OCI 標準、containerd、Podman

### 13.2 Kubernetes 🟡→🔴

| 物件 | 用途 |
|---|---|
| Pod | 最小部署單位，一或多個容器 |
| Deployment / ReplicaSet | 無狀態應用、滾動更新 |
| StatefulSet | 有狀態應用（資料庫、Kafka），穩定網路識別與儲存 |
| DaemonSet | 每個節點跑一份（日誌收集、監控 agent） |
| Job / CronJob | 批次與排程任務 |
| Service | 穩定存取端點（ClusterIP / NodePort / LoadBalancer） |
| Ingress / Gateway API | 對外 HTTP 路由（Gateway API 為新一代標準） |
| ConfigMap / Secret | 設定與機密 |
| PV / PVC / StorageClass | 持久化儲存 |
| Namespace | 邏輯隔離 |
| HPA / VPA / KEDA | 自動擴縮（依 CPU、記憶體、或事件如 MQ 長度） |

- 核心元件：API Server、etcd、Scheduler、Controller Manager、kubelet、kube-proxy
- 健康檢查：Liveness / Readiness / Startup Probe
- 資源管理：Requests / Limits、QoS 等級、OOMKilled 排查
- 套件管理：Helm、Kustomize
- 擴充：CRD + Operator 模式
- 安全：RBAC、NetworkPolicy、Pod Security Standards
- 託管服務：AKS、EKS、GKE；本機：kind、minikube、k3s（邊緣 / IoT 輕量版）

### 13.3 雲端服務 🟢→🟡

- 服務模型：IaaS（VM）、PaaS（App Service）、SaaS、FaaS（Lambda / Azure Functions）、CaaS（容器服務）
- 三大雲：AWS、Azure（.NET 生態整合佳）、GCP
- 必懂服務類別：運算、物件儲存（S3 / Blob）、託管資料庫、網路（VPC、子網路、安全群組）、IAM、監控
- 雲端架構：多可用區（AZ）、多區域、Well-Architected Framework
- 成本管理（FinOps）：預留實例、Spot、自動擴縮、標籤歸屬

---

## 14. CI/CD 與 DevOps

### 14.1 概念 🟢

- **CI（持續整合）**：每次提交自動建置與測試
- **CD（持續交付）**：隨時可部署（需人工按下）
- **CD（持續部署）**：自動部署到生產
- DevOps 文化：開發與維運共同負責、自動化、快速回饋
- **DORA 四大指標** 🟡：部署頻率、變更前置時間、變更失敗率、故障恢復時間

### 14.2 典型 Pipeline 🟡

```
程式提交 → 靜態檢查（Lint / SAST）→ 建置 → 單元測試 → 相依掃描 →
建置映像 → 映像掃描 / 簽章 → 推送 Registry → 部署測試環境 →
整合 / E2E 測試 → 核准 → 部署生產 → 健康檢查 / 自動回滾
```

- 工具：GitHub Actions、GitLab CI、Azure DevOps、Jenkins
- 制品管理：Container Registry、NuGet / npm 私有源（Artifactory、Nexus）
- 環境：Dev → Test/QA → Staging → Production；環境一致性（Build once, deploy many）

### 14.3 部署策略 🟡→🔴

| 策略 | 說明 | 風險 / 成本 |
|---|---|---|
| 重建（Recreate） | 全停再啟 | 有停機 |
| 滾動更新（Rolling） | 逐批替換（K8s 預設） | 新舊版本共存，需向後相容 |
| 藍綠（Blue-Green） | 兩套環境切流量 | 資源加倍、回滾最快 |
| 金絲雀（Canary） | 小比例流量先試 | 需監控指標判斷（Argo Rollouts、Flagger） |
| 影子（Shadow） | 複製流量到新版但不回應 | 驗證效能，需注意副作用 |
| Feature Flag | 部署與發布分離 | 旗標債務需清理 |

### 14.4 GitOps 與基礎設施即程式碼（IaC）🔴

- IaC：Terraform / OpenTofu、Pulumi、Bicep、CloudFormation；Ansible（設定管理）
- 宣告式 vs 命令式；狀態檔管理；漂移偵測
- GitOps：Git 為唯一事實來源，Argo CD / Flux 自動同步到 K8s
- 平台工程（Platform Engineering）：內部開發者平台（IDP，如 Backstage），提供自助式黃金路徑

---

## 15. 維運與可觀測性

### 15.1 可觀測性三支柱 🟡

| 支柱 | 內容 | 工具 |
|---|---|---|
| Logs（日誌） | 結構化日誌（JSON）、等級、關聯 ID | Serilog、ELK / OpenSearch、Loki |
| Metrics（指標） | 數值時間序列 | Prometheus + Grafana |
| Traces（追蹤） | 跨服務請求鏈路 | Jaeger、Tempo、Zipkin |
| （第四支柱）Profiles | 持續效能剖析 | Pyroscope |

- **OpenTelemetry（OTel）**：業界統一的觀測資料標準，優先採用
- 方法論：RED（Rate / Errors / Duration，用於服務）、USE（Utilization / Saturation / Errors，用於資源）、Four Golden Signals（延遲、流量、錯誤、飽和度）
- 商業方案：Datadog、New Relic、Dynatrace、Azure Monitor / Application Insights

### 15.2 SRE 核心 🟡→🔴

- **SLI**（指標）→ **SLO**（內部目標，如 99.9%）→ **SLA**（對外合約）
- 錯誤預算（Error Budget）：用完就暫停發新功能，優先穩定性
- 可用性換算：99.9% ≈ 每月 43 分鐘停機；99.99% ≈ 每月 4.3 分鐘
- 減少苦工（Toil）：自動化重複性工作

### 15.3 告警與事故管理 🟡

- 告警原則：針對**症狀**（使用者受影響）而非原因；可行動、低雜訊、分級
- 值班（On-call）：PagerDuty、Opsgenie
- 事故流程：偵測 → 分級 → 止血（先恢復服務）→ 溝通 → 根因分析 → **無究責事後檢討（Blameless Postmortem）**
- Runbook / Playbook：標準處理程序文件化

### 15.4 備份與災難復原 🟡→🔴

- **RPO**（可容忍資料遺失時間）、**RTO**（可容忍恢復時間）
- 3-2-1 備份原則：3 份副本、2 種媒介、1 份異地（加上不可變備份防勒索）
- **定期演練還原**：沒驗證過的備份等於沒有備份
- DR 策略：備份還原 → Pilot Light → Warm Standby → 多活（Active-Active）

### 15.5 日常維運 🟢→🟡

- Linux 基本操作：程序、權限、網路排查（`ss`、`curl`、`dig`、`tcpdump`）、日誌（`journalctl`）
- 設定管理：12-Factor App（設定由環境變數注入、無狀態、日誌輸出至 stdout 等）
- 容量規劃、憑證到期監控、相依套件定期更新、變更管理

---

## 16. AI 輔助開發與 LLM 應用

### 16.1 AI 輔助開發 🟢

- 工具：AI Coding Agent（Claude Code、GitHub Copilot、Cursor 等）
- 有效用法：清楚描述需求與限制、提供上下文、要求先規劃再實作、**一律審查與測試產出**
- 風險：幻覺 API、授權與機密外洩、安全漏洞、過度依賴導致理解不足

### 16.2 LLM 應用架構 🟡→🔴

| 概念 | 說明 |
|---|---|
| Prompt Engineering | 角色、上下文、範例、輸出格式 |
| RAG | 檢索增強生成：文件切塊 → 向量化 → 向量資料庫 → 檢索 → 組合提示 |
| Tool Use / Function Calling | 讓模型呼叫外部 API |
| Agent | 模型自主規劃、多步驟呼叫工具 |
| MCP（Model Context Protocol） | 連接 AI 與外部工具 / 資料源的開放標準 |
| 評估（Evals） | 以測試集量化輸出品質，LLM 應用的「單元測試」 |
| 成本與延遲 | Token 計費、Prompt Caching、串流回應、模型分級使用 |
| 安全 | Prompt Injection、資料外洩、輸出驗證 |

---

## 17. 嵌入式與韌體（轉職橋接）

> 對應轉職目標：從軟體工程師角度理解韌體世界，標示與既有經驗的對應關係。

### 17.1 基礎觀念 🟢

| 概念 | 說明 | 對應軟體經驗 |
|---|---|---|
| MCU vs MPU | MCU：單晶片含 Flash/RAM/周邊，跑裸機或 RTOS（STM32、ESP32、nRF、RP2040）；MPU：需外部記憶體，跑 Linux（i.MX、樹莓派） | — |
| 架構 | ARM Cortex-M（MCU 主流）、Cortex-A（應用處理器）、**RISC-V**（開源指令集，快速成長） | — |
| 記憶體 | Flash（程式）、SRAM（變數）、EEPROM；Linker Script 決定記憶體配置 | 類似部署組態，但資源以 KB 計 |
| 啟動流程 | Reset Vector → Startup Code → `main()`；Bootloader | 類似應用程式進入點 |
| 中斷（Interrupt） | ISR 要短、`volatile`、優先權、巢狀中斷 | 類似事件處理，但硬即時 |
| 暫存器操作 | Memory-mapped I/O、位元運算、HAL vs 直接操作暫存器 | — |

### 17.2 語言與工具鏈 🟢→🟡

- **C**：主流（仍占絕大多數）；熟悉指標、結構對齊、`volatile`、位元欄位、MISRA C 規範
- **C++**：中大型韌體，使用受限子集（禁例外、限制動態配置）
- **Rust**：Embedded Rust（embassy、RTIC）成長中，安全關鍵產業開始評估
- 工具鏈：GCC ARM / LLVM、CMake、Make、Zephyr West；IDE：STM32CubeIDE、VS Code + 擴充、Keil、IAR
- 除錯：JTAG / SWD、J-Link / ST-Link、GDB / OpenOCD、示波器、邏輯分析儀

### 17.3 通訊介面與協定 🟡

| 類別 | 介面 / 協定 |
|---|---|
| 板內通訊 | GPIO、UART、SPI、I²C、ADC/DAC、PWM、DMA |
| 車用 / 工業 | CAN / CAN-FD、LIN、Modbus、EtherCAT、車用乙太網路 |
| 無線 | BLE、Wi-Fi、LoRa、Zigbee、Thread / **Matter**（智慧家庭統一標準）、Cellular IoT（NB-IoT / LTE-M） |
| IoT 應用層 | MQTT（對應軟體端 MQ 經驗）、CoAP、HTTP |

### 17.4 RTOS 與嵌入式 Linux 🟡→🔴

- RTOS：**FreeRTOS**、**Zephyr**（Linux 基金會，業界快速採用）、ThreadX（現為 Eclipse ThreadX）、RT-Thread
  - 概念：Task、優先權排程、Queue、Semaphore、Mutex、優先權反轉、Stack 大小規劃
  - 對應：與作業系統執行緒同步觀念相通，但強調**確定性（Deterministic）時序**
- 嵌入式 Linux：Bootloader（U-Boot）、Device Tree、Kernel Driver、Yocto / Buildroot 建置系統

### 17.5 韌體工程實務（產業前沿需求）🔴

| 主題 | 重點 |
|---|---|
| OTA 更新 | A/B 分割區、回滾、差分更新、簽章驗證（MCUboot、Mender、SWUpdate） |
| 安全 | Secure Boot、信任根（Root of Trust）、TrustZone、安全元件、金鑰燒錄 |
| 法規 | 歐盟 CRA（網路韌性法）、IEC 62443（工業）、ISO 21434（車用資安）、ISO 26262（車用功能安全）、IEC 61508 |
| 低功耗 | 睡眠模式、時脈管理、功耗量測 |
| 測試 | 單元測試（Unity、Ceedling、GoogleTest）、模擬（QEMU、Renode）、**HIL（硬體迴圈測試）** |
| 韌體 CI/CD | 交叉編譯 pipeline、靜態分析（cppcheck、clang-tidy、Coverity）、自動燒錄測試 |
| 邊緣 AI（TinyML） | TensorFlow Lite for Microcontrollers、NPU 加速 |

### 17.6 軟體工程師轉韌體的優勢與補強

- **可帶過去的優勢**：Git、CI/CD、測試思維、架構設計、雲端 IoT 後台整合、MQ（MQTT）、Linux
- **需補強**：C 語言深度、數位電路基礎、看懂 Datasheet / 電路圖、硬體除錯工具、即時系統思維
- 入門建議：STM32 Nucleo 或 ESP32 開發板 → 裸機 GPIO/UART → FreeRTOS → Zephyr → OTA + 雲端串接專案作品集

---

## 18. 軟技能與職涯

- 溝通：將技術語言轉譯為商業價值；寫清楚的文件與提案
- 需求分析：釐清問題本質、識別非功能需求、管理範疇
- 技術決策：列出選項、取捨、風險，並以 ADR 留存
- 時間與優先順序：重要 vs 緊急、拆解任務
- 持續學習：閱讀官方文件與 RFC、追蹤技術雷達（ThoughtWorks Tech Radar）、實作專案
- 職級能力：
  - 🟢 初階：完成被指派任務、懂基本工具
  - 🟡 中階：獨立負責模組、考慮測試與維運
  - 🔴 資深：系統設計、跨團隊影響、技術決策、帶人

---

## 附錄 A：學習路線

| 階段 | 目標 | 主題 |
|---|---|---|
| 階段一：基礎 | 能寫出可運作的應用 | 第 1、2、3、4（基礎）、5（REST）、6（SQL 基礎）章 |
| 階段二：工程化 | 能交付可維護、可部署的服務 | Git 流程、測試、Docker、CI、快取、認證授權、日誌 |
| 階段三：系統化 | 能設計可擴展、高可用系統 | MQ、分散式系統、高併發、K8s、可觀測性、安全 |
| 階段四：架構與決策 | 能做技術選型與架構取捨 | DDD、微服務、CQRS/Saga、IaC/GitOps、SRE、成本 |

> 本人背景（.NET / Vue / Node.js / MSSQL / MariaDB）建議優先補：PostgreSQL → RabbitMQ → Kafka → Docker → K8s → CI/CD → 高併發與分散式；韌體方向並行第 17 章。

---

## 附錄 B：名詞速查

| 名詞 | 一句話解釋 |
|---|---|
| ACID | 交易四大特性：原子、一致、隔離、持久 |
| ADR | 架構決策紀錄 |
| BFF | 為特定前端設計的後端聚合層 |
| CAP | 分區時一致性與可用性只能擇一 |
| CDC | 變更資料擷取，從 DB 日誌捕捉異動（Debezium） |
| CQRS | 讀寫責任分離 |
| DLQ | 死信佇列，存放處理失敗的訊息 |
| DORA | 衡量 DevOps 成效的四大指標 |
| GitOps | 以 Git 為唯一事實來源的部署方式 |
| HPA | K8s 水平自動擴縮 |
| IaC | 基礎設施即程式碼 |
| Idempotency | 冪等：重複執行結果相同 |
| MVCC | 多版本併發控制 |
| OTel | OpenTelemetry，觀測資料標準 |
| P99 | 99% 請求的延遲上限 |
| RPO / RTO | 可容忍的資料遺失時間 / 恢復時間 |
| Saga | 以補償交易處理分散式長交易 |
| SBOM | 軟體物料清單 |
| SLI / SLO / SLA | 服務指標 / 目標 / 合約 |
| HIL | 硬體迴圈測試 |
| OTA | 空中韌體更新 |
| RTOS | 即時作業系統 |
