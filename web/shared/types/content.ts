/** 章節基本資訊（列表、導覽用） */
export interface ChapterMeta {
  slug: string
  /** 章節序號；名詞速查等附錄為 null */
  order: number | null
  title: string
  summary: string
}

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

/** 單一章節完整內容 */
export interface Chapter extends ChapterMeta {
  html: string
  toc: TocItem[]
  prev: ChapterMeta | null
  next: ChapterMeta | null
}

/** 全站搜尋索引：以 h2 段落為單位 */
export interface SearchEntry {
  slug: string
  chapterTitle: string
  heading: string
  anchor: string
  text: string
}

export interface HomeContent {
  learningPathHtml: string
}

/**
 * 內容來源介面。
 * 畫面只依賴這個介面，目前由 Markdown 實作；
 * 之後改接 PostgreSQL 時新增另一個實作即可，前端不需修改。
 */
export interface ContentRepository {
  listChapters(): Promise<ChapterMeta[]>
  getChapter(slug: string): Promise<Chapter | null>
  getSearchIndex(): Promise<SearchEntry[]>
  getHome(): Promise<HomeContent>
}
