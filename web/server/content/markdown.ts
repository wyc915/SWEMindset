import MarkdownIt from 'markdown-it'
import type { TocItem } from '#shared/types/content'

const LEVELS: Record<string, { cls: string; label: string }> = {
  '🟢': { cls: 'basic', label: '基礎' },
  '🟡': { cls: 'mid', label: '進階' },
  '🔴': { cls: 'adv', label: '高階' },
}
const LEVEL_RE = /🟢|🟡|🔴/g

export const stripLevels = (s: string) => s.replace(LEVEL_RE, '').replace(/\s*→\s*$/, '').replace(/→/g, '').trim()

/** 標題轉錨點 id：保留中英數字，其餘轉為連字號 */
export function slugify(text: string): string {
  return stripLevels(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

export interface RenderResult {
  html: string
  toc: TocItem[]
  title: string
}

export interface RenderOptions {
  baseURL: string
  /** 移除第一個 h1（頁面標題由版面顯示） */
  dropTitle?: boolean
}

/** 將 md 互連結（01-xxx.md#a）改寫為站內路由 */
function rewriteHref(href: string, baseURL: string): { href: string; internal: boolean } {
  if (/^[a-z]+:/i.test(href) || href.startsWith('#')) return { href, internal: false }
  const m = href.match(/^(?:\.\/)?(?:docs\/)?([\w-]+)\.md(#.*)?$/)
  if (!m) return { href, internal: false }
  const base = baseURL.endsWith('/') ? baseURL : baseURL + '/'
  const path = m[1].toLowerCase() === 'readme' ? '' : `chapters/${m[1]}`
  return { href: base + path + (m[2] ?? ''), internal: true }
}

export function renderMarkdown(src: string, opts: RenderOptions): RenderResult {
  const md = new MarkdownIt({ html: false, linkify: true })
  const tokens = md.parse(src, {})
  const toc: TocItem[] = []
  const used = new Map<string, number>()
  let title = ''

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t.type === 'heading_open') {
      const inline = tokens[i + 1]
      const text = inline.content
      if (t.tag === 'h1') {
        if (!title) title = stripLevels(text)
        if (opts.dropTitle) {
          tokens.splice(i, 3)
          i--
        }
        continue
      }
      let id = slugify(text) || 'section'
      const n = used.get(id) ?? 0
      used.set(id, n + 1)
      if (n) id = `${id}-${n}`
      t.attrSet('id', id)
      if (t.tag === 'h2' || t.tag === 'h3') {
        toc.push({ id, text: stripLevels(text), level: t.tag === 'h2' ? 2 : 3 })
      }
    }
    if (t.type === 'inline' && t.children) {
      for (const c of t.children) {
        if (c.type === 'link_open') {
          const r = rewriteHref(c.attrGet('href') ?? '', opts.baseURL)
          c.attrSet('href', r.href)
          if (r.internal) c.attrSet('data-internal', '1')
          else if (/^https?:/.test(r.href)) {
            c.attrSet('target', '_blank')
            c.attrSet('rel', 'noopener')
          }
        }
      }
    }
  }

  // Mermaid 流程圖：輸出原始碼，由前端渲染成 SVG（未渲染前顯示原始碼）
  const defaultFence = md.renderer.rules.fence!
  md.renderer.rules.fence = (tks, idx, options, env, self) => {
    const t = tks[idx]
    if (t.info.trim() === 'mermaid') {
      const src = md.utils.escapeHtml(t.content)
      return `<div class="mermaid-diagram" data-src="${src}"><pre class="mermaid-fallback"><code>${src}</code></pre></div>\n`
    }
    return defaultFence(tks, idx, options, env, self)
  }

  md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n'
  md.renderer.rules.table_close = () => '</table></div>\n'

  let html = md.renderer.render(tokens, md.options, {})
  // 難度符號轉為 Material 標籤
  html = html.replace(LEVEL_RE, (e) => {
    const l = LEVELS[e]
    return `<span class="lvl lvl-${l.cls}">${l.label}</span>`
  })
  html = wrapQuestions(html)
  html = wrapSections(html)
  return { html, toc, title }
}

/** 去除 Markdown 語法，取得純文字（搜尋用） */
export function toPlainText(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*\|?[-:| ]+\|?\s*$/gm, ' ')
    .replace(/[#>*_|]/g, ' ')
    .replace(LEVEL_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 將「### Qn. 題目」與其後的解答包成可展開區塊（預設收合），
 * 讓讀者先自己作答再看解答（主動回想）。
 */
export function wrapQuestions(html: string): string {
  return html.replace(
    /<h3 id="(q\d+[^"]*)">([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3 |<h2 |<hr|$)/g,
    (_m, id: string, title: string, body: string) =>
      `<details class="qa" id="${id}"><summary>${title}</summary><div class="qa-answer">${body}</div></details>\n`,
  )
}

/** 「學習目標」「動手練習」段落包成卡片，與正文區隔 */
export function wrapSections(html: string): string {
  const wrap = (id: string, cls: string) =>
    html.replace(
      new RegExp(`(<h2 id="${id}">[\\s\\S]*?)(?=<h2 |<hr|$)`),
      (m: string) => `<section class="${cls}">${m}</section>\n`,
    )
  html = wrap('學習目標', 'sec-objectives')
  html = wrap('動手練習', 'sec-practice')
  return html
}
