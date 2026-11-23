/** 章節對應的 Material Design Icons */
const ICONS: Record<string, string> = {
  '01': 'mdi-chip',
  '02': 'mdi-code-braces',
  '03': 'mdi-source-branch',
  '04': 'mdi-monitor-cellphone',
  '05': 'mdi-api',
  '06': 'mdi-database',
  '07': 'mdi-lightning-bolt',
  '08': 'mdi-email-fast',
  '09': 'mdi-sitemap',
  '10': 'mdi-server-network',
  '11': 'mdi-speedometer',
  '12': 'mdi-shield-lock',
  '13': 'mdi-docker',
  '14': 'mdi-rocket-launch',
  '15': 'mdi-chart-line',
  '16': 'mdi-robot',
  '17': 'mdi-draw',
  '18': 'mdi-account-group',
  '19': 'mdi-memory',
  '20': 'mdi-language-c',
  '21': 'mdi-integrated-circuit-chip',
  '22': 'mdi-timer-cog-outline',
  '23': 'mdi-bug-check',
  '24': 'mdi-linux',
  '25': 'mdi-server',
}

export function chapterIcon(slug: string): string {
  return ICONS[slug.slice(0, 2)] ?? 'mdi-book-alphabet'
}

export function chapterLabel(order: number | null): string {
  return order == null ? '附錄' : String(order).padStart(2, '0')
}

export type Track = 'software' | 'firmware' | 'appendix'

/** 章節所屬學習軌：01–18 軟體、19 起韌體、無序號為附錄 */
export function chapterTrack(order: number | null): Track {
  if (order == null) return 'appendix'
  return order >= 19 ? 'firmware' : 'software'
}

export const TRACK_LABEL: Record<Track, string> = {
  software: '軟體工程軌',
  firmware: '韌體工程軌',
  appendix: '附錄',
}
