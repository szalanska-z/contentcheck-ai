<script setup lang="ts">
useSeoMeta({ title: 'Rejestracja' })
const { data: settings } = await useFetch('/api/auth-settings')
</script>

<template><AuthForm register :registration-available="settings?.registrationAvailable" :email-enabled="settings?.emailEnabled" /></template>
