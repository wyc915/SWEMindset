/** 讓 v-html 內的站內連結走前端路由，不整頁重新載入 */
export function useInternalLinks() {
  const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '')
  return (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
    const a = (e.target as HTMLElement).closest('a[data-internal]') as HTMLAnchorElement | null
    if (!a) return
    e.preventDefault()
    const href = a.getAttribute('href') ?? '/'
    navigateTo(href.startsWith(base) ? href.slice(base.length) || '/' : href)
  }
}
