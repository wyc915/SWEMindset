import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Chapter, ChapterMeta, ContentRepository, HomeContent, SearchEntry } from '#shared/types/content'
import { renderMarkdown, slugify, stripLevels, toPlainText } from './markdown'

interface RawDoc {
  slug: string
  order: number | null
  src: string
}

/** 以 docs/*.md 為資料來源的實作 */
export class MarkdownContentRepository implements ContentRepository {
  constructor(
    private docsDir: string,
    private baseURL: string,
  ) {}

  private async loadDocs(): Promise<RawDoc[]> {
    const files = (await readdir(this.docsDir)).filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
    const docs = await Promise.all(
      files.map(async (f) => {
        const slug = f.replace(/\.md$/, '')
        const m = slug.match(/^(\d+)-/)
        return { slug, order: m ? Number(m[1]) : null, src: await readFile(join(this.docsDir, f), 'utf8') }
      }),
    )
    // 有序號的章節在前，附錄（如名詞速查）在後
    return docs.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.slug.localeCompare(b.slug))
  }

  private toMeta(d: RawDoc): ChapterMeta {
    const title = (d.src.match(/^#\s+(.+)$/m)?.[1] ?? d.slug).replace(/^\d+\.\s*/, '').trim()
    const quote = d.src.match(/^>\s*(.+)$/m)?.[1] ?? ''
    const summary = toPlainText(quote.replace(/^\*\*一句話\*\*[：:]\s*/, ''))
    return { slug: d.slug, order: d.order, title: stripLevels(title), summary }
  }

  async listChapters(): Promise<ChapterMeta[]> {
    return (await this.loadDocs()).map((d) => this.toMeta(d))
  }

  async getChapter(slug: string): Promise<Chapter | null> {
    const docs = await this.loadDocs()
    const idx = docs.findIndex((d) => d.slug === slug)
    if (idx < 0) return null
    const doc = docs[idx]
    const { html, toc } = renderMarkdown(doc.src, { baseURL: this.baseURL, dropTitle: true })
    return {
      ...this.toMeta(doc),
      html,
      toc,
      prev: idx > 0 ? this.toMeta(docs[idx - 1]) : null,
      next: idx < docs.length - 1 ? this.toMeta(docs[idx + 1]) : null,
    }
  }

  async getSearchIndex(): Promise<SearchEntry[]> {
    const entries: SearchEntry[] = []
    for (const d of await this.loadDocs()) {
      const meta = this.toMeta(d)
      // 依 h2 切段
      const parts = d.src.split(/^(?=##\s)/m)
      const used = new Map<string, number>()
      for (const part of parts) {
        const h = part.match(/^##\s+(.+)$/m)
        const heading = h ? stripLevels(h[1]) : meta.title
        let anchor = ''
        if (h) {
          anchor = slugify(h[1]) || 'section'
          const n = used.get(anchor) ?? 0
          used.set(anchor, n + 1)
          if (n) anchor = `${anchor}-${n}`
        }
        const text = toPlainText(part.replace(/^#{1,2}\s+.+$/gm, ''))
        if (text) entries.push({ slug: d.slug, chapterTitle: meta.title, heading, anchor, text })
      }
    }
    return entries
  }

  async getHome(): Promise<HomeContent> {
    const src = await readFile(join(this.docsDir, 'README.md'), 'utf8')
    const section = src.match(/^##\s+學習路線[\s\S]*?(?=^##\s|$(?![\s\S]))/m)?.[0] ?? ''
    const { html } = renderMarkdown(section.replace(/^##\s+.+$/m, ''), { baseURL: this.baseURL })
    return { learningPathHtml: html }
  }
}
