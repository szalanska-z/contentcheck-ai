<script setup lang="ts">
import { titleLimit } from '#shared/schemas/analysis'
import type { AnalysisPage } from '#shared/types/analysis'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Historia analiz' })

const search = ref('')
const q = ref('')
const page = ref(1)
const { data, status, error, refresh } = await useFetch<AnalysisPage>('/api/analyses', { query: { q, page } })
const pageCount = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / (data.value?.limit ?? 10))))

function searchReports() {
  q.value = search.value.trim()
  page.value = 1
}

function updateList() {
  if (data.value?.items.length === 1 && page.value > 1) page.value--
  else void refresh()
}
</script>

<template>
  <div class="stack">
    <h1>Historia analiz</h1>
    <form class="actions" role="search" @submit.prevent="searchReports">
      <label class="search">Szukaj po tytule<input v-model="search" :maxlength="titleLimit" type="search"></label>
      <button type="submit" class="button secondary">Szukaj</button>
    </form>
    <p v-if="status === 'pending'" role="status">Wczytywanie raportów…</p>
    <div v-else-if="error" role="alert">
      <p>Nie udało się wczytać raportów.</p>
      <button type="button" class="button secondary" @click="refresh()">Spróbuj ponownie</button>
    </div>
    <template v-else-if="data">
      <AnalysisHistoryList :analyses="data.items" editable @renamed="refresh()" @removed="updateList" />
      <nav v-if="pageCount > 1 || page > 1" class="split" aria-label="Strony historii">
        <button type="button" class="button secondary" :disabled="page === 1" @click="page--">Poprzednia</button>
        <p>Strona {{ page }} z {{ pageCount }}</p>
        <button type="button" class="button secondary" :disabled="page >= pageCount" @click="page++">Następna</button>
      </nav>
    </template>
  </div>
</template>
