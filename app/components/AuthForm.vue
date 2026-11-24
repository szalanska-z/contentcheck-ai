<script setup lang="ts">
const props = defineProps<{ register?: boolean, registrationAvailable?: boolean, emailEnabled?: boolean }>()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmation = ref('')
const error = ref('')
const mismatch = ref(false)
const pending = ref(false)
const notice = ref('')
const ready = ref(false)
onMounted(() => { ready.value = true })

async function submit() {
  if (pending.value || (props.register && !props.registrationAvailable)) return
  error.value = ''
  mismatch.value = props.register === true && password.value !== confirmation.value
  if (mismatch.value) {
    error.value = 'Hasła muszą być takie same.'
    return
  }
  if (props.register && !name.value.trim()) {
    error.value = 'Podaj imię.'
    return
  }

  pending.value = true
  try {
    const credentials = { email: email.value.trim(), password: password.value }
    const result = props.register
      ? await authClient.signUp.email({ ...credentials, name: name.value.trim(), callbackURL: '/login' })
      : await authClient.signIn.email(props.emailEnabled ? { ...credentials, callbackURL: '/login' } : credentials)

    if (result.error) {
      if (result.error.status === 429) {
        error.value = 'Za dużo prób. Odczekaj chwilę i spróbuj ponownie.'
      } else if (!props.register && result.error.status === 401) {
        error.value = 'Sprawdź adres e-mail i hasło.'
      } else if (result.error.code === 'EMAIL_NOT_VERIFIED') {
        error.value = 'Potwierdź adres e-mail przed zalogowaniem. Sprawdź skrzynkę pocztową.'
      } else {
        error.value = props.register && result.error.status < 500
          ? 'Nie udało się założyć konta. Sprawdź dane lub spróbuj się zalogować.'
          : 'Logowanie jest chwilowo niedostępne. Spróbuj ponownie później.'
      }
      return
    }

    password.value = ''
    confirmation.value = ''
    if (props.register && props.emailEnabled) {
      notice.value = 'Sprawdź pocztę, aby potwierdzić adres e-mail przed zalogowaniem.'
      return
    }
    await navigateTo('/app')
  } catch {
    error.value = 'Nie udało się połączyć z usługą logowania.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="card auth-card">
    <h1>{{ register ? 'Załóż konto' : 'Zaloguj się' }}</h1>
    <p v-if="notice" role="status">{{ notice }}</p>
    <p v-else-if="register && !registrationAvailable">Rejestracja jest obecnie niedostępna.</p>
    <form v-else :aria-busy="pending" @submit.prevent="submit">
      <fieldset class="stack auth-fields" :disabled="!ready || pending">
        <label v-if="register">Imię<input v-model="name" required autocomplete="given-name" maxlength="100"></label>
        <label>Adres e-mail<input v-model="email" required type="email" autocomplete="email" maxlength="254"></label>
        <label>Hasło<input v-model="password" required type="password" maxlength="128" :minlength="register ? 8 : undefined" :autocomplete="register ? 'new-password' : 'current-password'"></label>
        <label v-if="register">Potwierdź hasło<input v-model="confirmation" required type="password" maxlength="128" autocomplete="new-password" :aria-invalid="mismatch" :aria-describedby="mismatch ? 'auth-error' : undefined"></label>
        <p v-if="error" id="auth-error" class="error" role="alert">{{ error }}</p>
        <button class="button primary" type="submit" :disabled="pending">
          {{ pending ? 'Proszę czekać…' : register ? 'Załóż konto' : 'Zaloguj się' }}
        </button>
      </fieldset>
    </form>
    <p v-if="!register && emailEnabled"><NuxtLink to="/reset-password">Nie pamiętam hasła</NuxtLink></p>
    <p v-if="register">Masz konto? <NuxtLink to="/login">Zaloguj się</NuxtLink></p>
    <p v-else>Potrzebujesz konta? <NuxtLink to="/register">Zarejestruj się</NuxtLink></p>
  </section>
</template>
