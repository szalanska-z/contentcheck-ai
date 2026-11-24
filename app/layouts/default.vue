<script setup lang="ts">
const account = useAccount()
</script>

<template>
  <div>
    <a class="skip-link" href="#main-content">Przejdź do treści</a>
    <header class="public-header">
      <nav class="wrap public-nav" aria-label="Nawigacja główna">
        <BrandMark />
        <NuxtLink v-if="account" to="/app" class="button primary">Przejdź do panelu</NuxtLink>
        <div v-else class="actions">
          <NuxtLink to="/login">Zaloguj się</NuxtLink>
          <NuxtLink to="/register" class="button primary">Załóż konto</NuxtLink>
        </div>
      </nav>
    </header>
    <main id="main-content" tabindex="-1"><slot /></main>
    <footer class="wrap footer"><BrandMark /><p>Analiza jakości treści i wybranych problemów dostępności.</p></footer>
  </div>
</template>
