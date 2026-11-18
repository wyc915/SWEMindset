# 13. 容器、Kubernetes 與雲端

> **一句話**：Docker 解決「在我電腦能跑，在伺服器不能跑」；Kubernetes 解決「幾百個容器要怎麼自動管理」。

---

## 1. 容器（Docker）🟢

### 1.1 容器 vs 虛擬機

| | 虛擬機（VM） | 容器 |
|---|---|---|
| 包含 | 完整作業系統 | 只有應用程式與其相依套件 |
| 大小 | GB 等級 | MB 等級 |
| 啟動 | 分鐘 | 秒 |
| 隔離性 | 強 | 較弱（共用主機核心） |

**比喻**：VM 像蓋一棟獨立房子；容器像公寓裡的房間，共用地基與水電。

### 1.2 核心概念

- **Image（映像檔）**：唯讀的打包模板，像安裝光碟
- **Container（容器）**：映像檔執行起來的實例
- **Dockerfile**：描述如何建立映像檔的腳本
- **Registry**：存放映像檔的倉庫（Docker Hub、Azure Container Registry、GitHub Container Registry）
- **Volume**：容器刪除後資料仍要保留時使用（容器本身是用完即丟的）
- **Docker Compose**：一個檔案啟動多個容器，常用於本機開發（例如 API + PostgreSQL + Redis）

### 1.3 Dockerfile 好習慣 🟡

- **多階段建置**：用 SDK 映像編譯，再複製結果到精簡的執行映像 → 映像更小更安全
- 使用精簡基底映像（例如 .NET 的 chiseled 映像、distroless、alpine）
- **不要用 root 身分執行**
- 不要把機密寫進映像檔

## 2. Kubernetes（K8s）🟡

### 2.1 解決什麼問題

當你有很多容器時，誰來負責：
- 某台機器掛了，自動把容器搬到別台
- 流量變大時自動增加容器數量
- 更新版本時不停機
- 容器之間怎麼互相找到

→ K8s 就是**容器的自動化調度與管理平台**。你只要宣告「我要 3 份這個服務」，它會持續確保實際狀態等於你宣告的狀態。

### 2.2 最常用的物件（先懂這些就夠）

| 物件 | 用途 | 白話 |
|---|---|---|
| **Pod** | 最小部署單位，包含一或多個容器 | 一個執行中的應用實例 |
| **Deployment** | 管理多個相同 Pod，負責滾動更新 | 「我要 3 份 API，更新時一台一台換」 |
| **Service** | 提供固定的存取位址，並分散流量給 Pod | Pod 會換 IP，Service 是固定門牌 |
| **Ingress** | 對外的 HTTP 入口與路由規則 | 依網址轉到不同 Service |
| **ConfigMap / Secret** | 設定值 / 機密資料 | 設定與程式分離 |
| **StatefulSet** | 有狀態的應用（資料庫） | 需要固定名稱與儲存 |
| **HPA** | 依 CPU、記憶體等指標自動增減 Pod 數 | 自動擴縮 |
| **Namespace** | 邏輯隔離 | 分開 dev、test 環境或不同團隊 |

### 2.3 健康檢查（常被問）

- **Liveness Probe**：程式還活著嗎？失敗 → 重啟容器
- **Readiness Probe**：準備好接流量了嗎？失敗 → 暫時不導流量進來（例如啟動中、資料庫還沒連上）

### 2.4 資源設定

- **Requests**：保證分配的資源（排程依據）
- **Limits**：最多能用的資源，記憶體超過會被強制終止（OOMKilled）

### 2.5 周邊工具

- **Helm**：K8s 的套件管理器，用範本管理多環境設定
- **託管服務**：AKS（Azure）、EKS（AWS）、GKE（Google）——不用自己維護控制平面
- **本機練習**：kind、minikube、Docker Desktop 內建 K8s
- **k3s**：輕量版 K8s，常用於邊緣運算與 IoT

> 提醒：K8s 學習與維運成本高。小型系統用雲端 PaaS（Azure App Service、Cloud Run）往往更划算。

## 3. 雲端基本觀念 🟢

| 服務模型 | 你要管什麼 | 例子 |
|---|---|---|
| **IaaS** | 作業系統以上全部 | 虛擬機（EC2、Azure VM） |
| **PaaS** | 只管程式與資料 | Azure App Service、託管資料庫 |
| **SaaS** | 只管使用 | Gmail、Microsoft 365 |
| **FaaS / Serverless** | 只管函式 | AWS Lambda、Azure Functions |

**必懂的雲端服務類別**：運算、物件儲存（S3、Blob Storage）、託管資料庫、網路（VPC、子網路、防火牆規則）、身分與權限（IAM）、監控。

**高可用觀念**：部署到多個**可用區（Availability Zone）**，單一機房故障不影響服務。

**成本意識**：雲端最常見的問題是帳單失控 → 自動擴縮、關閉閒置資源、設定預算告警。

---

## 面試常問

1. 容器和虛擬機的差別？
2. Docker 映像檔為什麼要用多階段建置？
3. K8s 的 Pod、Deployment、Service 分別是什麼？
4. Liveness 和 Readiness Probe 的差別？
5. Pod 一直重啟（CrashLoopBackOff），你會怎麼排查？（看 log、看事件、檢查設定與資源限制）
6. IaaS、PaaS、SaaS 的差別？

## 過時技術（知道就好）

- **Docker Swarm**：Docker 原生的叢集方案，已被 K8s 取代。
- **在 IIS 上手動部署、遠端桌面複製檔案**：舊式部署方式，現由容器與 CI/CD 取代。
- **dockershim**：K8s 已移除對 Docker Engine 的直接支援，改用 containerd，但 Docker 建立的映像檔照樣能跑。

## 本章回顧

- Docker 解決環境一致；K8s 解決大規模自動管理
- 先懂 Pod、Deployment、Service、Ingress、Probe
- 不是所有系統都需要 K8s
