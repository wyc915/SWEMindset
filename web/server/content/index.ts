import type { ContentRepository } from '#shared/types/content'
import { MarkdownContentRepository } from './markdownRepository'

let repo: ContentRepository | undefined

/**
 * 取得內容來源。
 * 之後改接 PostgreSQL：新增 PostgresContentRepository 並在此依 contentSource 切換。
 */
export function useContentRepository(): ContentRepository {
  if (repo) return repo
  const config = useRuntimeConfig()
  switch (config.contentSource) {
    case 'markdown':
    default:
      repo = new MarkdownContentRepository(config.docsDir, config.app.baseURL)
  }
  return repo
}
