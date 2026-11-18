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

  md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n'
  md.renderer.rules.table_close = () => '</table></div>\n'

  let html = md.renderer.render(tokens, md.options, {})
  // 難度符號轉為 Material 標籤
  html = html.replace(LEVEL_RE, (e) => {
    const l = LEVELS[e]
    return `<span class="lvl lvl-${l.cls}">${l.label}</span>`
  })
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
