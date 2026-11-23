<script setup lang="ts">
defineProps<{ register?: boolean }>()

const password = ref('')
const confirmation = ref('')
const error = ref('')

async function submit(register: boolean) {
  error.value = ''
  if (register && password.value !== confirmation.value) {
    error.value = 'Hasła muszą być takie same.'
    return
  }
  await navigateTo('/app')
}
</script>

<template>
  <section class="card auth-card">
    <h1>{{ register ? 'Załóż konto' : 'Zaloguj się' }}</h1>
    <p>Formularz demonstracyjny. Użyj przykładowych danych.</p>
    <form class="stack" @submit.prevent="submit(Boolean(register))">
      <label v-if="register">Imię<input required autocomplete="given-name" maxlength="100"></label>
      <label>Adres e-mail<input required type="email" autocomplete="email"></label>
      <label>Hasło<input v-model="password" required type="password" :minlength="register ? 8 : undefined" :autocomplete="register ? 'new-password' : 'current-password'"></label>
      <label v-if="register">Potwierdź hasło<input v-model="confirmation" required type="password" autocomplete="new-password" :aria-invalid="Boolean(error)" :aria-describedby="error ? 'password-error' : undefined"></label>
      <p v-if="error" id="password-error" class="error" role="alert">{{ error }}</p>
      <button class="button primary" type="submit">Wejdź do panelu demo</button>
    </form>
    <p v-if="register">Masz konto? <NuxtLink to="/login">Zaloguj się</NuxtLink></p>
    <p v-else>Potrzebujesz konta? <NuxtLink to="/register">Zarejestruj się</NuxtLink></p>
  </section>
</template>
