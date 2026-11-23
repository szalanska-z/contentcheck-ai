<script setup lang="ts">
import type { Category, Issue } from '#shared/types/analysis'

const props = defineProps<{ issues: Issue[] }>()
const emit = defineEmits<{ reset: [] }>()
const filters = { all: 'Wszystkie', ...categoryLabels }
const category = ref<Category | 'all'>('all')
const visibleIssues = computed(() => props.issues.filter(issue => category.value === 'all' || issue.category === category.value))
</script>

<template>
  <section class="card stack results" aria-labelledby="results-title">
    <div class="split">
      <h2 id="results-title">Wyniki analizy <span class="pill">{{ issues.length }}</span></h2>
      <button type="button" class="text-button" @click="emit('reset')">Nowa analiza</button>
    </div>
    <div class="actions" role="group" aria-label="Filtr kategorii">
      <button v-for="(label, key) in filters" :key="key" type="button" class="pill filter" :aria-pressed="category === key" @click="category = key">{{ label }}</button>
    </div>
    <p v-if="!visibleIssues.length" role="status">Brak problemów do pokazania w tej kategorii.</p>
    <article v-for="issue in visibleIssues" :key="issue.id" class="issue">
      <div class="actions">
        <span class="pill" :class="{ warning: issue.severity === 'warning' }">{{ categoryLabels[issue.category] }}</span>
        <span>{{ issue.severity === 'review' ? 'Do weryfikacji' : 'Ostrzeżenie' }}</span>
      </div>
      <h3>{{ issue.title }}</h3>
      <p>{{ issue.description }} {{ issue.recommendation }}</p>
      <pre><code>{{ issue.htmlSnippet }}</code></pre>
    </article>
  </section>
</template>
