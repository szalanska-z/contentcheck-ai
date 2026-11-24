<script setup lang="ts">
useSeoMeta({ title: 'Odzyskiwanie hasła' })

const route = useRoute()
const { data: settings } = await useFetch('/api/auth-settings')
const token = computed(() => typeof route.query.token === 'string' && route.query.token)
const email = ref('')
const password = ref('')
const confirmation = ref('')
const error = ref('')
const notice = ref('')
const pending = ref(false)
const ready = ref(false)
onMounted(() => { ready.value = true })

async function submit() {
  if (pending.value || !settings.value?.emailEnabled) return
  error.value = ''
  if (token.value && password.value !== confirmation.value) {
    error.value = 'Hasła muszą być takie same.'
    return
  }

  pending.value = true
  try {
    const result = token.value
      ? await authClient.resetPassword({ token: token.value, newPassword: password.value })
      : await authClient.requestPasswordReset({ email: email.value.trim(), redirectTo: window.location.origin + '/reset-password' })

    if (result.error) {
      error.value = result.error.status === 429
        ? 'Za dużo prób. Odczekaj chwilę i spróbuj ponownie.'
        : token.value ? 'Nie udało się ustawić hasła. Link mógł stracić ważność.' : 'Nie udało się wysłać żądania. Spróbuj ponownie.'
      return
    }

    if (token.value) {
      await navigateTo({ path: '/login', query: { reset: 'done' } }, { replace: true })
    } else {
      notice.value = 'Jeśli istnieje konto z tym adresem, otrzymasz link do zmiany hasła.'
    }
  } catch {
    error.value = 'Nie udało się połączyć z usługą logowania.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="card auth-card">
    <h1>{{ token ? 'Ustaw nowe hasło' : 'Odzyskaj hasło' }}</h1>
    <p v-if="!settings?.emailEnabled">Odzyskiwanie hasła jest obecnie niedostępne.</p>
    <p v-else-if="notice" role="status">{{ notice }}</p>
    <form v-else class="stack" @submit.prevent="submit">
      <p v-if="route.query.error && !token">Link jest nieprawidłowy lub wygasł. Możesz poprosić o nowy.</p>
      <template v-if="token">
        <label>Nowe hasło<input v-model="password" required type="password" autocomplete="new-password" minlength="8" maxlength="128"></label>
        <label>Potwierdź hasło<input v-model="confirmation" required type="password" autocomplete="new-password" maxlength="128"></label>
      </template>
      <label v-else>Adres e-mail<input v-model="email" required type="email" autocomplete="email" maxlength="254"></label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" class="button primary" :disabled="!ready || pending">{{ token ? 'Zapisz nowe hasło' : 'Wyślij link' }}</button>
      <NuxtLink v-if="token && error" to="/reset-password">Poproś o nowy link</NuxtLink>
    </form>
    <p><NuxtLink to="/login">Wróć do logowania</NuxtLink></p>
  </section>
</template>
