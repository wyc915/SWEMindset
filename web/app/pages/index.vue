<script setup lang="ts">
import type { ChapterMeta, HomeContent } from '#shared/types/content'

const { data: chapters } = await useFetch<ChapterMeta[]>('/api/chapters', { key: 'chapters' })
const { data: home } = await useFetch<HomeContent>('/api/home', { key: 'home' })
const { isRead, read } = useProgress()
const onContentClick = useInternalLinks()

const total = computed(() => chapters.value?.length ?? 0)
const done = computed(() => chapters.value?.filter((c) => read.value.includes(c.slug)).length ?? 0)
const nextUp = computed(() => chapters.value?.find((c) => !isRead(c.slug)))

useHead({ title: 'SWE Mindset｜軟體工程師必備常識' })
</script>

<template>
  <v-container class="page py-6">
    <v-card color="primary-container" rounded="xl" class="hero pa-6 pa-md-8 mb-6" flat>
      <div class="text-overline text-on-primary-container opacity-80">Software Engineer Knowledge Base</div>
      <h1 class="hero-title text-on-primary-container">軟體工程師必備常識</h1>
      <p class="text-body-large text-on-primary-container opacity-90 mt-2 mb-6">
        不教語法、不談演算法，只講每個技術在解決什麼問題、何時用、面試會問什麼。
      </p>
      <div class="d-flex flex-wrap align-center ga-4">
        <v-btn
          v-if="nextUp"
          :to="`/chapters/${nextUp.slug}`"
          size="large"
          prepend-icon="mdi-play"
          color="primary"
          variant="flat"
        >
          {{ done ? '繼續閱讀' : '開始閱讀' }}
        </v-btn>
        <div class="progress-wrap flex-grow-1">
          <div class="d-flex justify-space-between text-body-medium text-on-primary-container mb-1">
            <span>閱讀進度</span><span>{{ done }} / {{ total }}</span>
          </div>
          <v-progress-linear :model-value="total ? (done / total) * 100 : 0" color="primary" bg-color="surface" :bg-opacity="0.7" rounded height="8" />
        </div>
      </div>
    </v-card>

    <div class="d-flex flex-wrap ga-2 mb-6">
      <v-chip prepend-icon="mdi-circle" class="chip-basic" variant="tonal">基礎：入門必懂</v-chip>
      <v-chip prepend-icon="mdi-circle" class="chip-mid" variant="tonal">進階：能獨立負責</v-chip>
      <v-chip prepend-icon="mdi-circle" class="chip-adv" variant="tonal">高階：架構決策</v-chip>
    </div>

    <h2 class="section-title">章節</h2>
    <v-row dense class="mb-8">
      <v-col v-for="c in chapters" :key="c.slug" cols="12" sm="6" lg="4">
        <v-card :to="`/chapters/${c.slug}`" color="surface-container" rounded="xl" class="chapter-card h-100" flat>
          <v-card-item>
            <template #prepend>
              <v-avatar color="secondary-container" rounded="lg" size="44">
                <v-icon :icon="chapterIcon(c.slug)" color="on-secondary-container" />
              </v-avatar>
            </template>
            <v-card-subtitle class="pb-0">{{ c.order == null ? '附錄' : `第 ${chapterLabel(c.order)} 章` }}</v-card-subtitle>
            <v-card-title class="text-wrap">{{ c.title }}</v-card-title>
            <template #append>
              <v-icon v-if="isRead(c.slug)" icon="mdi-check-circle" color="success" />
            </template>
          </v-card-item>
          <v-card-text class="text-medium-emphasis line-clamp-3">{{ c.summary }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <h2 class="section-title">學習路線</h2>
    <v-card color="surface-container-low" rounded="xl" flat class="pa-4 pa-md-6">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="md-content" @click="onContentClick" v-html="home?.learningPathHtml" />
    </v-card>
  </v-container>
</template>
