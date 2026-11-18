import { fileURLToPath } from 'node:url'
import vuetify from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },
  ssr: true,

  app: {
    // GitHub Pages 子路徑由 NUXT_APP_BASE_URL 注入（例：/SWEMindset/）
    head: {
      htmlAttrs: { lang: 'zh-Hant' },
      title: 'SWE Mindset',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '軟體工程師必備常識知識庫：從基礎到進階' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap',
        },
      ],
    },
  },

  css: ['@mdi/font/css/materialdesignicons.css', '~/assets/main.scss'],

  build: { transpile: ['vuetify'] },

  hooks: {
    'vite:extendConfig': (config) => {
      config.plugins ||= []
      config.plugins.push(vuetify({ autoImport: true }))
    },
  },

  vite: {
    ssr: { noExternal: ['vuetify'] },
  },

  runtimeConfig: {
    // 內容來源：目前為 markdown，之後可改為 postgres
    contentSource: 'markdown',
    docsDir: fileURLToPath(new URL('../docs', import.meta.url)),
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/api/search-index.json'],
    },
  },
})
