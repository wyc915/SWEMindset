<script setup lang="ts">
import { useDisplay } from 'vuetify'
import type { Chapter } from '#shared/types/content'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const { data: chapter, error } = await useFetch<Chapter>(() => `/api/chapters/${slug.value}`, {
  key: `chapter-${slug.value}`,
})
if (error.value || !chapter.value) {
  throw createError({ statusCode: 404, statusMessage: '找不到章節', fatal: true })
}

const { lgAndUp } = useDisplay()
const { isRead, toggle } = useProgress()
const onContentClick = useInternalLinks()

useHead(() => ({
  title: `${chapter.value?.title}｜SWE Mindset`,
  meta: [{ name: 'description', content: chapter.value?.summary ?? '' }],
}))

// 目錄 scrollspy
const active = ref('')
let observer: IntersectionObserver | undefined
function observe() {
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) active.value = visible[0].target.id
    },
    { rootMargin: '-72px 0px -70% 0px' },
  )
  document.querySelectorAll('.md-content h2[id], .md-content h3[id]').forEach((el) => observer!.observe(el))
}
onMounted(() => nextTick(observe))
watch(chapter, () => nextTick(observe))
onBeforeUnmount(() => observer?.disconnect())

const tocH2 = computed(() => chapter.value?.toc.filter((t) => t.level === 2) ?? [])
</script>

<template>
  <v-container v-if="chapter" class="page py-6">
    <div class="chapter-layout">
      <article class="chapter-main">
        <header class="mb-6">
          <v-chip size="small" color="primary" variant="tonal" :prepend-icon="chapterIcon(chapter.slug)" class="mb-3">
            {{ chapter.order == null ? '附錄' : `第 ${chapterLabel(chapter.order)} 章` }}
          </v-chip>
          <h1 class="chapter-title">{{ chapter.title }}</h1>
        </header>

        <v-expansion-panels v-if="!lgAndUp && tocH2.length" class="mb-6" flat>
          <v-expansion-panel bg-color="surface-container" rounded="xl">
            <v-expansion-panel-title>
              <v-icon icon="mdi-format-list-bulleted" class="mr-3" />本頁目錄
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list density="compact" bg-color="transparent">
                <v-list-item v-for="t in tocH2" :key="t.id" :href="`#${t.id}`" rounded="pill" :title="t.text" />
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="md-content" @click="onContentClick" v-html="chapter.html" />

        <v-card color="surface-container" rounded="xl" flat class="pa-4 mt-10 d-flex align-center flex-wrap ga-3">
          <div class="flex-grow-1">
            <div class="text-title-medium font-weight-medium">{{ isRead(chapter.slug) ? '已完成本章 🎉' : '讀完了嗎？' }}</div>
            <div class="text-body-medium text-medium-emphasis">進度儲存在此瀏覽器</div>
          </div>
          <ClientOnly>
            <v-btn
              :variant="isRead(chapter.slug) ? 'tonal' : 'flat'"
              :prepend-icon="isRead(chapter.slug) ? 'mdi-check' : 'mdi-check-circle-outline'"
              @click="toggle(chapter.slug)"
            >
              {{ isRead(chapter.slug) ? '已讀' : '標記為已讀' }}
            </v-btn>
          </ClientOnly>
        </v-card>

        <v-row class="mt-4" dense>
          <v-col cols="12" sm="6">
            <v-card v-if="chapter.prev" :to="`/chapters/${chapter.prev.slug}`" variant="outlined" rounded="xl" class="nav-card pa-4">
              <div class="text-caption text-medium-emphasis"><v-icon icon="mdi-arrow-left" size="14" /> 上一章</div>
              <div class="text-title-medium">{{ chapter.prev.title }}</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6">
            <v-card v-if="chapter.next" :to="`/chapters/${chapter.next.slug}`" variant="outlined" rounded="xl" class="nav-card pa-4 text-right">
              <div class="text-caption text-medium-emphasis">下一章 <v-icon icon="mdi-arrow-right" size="14" /></div>
              <div class="text-title-medium">{{ chapter.next.title }}</div>
            </v-card>
          </v-col>
        </v-row>
      </article>

      <aside v-if="lgAndUp && tocH2.length" class="chapter-toc">
        <div class="toc-inner">
          <div class="text-label-large text-medium-emphasis px-4 mb-2">本頁目錄</div>
          <v-list density="compact" bg-color="transparent" nav>
            <v-list-item
              v-for="t in tocH2"
              :key="t.id"
              :href="`#${t.id}`"
              :active="active === t.id"
              color="primary"
              rounded="pill"
              :title="t.text"
            />
          </v-list>
        </div>
      </aside>
    </div>
  </v-container>
</template>
