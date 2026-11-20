# 05. 後端與 API 設計

> **一句話**：API 是系統間的合約。好的 API 讓呼叫者不會誤用，壞的 API 會讓錯誤擴散到每個呼叫端。

---

## 1. API 風格怎麼選 🟢

| 風格 | 一句話 | 適合 |
|---|---|---|
| **REST** | 用 URL 表示資源、用 HTTP 方法表示動作 | 對外 API、一般 CRUD（最主流） |
| **GraphQL** | 前端自己指定要哪些欄位 | 前端畫面需求多變 |
| **gRPC** | 二進位格式、高效、強型別 | 內部微服務之間 |
| **WebSocket** | 長連線、雙向即時 | 聊天、即時通知、儀表板 |
| **SSE** | 伺服器單向持續推送 | 進度通知、AI 逐字輸出 |
| **Webhook** | 事件發生時主動回呼對方 | 金流通知、Git 事件 |

## 2. REST 設計重點 🟢

- **URL 用名詞**：`GET /orders/123`，不要 `/getOrder?id=123`
- **方法表達動作**：GET 查、POST 建、PUT/PATCH 改、DELETE 刪
- **狀態碼要正確**：建立成功 201、參數錯 400、未登入 401、無權限 403、找不到 404
- **分頁**：資料量大時用 Cursor（記住上次位置）比 Offset（跳過 N 筆）效能好
- **版本**：`/api/v1/...`，破壞相容時升版
- **文件**：用 OpenAPI（Swagger）自動產生

## 3. 冪等性（面試必考）🟡

**冪等**：同一個請求執行一次或多次，結果都一樣。

- GET、PUT、DELETE 天然冪等；**POST 不是**
- 問題情境：使用者按了兩次付款，或網路逾時自動重試 → 重複扣款
- 解法：用戶端帶 **Idempotency-Key**，伺服器記錄處理過的 Key，重複就直接回傳上次結果

## 4. 錯誤處理與穩定性 🟡

- 錯誤回應格式統一（業界標準：RFC 9457 Problem Details）
- 不要把例外堆疊（Stack Trace）回傳給使用者
- 呼叫外部服務一定要設 **逾時**，重試要用 **指數退避**（等 1、2、4 秒…），避免打爆對方

## 5. 認證與授權 🟡

**認證（AuthN）= 你是誰；授權（AuthZ）= 你能做什麼。**

### Session vs Token

| | Session | Token（JWT） |
|---|---|---|
| 狀態存哪 | 伺服器 | 用戶端持有 Token |
| 擴展 | 多台伺服器需共享 Session（如放 Redis） | 天然無狀態，易擴展 |
| 撤銷 | 刪掉 Session 即可 | 困難 → 搭配短效期 + Refresh Token |

### JWT 重點

- 結構：Header.Payload.Signature
- Payload 只是 Base64 編碼，**任何人都看得到，不可放密碼等敏感資料**
- 簽章確保沒被竄改

### OAuth 2.0 / OpenID Connect

- **OAuth 2.0**：授權第三方存取資源（「允許此 App 讀取你的 Google 相簿」）
- **OIDC**：在 OAuth 2.0 上加了「登入身分」（「用 Google 登入」）
- 現行推薦流程：**Authorization Code + PKCE**

### 權限模型

- **RBAC**（角色型）：管理員、編輯、訪客 —— 最常見
- **ABAC**（屬性型）：依部門、時間、地點等條件判斷 —— 較彈性

## 6. 主流後端框架 🟢

| 語言 | 框架 |
|---|---|
| C# | ASP.NET Core、EF Core（ORM）、Dapper（輕量 SQL 對應） |
| Node.js | Express、NestJS（結構化，類似 Angular） |
| Java | Spring Boot |
| Go | Gin、標準庫 |
| Python | FastAPI、Django |

---

## 面試常問

> 先試著自己回答，再對照參考解答。

### Q1. REST 和 gRPC 怎麼選？

- **REST**：基於 HTTP + JSON，通用、易讀、瀏覽器與各種工具都支援 → **對外公開 API、前端呼叫**
- **gRPC**：基於 HTTP/2 + Protobuf 二進位格式，**效能高、強型別、支援雙向串流**，可由 `.proto` 檔自動產生多語言程式碼 → **內部微服務間高頻呼叫**

常見組合：對外用 REST，服務之間用 gRPC。gRPC 的缺點是瀏覽器支援需額外轉換（gRPC-Web）、除錯不如 JSON 直觀。

### Q2. 什麼是冪等？如何避免重複扣款？

**冪等**：同一個操作執行一次或多次，結果都相同。GET、PUT、DELETE 天然冪等；POST 不是。

避免重複扣款：
1. 客戶端產生唯一的 **Idempotency-Key**（例如 UUID）隨請求送出，重試時帶同一個 Key
2. 伺服器收到後先檢查此 Key 是否處理過：處理過就**直接回傳上次的結果**，不再扣款
3. Key 與結果存在資料庫或 Redis，並設定**唯一鍵約束**防止兩個併發請求同時通過檢查

另外可在訂單層面用「訂單狀態」判斷，例如只有「待付款」狀態才能付款。

### Q3. JWT 的優缺點？如何處理登出？

**優點**：無狀態，伺服器不用存 Session，易於水平擴展與跨服務驗證。
**缺點**：簽發後**在過期前都有效，難以主動撤銷**；Payload 可被解碼，不可放敏感資料；Token 較大。

處理登出的常見做法：
- **短效 Access Token（如 15 分鐘）+ Refresh Token**：登出時刪除 / 作廢伺服器端儲存的 Refresh Token，Access Token 很快自然過期
- **黑名單**：把登出 Token 的 ID（jti）存進 Redis 直到過期，每次驗證時檢查
- 前端同時清除儲存的 Token

### Q4. OAuth 2.0 和 OIDC 的差別？

- **OAuth 2.0** 是**授權**協定：讓第三方應用在使用者同意下取得**存取資源的權限**（Access Token），例如「允許此 App 讀取你的 Google 雲端硬碟」。它本身不定義「使用者是誰」。
- **OIDC（OpenID Connect）** 建立在 OAuth 2.0 之上，加入**身分認證**：多回傳一個 **ID Token（JWT）**，包含使用者身分資訊，用於「使用 Google 帳號登入」。

簡記：OAuth 2.0 管「能做什麼」，OIDC 管「你是誰」。

### Q5. PUT 和 PATCH 差在哪？

- **PUT**：以請求內容**整筆取代**資源，沒傳的欄位視為清空或預設值；具冪等性
- **PATCH**：只**修改有傳的欄位**，其他欄位不變；是否冪等視實作而定

例：使用者資料有 name、email、phone。只想改 email：用 PATCH 傳 `{ "email": "..." }`；若用 PUT 只傳 email，name 與 phone 可能被清空。

## 過時技術（知道就好）

- **SOAP / WCF**：XML 為主的舊式 Web Service，常見於銀行、政府舊系統整合。
- **OAuth 1.0、OAuth 2.0 Implicit Flow**：已不建議使用。
- **ASP.NET Web Forms**：已淘汰。

## 本章回顧

- 對外用 REST，對內高效能用 gRPC，即時用 WebSocket / SSE
- POST 不冪等，金流必須處理重複請求
- 認證和授權是兩件事
