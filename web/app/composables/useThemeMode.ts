import { useTheme } from 'vuetify'

type Mode = 'system' | 'light' | 'dark'
const KEY = 'swe-mindset:theme'
const ORDER: Mode[] = ['system', 'light', 'dark']
const ICON: Record<Mode, string> = {
  system: 'mdi-theme-light-dark',
  light: 'mdi-white-balance-sunny',
  dark: 'mdi-weather-night',
}
const LABEL: Record<Mode, string> = { system: '跟隨系統', light: '淺色', dark: '深色' }

export function useThemeMode() {
  const theme = useTheme()
  const mode = useState<Mode>('theme-mode', () => 'system')

  const apply = (m: Mode) => {
    mode.value = m
    theme.change(m)
  }

  onMounted(() => {
    try {
      const saved = localStorage.getItem(KEY) as Mode | null
      apply(saved && ORDER.includes(saved) ? saved : 'system')
    } catch {
      apply('system')
    }
  })

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(mode.value) + 1) % ORDER.length]
    apply(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
  }

  return {
    mode,
    cycle,
    icon: computed(() => ICON[mode.value]),
    label: computed(() => LABEL[mode.value]),
  }
}
