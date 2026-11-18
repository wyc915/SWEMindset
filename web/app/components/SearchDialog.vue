<script setup lang="ts">
import type { SearchEntry } from '#shared/types/content'

const open = defineModel<boolean>({ default: false })
const query = ref('')
const index = ref<SearchEntry[] | null>(null)
const loading = ref(false)
const config = useRuntimeConfig()

watch(open, async (v) => {
  if (!v || index.value) return
  loading.value = true
  try {
    index.value = await $fetch<SearchEntry[]>('/api/search-index.json', { baseURL: config.app.baseURL })
  } finally {
    loading.value = false
  }
})

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q || !index.value) return []
  const terms = q.split(/\s+/)
  return index.value
    .map((e) => {
      const hay = `${e.heading} ${e.text}`.toLowerCase()
      if (!terms.every((t) => hay.includes(t))) return null
      const score = terms.reduce((s, t) => s + (e.heading.toLowerCase().includes(t) ? 10 : 0), 0)
      const pos = Math.max(0, hay.indexOf(terms[0]) - e.heading.length - 1)
      const start = Math.max(0, pos - 24)
      const snippet = (start > 0 ? '…' : '') + e.text.slice(start, start + 90) + '…'
      return { ...e, score, snippet }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
})

function go(r: SearchEntry) {
  open.value = false
  navigateTo({ path: `/chapters/${r.slug}`, hash: r.anchor ? `#${r.anchor}` : '' })
}
</script>

<template>
  <v-dialog v-model="open" max-width="680" :fullscreen="$vuetify.display.xs" scrollable>
    <v-card class="search-card" color="surface-container-high" rounded="xl">
      <div class="pa-4 pb-2 d-flex align-center ga-2">
        <v-text-field
          v-model="query"
          autofocus
          hide-details
          clearable
          rounded="pill"
          variant="solo-filled"
          flat
          bg-color="surface-container-highest"
          prepend-inner-icon="mdi-magnify"
          placeholder="搜尋觀念，例如：冪等、Kafka、CAP"
          :loading="loading"
        />
        <v-btn v-if="$vuetify.display.xs" icon="mdi-close" variant="text" color="on-surface" @click="open = false" />
      </div>
      <v-card-text class="pt-0">
        <div v-if="query && !loading && !results.length" class="text-medium-emphasis text-center py-8">
          找不到「{{ query }}」相關內容
        </div>
        <div v-else-if="!query" class="text-medium-emphasis text-center py-8">輸入關鍵字開始搜尋</div>
        <v-list v-else bg-color="transparent" lines="three" density="comfortable">
          <v-list-item
            v-for="r in results"
            :key="r.slug + r.anchor"
            rounded="lg"
            class="mb-1"
            @click="go(r)"
          >
            <v-list-item-title class="font-weight-medium">{{ r.heading }}</v-list-item-title>
            <v-list-item-subtitle>
              <span class="text-primary">{{ r.chapterTitle }}</span> · {{ r.snippet }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
