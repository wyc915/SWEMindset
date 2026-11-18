<script setup lang="ts">
import { useDisplay } from 'vuetify'
import type { ChapterMeta } from '#shared/types/content'

const { data: chapters } = await useFetch<ChapterMeta[]>('/api/chapters', { key: 'chapters' })
const { mdAndUp, md } = useDisplay()
const route = useRoute()
const { isRead, read } = useProgress()
const themeMode = useThemeMode()

const drawer = ref(false)
const searchOpen = ref(false)

// 平板（md）使用 Navigation Rail，桌機常駐抽屜，手機為暫時抽屜
const rail = computed(() => md.value)
watch(() => route.fullPath, () => {
  if (!mdAndUp.value) drawer.value = false
})

const title = computed(() => {
  const c = chapters.value?.find((x) => route.path === `/chapters/${x.slug}`)
  return c ? c.title : 'SWE Mindset'
})

const readCount = computed(() => chapters.value?.filter((c) => read.value.includes(c.slug)).length ?? 0)

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      searchOpen.value = true
    }
  })
})
</script>

<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :permanent="mdAndUp"
      :rail="rail"
      :expand-on-hover="rail"
      color="surface-container-low"
      border="0"
      width="300"
    >
      <div class="drawer-header px-4 pt-4 pb-2 d-flex align-center ga-3">
        <v-avatar color="primary-container" size="40" rounded="lg">
          <v-icon icon="mdi-book-open-page-variant" color="on-primary-container" />
        </v-avatar>
        <div class="drawer-brand">
          <div class="text-title-medium font-weight-bold">SWE Mindset</div>
          <div class="text-caption text-medium-emphasis">已讀 {{ readCount }} / {{ chapters?.length ?? 0 }}</div>
        </div>
      </div>

      <v-list nav density="comfortable" class="nav-list px-2">
        <v-list-item to="/" exact prepend-icon="mdi-home-variant" title="首頁" rounded="pill" />
        <v-divider class="my-2" />
        <v-list-item
          v-for="c in chapters"
          :key="c.slug"
          :to="`/chapters/${c.slug}`"
          :prepend-icon="chapterIcon(c.slug)"
          rounded="pill"
          :title="c.title"
        >
          <template #append>
            <span class="d-flex align-center ga-1">
              <v-icon v-if="isRead(c.slug)" icon="mdi-check-circle" size="16" color="success" />
              <span class="text-caption text-medium-emphasis">{{ chapterLabel(c.order) }}</span>
            </span>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar color="surface" flat scroll-behavior="elevate" scroll-threshold="8">
      <template #prepend>
        <v-app-bar-nav-icon v-if="!mdAndUp" @click="drawer = !drawer" />
      </template>
      <v-app-bar-title class="text-truncate">{{ title }}</v-app-bar-title>
      <template #append>
        <v-btn icon="mdi-magnify" aria-label="搜尋" @click="searchOpen = true" />
        <v-btn :icon="themeMode.icon.value" :aria-label="`主題：${themeMode.label.value}`" @click="themeMode.cycle">
          <v-icon :icon="themeMode.icon.value" />
          <v-tooltip activator="parent" location="bottom">主題：{{ themeMode.label.value }}</v-tooltip>
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>

    <SearchDialog v-model="searchOpen" />
  </v-app>
</template>
