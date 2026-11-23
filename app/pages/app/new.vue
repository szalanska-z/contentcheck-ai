<script setup lang="ts">
import { htmlLimit, reportId, reportTitle, titleLimit } from '#shared/schemas/analysis'
import type { Issue, SavedAnalysis } from '#shared/types/analysis'
import { analyzeHtml } from '#shared/utils/analyzeHtml'

definePageMeta({ layout: 'dashboard', key: route => typeof route.query.source === 'string' ? route.query.source : 'new' })
useSeoMeta({ title: 'Nowa analiza' })

const route = useRoute()
const source = reportId.safeParse(route.query.source)
const sourceId = source.success ? source.data : undefined
const request = useRequestFetch()
const { data: reused, error: sourceError } = await useAsyncData('report-source-' + (sourceId ?? 'new'), async () => ({
  report: sourceId ? await request<SavedAnalysis>('/api/analyses/' + sourceId) : null,
}))
const html = ref(reused.value?.report?.originalHtml ?? '')
const title = ref('')
const error = ref('')
const saveError = ref('')
const pending = ref(false)
const issues = ref<Issue[] | null>(null)
const results = useTemplateRef<HTMLElement>('results')

watch(html, () => {
  error.value = ''
  saveError.value = ''
  issues.value = null
})

async function analyze() {
  if (!html.value.trim()) {
    error.value = 'Wklej HTML lub wstaw przykład.'
    return
  }
  if (html.value.length > htmlLimit) {
    error.value = 'HTML przekracza limit 10 000 znaków.'
    return
  }
  error.value = ''
  issues.value = analyzeHtml(html.value)
  await nextTick()
  results.value?.focus()
}

async function save() {
  if (pending.value || !issues.value) return
  const parsedTitle = reportTitle.safeParse(title.value)
  if (!parsedTitle.success) {
    saveError.value = 'Podaj nazwę raportu (maksymalnie 120 znaków).'
    return
  }
  pending.value = true
  saveError.value = ''
  try {
    const report = await $fetch('/api/analyses', {
      method: 'POST',
      body: {
        title: parsedTitle.data,
        originalHtml: html.value,
        sourceAnalysisId: reused.value?.report?.id,
      },
    })
    await navigateTo('/app/analyses/' + report.id)
  } catch {
    saveError.value = 'Nie udało się zapisać raportu. Sprawdź dane i spróbuj ponownie.'
  } finally {
    pending.value = false
  }
}

function reset() {
  if (route.query.source) return navigateTo('/app/new')
  html.value = ''
  title.value = ''
}
</script>

<template>
  <div class="stack">
    <h1>Nowa analiza</h1>
    <p>Wklej własny HTML lub wstaw przykład, aby sprawdzić nagłówki, linki i obrazy.</p>
    <p v-if="sourceError || (route.query.source && !source.success)" class="error" role="alert">Nie udało się wczytać kodu z poprzedniego raportu. Możesz wkleić HTML ręcznie.</p>
    <HtmlEditor v-model="html" :error="error" @analyze="analyze" />
    <div v-if="issues" ref="results" class="stack" tabindex="-1">
      <AnalysisResults :issues="issues" @reset="reset" />
      <form class="card editor stack" @submit.prevent="save">
        <label>Nazwa raportu<input v-model="title" required :maxlength="titleLimit" placeholder="Np. Artykuł do publikacji"></label>
        <p v-if="saveError" class="error" role="alert">{{ saveError }}</p>
        <div><button type="submit" class="button primary" :disabled="pending">{{ pending ? 'Zapisywanie…' : 'Zapisz raport' }}</button></div>
      </form>
    </div>
  </div>
</template>
