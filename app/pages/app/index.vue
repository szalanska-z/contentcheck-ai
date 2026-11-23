<script setup lang="ts">
import { FileText, ScanLine, Sparkles } from '@lucide/vue'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Panel' })

const analyses = useDemoAnalyses()
const stats = computed(() => [
  { label: 'Analizy', value: analyses.value.length, icon: FileText },
  { label: 'Wykryte problemy', value: analyses.value.reduce((sum, analysis) => sum + analysis.issues.length, 0), icon: ScanLine },
  { label: 'Analizy z sugestiami AI', value: 0, icon: Sparkles },
])
</script>

<template>
  <div class="stack">
    <div class="split">
      <h1>Witaj ponownie, Ola!</h1>
      <NuxtLink to="/app/new" class="button primary">Nowa analiza</NuxtLink>
    </div>
    <div class="grid-three stats">
      <article v-for="stat in stats" :key="stat.label" class="card tile">
        <span class="tile-icon"><component :is="stat.icon" :size="21" /></span>
        <h2>{{ stat.label }}</h2><strong>{{ stat.value }}</strong>
      </article>
    </div>
    <h2>Ostatnie analizy</h2>
    <AnalysisHistoryList :analyses="analyses.slice(0, 5)" />
  </div>
</template>
