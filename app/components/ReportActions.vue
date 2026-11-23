<script setup lang="ts">
import { reportTitle, titleLimit } from '#shared/schemas/analysis'

const props = defineProps<{ id: string, title: string, allowRename?: boolean }>()
const emit = defineEmits<{ renamed: [], removed: [] }>()
const editing = ref(false)
const draftTitle = ref('')
const pending = ref(false)
const error = ref('')

function startRename() {
  draftTitle.value = props.title
  error.value = ''
  editing.value = true
}

async function rename() {
  if (pending.value) return
  const parsed = reportTitle.safeParse(draftTitle.value)
  if (!parsed.success) {
    error.value = 'Podaj nazwę raportu (maksymalnie 120 znaków).'
    return
  }
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/analyses/' + props.id, { method: 'PATCH', body: { title: parsed.data } })
    editing.value = false
    emit('renamed')
  } catch {
    error.value = 'Nie udało się zmienić nazwy raportu.'
  } finally {
    pending.value = false
  }
}

async function remove() {
  if (pending.value || !window.confirm('Czy usunąć raport „' + props.title + '”?')) return
  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/analyses/' + props.id, { method: 'DELETE' })
    emit('removed')
  } catch {
    error.value = 'Nie udało się usunąć raportu.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="report-actions">
    <form v-if="editing" class="actions" @submit.prevent="rename">
      <label>Nowa nazwa<input v-model="draftTitle" required :maxlength="titleLimit"></label>
      <button type="submit" class="button secondary" :disabled="pending">Zapisz nazwę</button>
      <button type="button" class="text-button" :disabled="pending" @click="editing = false; error = ''">Anuluj</button>
    </form>
    <div v-else class="actions">
      <button v-if="allowRename" type="button" class="text-button" :disabled="pending" :aria-label="'Zmień nazwę raportu: ' + props.title" @click="startRename">Zmień nazwę</button>
      <button type="button" class="text-button danger" :disabled="pending" :aria-label="'Usuń raport: ' + props.title" @click="remove">Usuń</button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>
