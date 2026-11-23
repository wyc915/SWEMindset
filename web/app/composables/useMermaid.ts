import { useTheme } from 'vuetify'

type Mermaid = (typeof import('mermaid'))['default']
let loader: Promise<Mermaid> | null = null
const loadMermaid = () => (loader ||= import('mermaid').then((m) => m.default))

const FONT = 'Roboto, "Noto Sans TC", system-ui, sans-serif'

// 依 Material 3 色票設定流程圖配色
const LIGHT = {
  background: '#FEF7FF',
  primaryColor: '#EADDFF',
  primaryTextColor: '#21005D',
  primaryBorderColor: '#6750A4',
  secondaryColor: '#E8DEF8',
  tertiaryColor: '#FFD8E4',
  lineColor: '#79747E',
  textColor: '#1D1B20',
  noteBkgColor: '#FFD8E4',
  noteTextColor: '#31111D',
  noteBorderColor: '#7D5260',
  edgeLabelBackground: '#F7F2FA',
  clusterBkg: '#F3EDF7',
  clusterBorder: '#CAC4D0',
}
const DARK = {
  darkMode: true,
  background: '#141218',
  primaryColor: '#4F378B',
  primaryTextColor: '#EADDFF',
  primaryBorderColor: '#D0BCFF',
  secondaryColor: '#4A4458',
  tertiaryColor: '#633B48',
  lineColor: '#938F99',
  textColor: '#E6E0E9',
  noteBkgColor: '#633B48',
  noteTextColor: '#FFD8E4',
  noteBorderColor: '#EFB8C8',
  edgeLabelBackground: '#211F26',
  clusterBkg: '#1D1B20',
  clusterBorder: '#49454F',
}

/** 把內容中的 .mermaid-diagram 渲染成 SVG，主題切換時重新渲染 */
export function useMermaid(rootSelector = '.md-content') {
  const theme = useTheme()
  let seq = 0

  async function render() {
    if (import.meta.server) return
    const els = document.querySelectorAll<HTMLElement>(`${rootSelector} .mermaid-diagram`)
    if (!els.length) return
    const mermaid = await loadMermaid()
    const dark = theme.global.current.value.dark
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: FONT,
      themeVariables: { ...(dark ? DARK : LIGHT), fontFamily: FONT },
    })
    for (const el of els) {
      const id = `mmd-${Date.now()}-${++seq}`
      try {
        const { svg } = await mermaid.render(id, el.dataset.src ?? '')
        el.innerHTML = svg
        el.classList.add('is-rendered')
        // 圖太寬時不要無限縮小：至少保留原尺寸 65%，改為框內左右滑動
        const svgEl = el.querySelector('svg')
        const natural = svgEl?.viewBox.baseVal.width ?? 0
        const avail = el.clientWidth - 32
        if (svgEl && natural * 0.65 > avail) {
          svgEl.style.maxWidth = 'none'
          svgEl.style.width = `${Math.round(natural * 0.65)}px`
          el.classList.add('is-scrollable')
        } else {
          el.classList.remove('is-scrollable')
        }
      } catch (e) {
        document.getElementById(`d${id}`)?.remove()
        console.warn('[mermaid] 渲染失敗', e)
      }
    }
  }

  onMounted(() => nextTick(render))
  watch(
    () => theme.global.name.value,
    () => nextTick(render),
  )
  return { render }
}
