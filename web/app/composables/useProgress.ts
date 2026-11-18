const KEY = 'swe-mindset:read'

/** 閱讀進度（目前存於瀏覽器 localStorage，之後可改存資料庫） */
export function useProgress() {
  const read = useState<string[]>('read-chapters', () => [])
  const loaded = useState('read-loaded', () => false)

  if (import.meta.client && !loaded.value) {
    loaded.value = true
    try {
      read.value = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    } catch {
      read.value = []
    }
  }

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(read.value))
    } catch {
      /* 無痕模式等情況忽略 */
    }
  }

  const isRead = (slug: string) => read.value.includes(slug)
  const toggle = (slug: string) => {
    read.value = isRead(slug) ? read.value.filter((s) => s !== slug) : [...read.value, slug]
    save()
  }

  return { read, isRead, toggle }
}
