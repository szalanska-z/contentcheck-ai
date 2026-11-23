<script setup lang="ts">
import { History, LayoutDashboard, LogOut, Plus } from '@lucide/vue'

const account = useAccount()
const signingOut = ref(false)
const signOutError = ref('')

async function signOut() {
  signingOut.value = true
  signOutError.value = ''
  try {
    const result = await authClient.signOut()
    if (result.error) {
      signOutError.value = 'Nie udało się wylogować. Spróbuj ponownie.'
      return
    }
    account.value = null
    clearNuxtData()
    await navigateTo('/login', { replace: true })
  } catch {
    signOutError.value = 'Nie udało się wylogować. Spróbuj ponownie.'
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div class="dashboard">
    <aside class="sidebar">
      <BrandMark />
      <nav aria-label="Panel użytkownika">
        <NuxtLink to="/app"><LayoutDashboard :size="18" /> Panel</NuxtLink>
        <NuxtLink to="/app/new"><Plus :size="18" /> Nowa analiza</NuxtLink>
        <NuxtLink to="/app/analyses"><History :size="18" /> Historia</NuxtLink>
      </nav>
      <div class="account">
        <strong>{{ account?.name }}</strong>
        <button type="button" class="text-button" :disabled="signingOut" @click="signOut">
          <LogOut :size="17" /> {{ signingOut ? 'Wylogowywanie…' : 'Wyloguj się' }}
        </button>
        <p v-if="signOutError" class="error" role="alert">{{ signOutError }}</p>
      </div>
    </aside>
    <main class="workspace">
      <slot />
    </main>
  </div>
</template>
