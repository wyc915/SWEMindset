# 名詞速查

> 依英文字母排序，每個名詞一句話，點章節編號可跳到詳細說明。

| 名詞 | 一句話解釋 | 章節 |
|---|---|---|
| ACID | 交易四特性：原子、一致、隔離、持久 | [06](06-database.md) |
| ACPI | 韌體提供給作業系統的硬體描述與電源管理介面 | [25](25-bios-uefi-bmc.md) |
| ADR | 架構決策紀錄，記下「為什麼這樣決定」 | [09](09-architecture.md) |
| API Gateway | 系統統一入口，負責路由、認證、限流 | [09](09-architecture.md) |
| BFF | 為特定前端（Web / App）設計的專屬後端 | [09](09-architecture.md) |
| BMC | 伺服器上獨立的管理控制器，主機關機時也能遠端管理 | [25](25-bios-uefi-bmc.md) |
| Bootloader | 開機最先執行的程式，負責驗證、載入主程式與更新韌體 | [23](23-firmware-debug-test-release.md) |
| CAN | 車用與工業常用的差動匯流排，以 ID 仲裁優先權 | [21](21-mcu-hardware.md) |
| CAP | 網路分區時，一致性與可用性只能擇一 | [10](10-distributed-systems.md) |
| CDN | 把靜態資源放在離使用者近的節點 | [01](01-cs-fundamentals.md) |
| CI / CD | 持續整合 / 持續交付或部署 | [14](14-cicd-devops.md) |
| Circuit Breaker | 熔斷：下游故障時暫停呼叫，防止連環崩潰 | [11](11-high-concurrency.md) |
| CORS | 瀏覽器限制跨網域請求的機制 | [01](01-cs-fundamentals.md) |
| CQRS | 讀取與寫入使用不同模型 | [09](09-architecture.md) |
| CRA | 歐盟網路韌性法案，要求連網產品符合資安要求 | [23](23-firmware-debug-test-release.md) |
| CSR / SSR / SSG | 客戶端渲染 / 伺服器渲染 / 靜態生成 | [04](04-frontend.md) |
| DDD | 領域驅動設計，依業務切分系統邊界 | [09](09-architecture.md) |
| Device Tree | 描述硬體配置的資料檔，讓同一份核心支援多種電路板 | [24](24-embedded-linux.md) |
| DI | 依賴注入，依賴由外部提供 | [03](03-engineering-practices.md) |
| DLQ | 死信佇列，存放多次處理失敗的訊息 | [08](08-message-queue.md) |
| DMA | 由硬體直接搬移資料，不佔用 CPU | [21](21-mcu-hardware.md) |
| DORA | 衡量 DevOps 成效的四個指標 | [14](14-cicd-devops.md) |
| GitOps | 以 Git 作為部署狀態的唯一來源 | [14](14-cicd-devops.md) |
| GPIO | 通用輸入輸出腳位 | [21](21-mcu-hardware.md) |
| HardFault | Cortex-M 的嚴重錯誤例外，常因非法記憶體存取造成 | [23](23-firmware-debug-test-release.md) |
| HIL | 硬體迴圈測試，用真實或模擬硬體自動測韌體 | [23](23-firmware-debug-test-release.md) |
| HPA | K8s 依負載自動增減 Pod 數量 | [13](13-container-k8s-cloud.md) |
| IaC | 基礎設施即程式碼 | [14](14-cicd-devops.md) |
| Idempotency | 冪等：重複執行結果相同 | [05](05-backend-api.md) |
| IPMI / Redfish | 伺服器遠端管理介面：舊式二進位指令 / 新式 REST API | [25](25-bios-uefi-bmc.md) |
| ISR | 中斷服務程式，硬體事件發生時執行，必須極短 | [22](22-rtos-concurrency.md) |
| JWT | 帶簽章的 Token，常用於 API 認證 | [05](05-backend-api.md) |
| MCU / MPU | 微控制器（單晶片含記憶體） / 微處理器（需外接記憶體） | [19](19-embedded-overview.md) |
| MQTT | 輕量發佈 / 訂閱協定，IoT 主流 | [21](21-mcu-hardware.md) |
| Mutex / Semaphore | 保護共享資源的互斥鎖 / 用於事件通知或計數的號誌 | [22](22-rtos-concurrency.md) |
| MVCC | 多版本併發控制，讓讀寫互不阻塞 | [06](06-database.md) |
| N+1 | 迴圈中逐筆查詢造成大量 SQL | [06](06-database.md) |
| OAuth 2.0 / OIDC | 授權框架 / 建立在其上的登入身分標準 | [05](05-backend-api.md) |
| OpenBMC | Linux 基金會的開源 BMC 韌體專案 | [25](25-bios-uefi-bmc.md) |
| ORM | 以物件操作資料庫的工具 | [06](06-database.md) |
| OTA | 遠端無線更新韌體 | [23](23-firmware-debug-test-release.md) |
| OTel | OpenTelemetry，可觀測性資料標準 | [15](15-operations-observability.md) |
| Outbox | 保證資料寫入與訊息發送一致的模式 | [08](08-message-queue.md) |
| P99 | 99% 請求的延遲都低於此值 | [11](11-high-concurrency.md) |
| PWM | 以占空比控制平均輸出，用於調光、馬達 | [21](21-mcu-hardware.md) |
| QPS | 每秒請求數 | [11](11-high-concurrency.md) |
| RAG | 先檢索相關資料再讓 LLM 回答 | [16](16-ai-llm.md) |
| RBAC | 以角色為基礎的權限控管 | [05](05-backend-api.md) |
| RPO / RTO | 可接受的資料遺失時間 / 恢復時間 | [15](15-operations-observability.md) |
| RTOS | 即時作業系統 | [22](22-rtos-concurrency.md) |
| Saga | 以補償動作處理跨服務交易 | [10](10-distributed-systems.md) |
| SBOM | 軟體物料清單，列出使用的所有元件 | [12](12-security.md) |
| Secure Boot | 開機時逐層驗證韌體簽章，防止執行被竄改的程式 | [23](23-firmware-debug-test-release.md) |
| SemVer | 語意化版本號：主.次.修訂 | [03](03-engineering-practices.md) |
| SLI / SLO / SLA | 服務指標 / 內部目標 / 對外合約 | [15](15-operations-observability.md) |
| SOLID | 五個物件導向設計原則 | [03](03-engineering-practices.md) |
| UART / I²C / SPI | 三種常見晶片間通訊介面 | [21](21-mcu-hardware.md) |
| UEFI | 取代傳統 BIOS 的開機韌體標準 | [25](25-bios-uefi-bmc.md) |
| volatile | 告訴編譯器變數可能被外部改變，不可最佳化 | [20](20-embedded-c.md) |
| Watchdog | 看門狗：程式卡死時自動重置系統 | [23](23-firmware-debug-test-release.md) |
| XSS / CSRF | 跨站腳本攻擊 / 跨站請求偽造 | [12](12-security.md) |
| Yocto / Buildroot | 建置嵌入式 Linux 映像的系統 | [24](24-embedded-linux.md) |
