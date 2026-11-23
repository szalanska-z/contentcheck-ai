<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Historia analiz' })

const analyses = useDemoAnalyses()
const query = ref('')
const filtered = computed(() => analyses.value.filter(analysis => analysis.title.toLocaleLowerCase('pl').includes(query.value.trim().toLocaleLowerCase('pl'))))
</script>

<template>
  <div class="stack">
    <h1>Historia analiz</h1>
    <label class="search">Szukaj po tytule<input v-model="query" type="search"></label>
    <AnalysisHistoryList :analyses="filtered" />
  </div>
</template>
