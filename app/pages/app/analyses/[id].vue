<script setup lang="ts">
import type { SavedAnalysis } from '#shared/types/analysis'

definePageMeta({ layout: 'dashboard' })
const route = useRoute()
const { data: analysis, error, status, refresh } = await useFetch<SavedAnalysis>(() => '/api/analyses/' + route.params.id)
useSeoMeta({ title: () => analysis.value?.title ?? 'Raport' })
</script>

<template>
  <div class="stack">
    <p v-if="status === 'pending'" role="status">Wczytywanie raportu…</p>
    <template v-else-if="error">
      <h1>{{ error.statusCode === 404 ? 'Nie znaleziono raportu' : 'Nie udało się wczytać raportu' }}</h1>
      <button v-if="error.statusCode !== 404" type="button" class="button secondary" @click="refresh()">Spróbuj ponownie</button>
      <NuxtLink to="/app/analyses">Wróć do historii</NuxtLink>
    </template>
    <template v-else-if="analysis">
      <div class="split">
        <h1 class="report-title">{{ analysis.title }}</h1>
        <div class="actions">
          <NuxtLink class="button primary" :to="{ path: '/app/new', query: { source: analysis.id } }">Użyj ponownie</NuxtLink>
          <ReportActions :id="analysis.id" :title="analysis.title" @removed="navigateTo('/app/analyses')" />
        </div>
      </div>
      <time :datetime="analysis.createdAt">{{ formatReportDate(analysis.createdAt) }}</time>
      <section class="card stack results">
        <h2>Oryginalny HTML</h2>
        <pre><code>{{ analysis.originalHtml }}</code></pre>
      </section>
      <AnalysisResults :issues="analysis.issues" @reset="navigateTo('/app/new')" />
      <section class="card stack results">
        <h2>Sugestie AI</h2>
        <p>Brak sugestii dla tego raportu.</p>
      </section>
    </template>
  </div>
</template>
