<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const analyses = useDemoAnalyses()
const analysis = analyses.value.find(item => item.id === route.params.id)
if (!analysis) {
  throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono raportu' })
}
useSeoMeta({ title: analysis.title })
</script>

<template>
  <div class="stack">
    <div class="split">
      <h1>{{ analysis.title }}</h1>
      <NuxtLink class="button primary" :to="{ path: '/app/new', query: { source: analysis.id } }">Użyj ponownie</NuxtLink>
    </div>
    <time :datetime="analysis.createdAt">{{ analysis.createdAt }}</time>
    <section class="card stack results">
      <h2>Oryginalny HTML</h2>
      <pre><code>{{ analysis.originalHtml }}</code></pre>
    </section>
    <AnalysisResults :issues="analysis.issues" @reset="navigateTo('/app/new')" />
  </div>
</template>
