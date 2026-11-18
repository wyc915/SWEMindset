import { useContentRepository } from '../../content'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const chapter = await useContentRepository().getChapter(slug)
  if (!chapter) throw createError({ statusCode: 404, statusMessage: '找不到章節' })
  return chapter
})
