import { useContentRepository } from '../content'

export default defineEventHandler(() => useContentRepository().getHome())
