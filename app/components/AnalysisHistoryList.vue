<script setup lang="ts">
import type { DemoAnalysis } from '#shared/types/analysis'

defineProps<{ analyses: DemoAnalysis[] }>()
</script>

<template>
  <div class="card history">
    <p v-if="!analyses.length">Brak raportów do wyświetlenia.</p>
    <ul v-else>
      <li v-for="analysis in analyses" :key="analysis.id" class="split">
        <div>
          <strong>{{ analysis.title }}</strong>
          <p><time :datetime="analysis.createdAt">{{ analysis.createdAt }}</time> · Problemy: {{ analysis.issues.length }} · Bez sugestii AI</p>
        </div>
        <NuxtLink :to="{ path: '/app/analyses/' + analysis.id }" class="button secondary" :aria-label="'Otwórz raport: ' + analysis.title">Otwórz</NuxtLink>
      </li>
    </ul>
  </div>
</template>
