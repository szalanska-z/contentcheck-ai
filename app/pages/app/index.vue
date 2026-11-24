<script setup lang="ts">
import { FileText, ScanLine, Sparkles } from '@lucide/vue'
import type { DashboardData } from '#shared/types/analysis'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Panel' })

const account = useAccount()
const { data, status, error, refresh } = await useFetch<DashboardData>('/api/dashboard')
const stats = computed(() => data.value && [
  { label: 'Analizy', value: data.value.total, icon: FileText },
  { label: 'Wykryte problemy', value: data.value.issueCount, icon: ScanLine },
  { label: 'Analizy z sugestiami', value: data.value.withSuggestions, icon: Sparkles },
])
</script>

<template>
  <div class="stack">
    <div class="split">
      <h1>Witaj ponownie, {{ account?.name }}!</h1>
      <NuxtLink to="/app/new" class="button primary">Nowa analiza</NuxtLink>
    </div>
    <p v-if="status === 'pending'" role="status">Wczytywanie panelu…</p>
    <div v-else-if="error" role="alert">
      <p>Nie udało się wczytać panelu.</p>
      <button type="button" class="button secondary" @click="refresh()">Spróbuj ponownie</button>
    </div>
    <template v-else-if="data">
      <div class="grid-three stats">
        <article v-for="stat in stats" :key="stat.label" class="card tile">
          <span class="tile-icon"><component :is="stat.icon" :size="21" /></span>
          <h2>{{ stat.label }}</h2><strong>{{ stat.value }}</strong>
        </article>
      </div>
      <h2>Ostatnie analizy</h2>
      <AnalysisHistoryList v-if="data.recent.length" :analyses="data.recent" />
      <p v-else>Utwórz pierwszą analizę, aby zobaczyć raport w tym miejscu.</p>
    </template>
  </div>
</template>
