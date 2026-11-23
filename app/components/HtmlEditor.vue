<script setup lang="ts">
import { CodeXml, ScanLine } from '@lucide/vue'

const html = defineModel<string>({ required: true })
defineProps<{ error: string }>()
const emit = defineEmits<{ analyze: [] }>()
</script>

<template>
  <form class="card editor stack" @submit.prevent="emit('analyze')">
    <div class="split">
      <label for="html"><CodeXml :size="20" /> Fragment HTML</label>
      <div class="actions">
        <button type="button" class="text-button" @click="html = demoAnalysis.originalHtml">Wstaw przykład</button>
        <button type="button" class="text-button" @click="html = ''">Wyczyść</button>
      </div>
    </div>
    <textarea id="html" v-model="html" rows="10" spellcheck="false" :maxlength="htmlLimit" :aria-invalid="Boolean(error)" :aria-describedby="error ? 'html-error html-limit' : 'html-limit'" placeholder="Wklej tutaj kod HTML…" />
    <p v-if="error" id="html-error" class="error" role="alert">{{ error }}</p>
    <div class="split">
      <small id="html-limit">{{ html.length }} / {{ htmlLimit.toLocaleString('pl-PL') }} znaków</small>
      <button class="button primary" type="submit"><ScanLine :size="19" /> Pokaż wyniki demo</button>
    </div>
  </form>
</template>
