# SWE Mindset Web

知識庫網頁平台：Nuxt 4 + Vuetify 4（Material 3），內容讀取自 `../docs/*.md`，預先產生為靜態網站。

## 開發

```bash
npm install
npm run dev        # http://localhost:3000
npm run generate   # 產生靜態站到 .output/public
```

## 架構

| 位置 | 職責 |
|---|---|
| `shared/types/content.ts` | 資料型別與 `ContentRepository` 介面 |
| `server/content/` | 內容來源實作（目前為 Markdown），`index.ts` 依 `contentSource` 切換 |
| `server/api/` | 前端取資料的 API（建置時預先產生） |
| `app/layouts/default.vue` | RWD 版面：手機抽屜 / 平板 Navigation Rail / 桌機常駐側欄 |
| `app/pages/` | 首頁、章節頁 |
| `app/plugins/vuetify.ts` | Material 3 色票與深淺色主題 |

## 之後改接 PostgreSQL

1. 新增 `server/content/postgresRepository.ts`，實作 `ContentRepository`
2. 在 `server/content/index.ts` 加上 `case 'postgres'`
3. 設定環境變數 `NUXT_CONTENT_SOURCE=postgres`，部署方式改為 Node 伺服器（`npm run build`），而非純靜態

前端頁面不需修改。

## 部署

推送到 `main` 後，`.github/workflows/deploy-web.yml` 會自動建置並發布到 GitHub Pages。
首次使用需到 repo **Settings → Pages → Source** 選擇 **GitHub Actions**。
