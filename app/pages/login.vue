<script setup lang="ts">
useSeoMeta({ title: 'Logowanie' })
const route = useRoute()
const { data: settings } = await useFetch('/api/auth-settings')
</script>

<template>
  <div>
    <p v-if="route.query.reset === 'done'" class="wrap" role="status">Hasło zostało zmienione. Możesz się zalogować.</p>
    <AuthForm :email-enabled="settings?.emailEnabled" />
  </div>
</template>
