<script setup lang="ts">
import type { AnalysisSummary } from '#shared/types/analysis'

defineProps<{ analyses: AnalysisSummary[], editable?: boolean }>()
const emit = defineEmits<{ renamed: [], removed: [] }>()
</script>

<template>
  <div class="card history">
    <p v-if="!analyses.length">Brak raportów do wyświetlenia.</p>
    <ul v-else>
      <li v-for="analysis in analyses" :key="analysis.id" class="split">
        <div class="report-title">
          <strong>{{ analysis.title }}</strong>
          <p><time :datetime="analysis.createdAt">{{ formatReportDate(analysis.createdAt) }}</time> · Problemy: {{ analysis.issueCount }} · {{ analysis.aiStatus === 'success' ? 'Sugestie AI zapisane' : 'Bez sugestii AI' }}</p>
        </div>
        <div class="actions">
          <NuxtLink :to="'/app/analyses/' + analysis.id" class="button secondary" :aria-label="'Otwórz raport: ' + analysis.title">Otwórz</NuxtLink>
          <ReportActions v-if="editable" :id="analysis.id" :title="analysis.title" allow-rename @renamed="emit('renamed')" @removed="emit('removed')" />
        </div>
      </li>
    </ul>
  </div>
</template>
