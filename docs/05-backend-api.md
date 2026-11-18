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

1. REST 和 gRPC 怎麼選？
2. 什麼是冪等？如何避免重複扣款？
3. JWT 的優缺點？如何處理登出？
4. OAuth 2.0 和 OIDC 的差別？
5. PUT 和 PATCH 差在哪？

## 過時技術（知道就好）

- **SOAP / WCF**：XML 為主的舊式 Web Service，常見於銀行、政府舊系統整合。
- **OAuth 1.0、OAuth 2.0 Implicit Flow**：已不建議使用。
- **ASP.NET Web Forms**：已淘汰。

## 本章回顧

- 對外用 REST，對內高效能用 gRPC，即時用 WebSocket / SSE
- POST 不冪等，金流必須處理重複請求
- 認證和授權是兩件事
