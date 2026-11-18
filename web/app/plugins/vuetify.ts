import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

// Material 3 基準色票（Android Material You baseline）
const light = {
  dark: false,
  colors: {
    background: '#FEF7FF',
    surface: '#FEF7FF',
    'surface-bright': '#FEF7FF',
    'surface-container-low': '#F7F2FA',
    'surface-container': '#F3EDF7',
    'surface-container-high': '#ECE6F0',
    'surface-container-highest': '#E6E0E9',
    'surface-variant': '#E7E0EC',
    'on-surface': '#1D1B20',
    'on-surface-variant': '#49454F',
    primary: '#6750A4',
    'on-primary': '#FFFFFF',
    'primary-container': '#EADDFF',
    'on-primary-container': '#21005D',
    secondary: '#625B71',
    'secondary-container': '#E8DEF8',
    'on-secondary-container': '#1D192B',
    tertiary: '#7D5260',
    'tertiary-container': '#FFD8E4',
    'on-tertiary-container': '#31111D',
    outline: '#79747E',
    'outline-variant': '#CAC4D0',
    error: '#B3261E',
    success: '#386A20',
    warning: '#7C5800',
    info: '#00639B',
  },
}

const dark = {
  dark: true,
  colors: {
    background: '#141218',
    surface: '#141218',
    'surface-bright': '#3B383E',
    'surface-container-low': '#1D1B20',
    'surface-container': '#211F26',
    'surface-container-high': '#2B2930',
    'surface-container-highest': '#36343B',
    'surface-variant': '#49454F',
    'on-surface': '#E6E0E9',
    'on-surface-variant': '#CAC4D0',
    primary: '#D0BCFF',
    'on-primary': '#381E72',
    'primary-container': '#4F378B',
    'on-primary-container': '#EADDFF',
    secondary: '#CCC2DC',
    'secondary-container': '#4A4458',
    'on-secondary-container': '#E8DEF8',
    tertiary: '#EFB8C8',
    'tertiary-container': '#633B48',
    'on-tertiary-container': '#FFD8E4',
    outline: '#938F99',
    'outline-variant': '#49454F',
    error: '#F2B8B5',
    success: '#9CD67D',
    warning: '#F9BC3C',
    info: '#94CCFF',
  },
}

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    blueprint: md3,
    theme: {
      // SSR 一律輸出淺色，載入後再依使用者設定或系統切換，避免水合不一致
      defaultTheme: 'light',
      themes: { light, dark },
    },
  })
  nuxtApp.vueApp.use(vuetify)
})
