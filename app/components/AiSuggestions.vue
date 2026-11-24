<script setup lang="ts">
import { Sparkles } from '@lucide/vue'
import type { SavedAnalysis, SuggestionResult } from '#shared/types/analysis'

const props = defineProps<{ report: SavedAnalysis }>()
const result = ref<SuggestionResult | null>(props.report.aiMode && props.report.aiSuggestions
  ? { aiSuggestions: props.report.aiSuggestions, aiMode: props.report.aiMode, aiModel: props.report.aiModel }
  : null)
const pending = ref(false)
const error = ref('')
const messages: Record<string, string> = {
  timeout: 'Generowanie trwało zbyt długo. Spróbuj ponownie.',
  'invalid-response': 'Model zwrócił niepoprawne dane. Spróbuj ponownie.',
  'provider-error': 'Usługa OpenAI jest chwilowo niedostępna.',
  'in-progress': 'Sugestie są już generowane dla tego raportu. Odśwież stronę za chwilę.',
  limit: 'Dzienny limit pięciu generowań został wykorzystany. Odnawia się o północy UTC.',
  configuration: 'Generowanie jest niedostępne w tym środowisku.',
  missing: 'Nie znaleziono raportu.',
}

async function generate() {
  if (pending.value || result.value) return
  pending.value = true
  error.value = ''
  try {
    result.value = await $fetch<SuggestionResult>(`/api/analyses/${props.report.id}/suggestions`, { method: 'POST', retry: 0 })
  } catch (cause) {
    const failure = cause as { statusCode?: number, data?: { data?: { reason?: string } } }
    error.value = failure.statusCode === 401
      ? 'Sesja wygasła. Zaloguj się ponownie.'
      : messages[failure.data?.data?.reason ?? ''] ?? 'Nie udało się wygenerować sugestii.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="card results stack" aria-labelledby="suggestions-title" :aria-busy="pending">
    <h2 id="suggestions-title">Sugestie językowe</h2>
    <template v-if="result">
      <p v-if="result.aiMode === 'demo'">Tryb demo</p>
      <p v-else-if="result.aiModel">Model OpenAI: {{ result.aiModel }}</p>
      <p v-if="!result.aiSuggestions.length" role="status">
        {{ result.aiMode === 'demo'
          ? 'Ten raport nie zawiera akapitu z przygotowaną sugestią. Utwórz nową analizę i kliknij „Wstaw przykład”, aby ją zobaczyć.'
          : 'Brak sugerowanych zmian dla wybranych fragmentów.' }}
      </p>
      <article v-for="suggestion in result.aiSuggestions" v-else :key="suggestion.sourceId" class="issue">
        <h3>Proponowana zmiana</h3>
        <p><strong>Przed:</strong> {{ suggestion.originalText }}</p>
        <p><strong>Po:</strong> {{ suggestion.suggestedText }}</p>
        <p>{{ suggestion.reason }}</p>
      </article>
      <div v-if="result.aiMode === 'demo' && !result.aiSuggestions.length">
        <NuxtLink to="/app/new" class="button secondary">Przejdź do nowej analizy</NuxtLink>
      </div>
    </template>
    <template v-else>
      <p v-if="report.generationMode === 'demo'">Tryb demo używa przygotowanego przykładu. Wstaw przykład w edytorze, aby zobaczyć sugestię.</p>
      <p v-else>Po kliknięciu wybrane fragmenty tekstu z zapisanego HTML zostaną przesłane do OpenAI w celu przygotowania sugestii.</p>
      <p v-if="pending" role="status">Generowanie sugestii…</p>
      <p v-else-if="error" class="error" role="alert">{{ error }}</p>
      <p v-else-if="report.aiStatus === 'error'">Poprzednia próba się nie powiodła. Możesz spróbować ponownie.</p>
      <div>
        <button type="button" class="button primary" :disabled="pending" @click="generate">
          <Sparkles :size="19" /> {{ pending ? 'Generowanie…' : report.generationMode === 'demo' ? 'Pokaż sugestie demo' : 'Wygeneruj sugestie AI' }}
        </button>
      </div>
    </template>
  </section>
</template>
