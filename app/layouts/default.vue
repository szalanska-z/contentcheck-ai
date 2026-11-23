<template>
  <div>
    <header class="public-header">
      <nav class="wrap public-nav" aria-label="Nawigacja główna">
        <BrandMark />
        <div class="actions">
          <NuxtLink to="/login">Zaloguj się</NuxtLink>
          <NuxtLink to="/register" class="button primary">Załóż konto</NuxtLink>
        </div>
      </nav>
    </header>
    <main><slot /></main>
    <footer class="wrap footer"><BrandMark /><p>Analiza jakości treści i wybranych problemów dostępności.</p></footer>
  </div>
</template>
