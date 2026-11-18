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
  '17': 'mdi-memory',
  '18': 'mdi-account-group',
  '19': 'mdi-draw',
}

export function chapterIcon(slug: string): string {
  return ICONS[slug.slice(0, 2)] ?? 'mdi-book-alphabet'
}

export function chapterLabel(order: number | null): string {
  return order == null ? '附錄' : String(order).padStart(2, '0')
}
