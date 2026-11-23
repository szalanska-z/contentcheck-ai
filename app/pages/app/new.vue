<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Nowa analiza' })

const route = useRoute()
const analyses = useDemoAnalyses()
const html = ref(analyses.value.find(analysis => analysis.id === route.query.source)?.originalHtml ?? '')
const error = ref('')
const showResults = ref(false)
const results = useTemplateRef<HTMLElement>('results')

watch(html, () => {
  error.value = ''
  showResults.value = false
})

async function analyze() {
  if (!html.value.trim()) {
    error.value = 'Wklej HTML lub wstaw przykład.'
    return
  }
  if (html.value !== demoAnalysis.originalHtml) {
    error.value = 'Wstaw wbudowany przykład, aby zobaczyć jego raport demonstracyjny.'
    return
  }
  showResults.value = true
  await nextTick()
  results.value?.focus()
}
</script>

<template>
  <div class="stack">
    <h1>Nowa analiza</h1>
    <p>Wypróbuj edytor. Wstaw przykład, aby obejrzeć przygotowane wyniki.</p>
    <HtmlEditor v-model="html" :error="error" @analyze="analyze" />
    <div v-if="showResults" ref="results" tabindex="-1">
      <AnalysisResults :issues="demoAnalysis.issues" @reset="html = ''" />
    </div>
  </div>
</template>
