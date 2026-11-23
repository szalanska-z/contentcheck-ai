<script setup lang="ts">
import { CodeXml, History, ListChecks, ScanLine, Sparkles } from '@lucide/vue'

useSeoMeta({ title: 'Jakość treści HTML' })

const benefits = [
  { icon: ScanLine, title: 'Sprawdź dostępność', body: 'Wychwyć brakujące opisy obrazów, puste nagłówki i ogólnikowe linki.' },
  { icon: Sparkles, title: 'Pisz prościej', body: 'Zobacz przykłady zmian, które ułatwiają czytanie i zachowują sens tekstu.' },
  { icon: History, title: 'Wracaj do raportów', body: 'Otwórz poprzednią analizę i wykorzystaj jej HTML jako punkt wyjścia.' },
]
</script>

<template>
  <div>
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <p class="eyebrow"><CodeXml :size="18" /> Narzędzie dla zespołów redakcyjnych</p>
          <h1>Dopracuj treść <em>przed publikacją.</em></h1>
          <p class="lede">Sprawdź fragment HTML pod kątem wybranych problemów dostępności i zobacz, jak uprościć tekst.</p>
          <div class="actions">
            <NuxtLink class="button primary" to="/app/new">Wypróbuj demo</NuxtLink>
            <a class="button secondary" href="#how">Jak to działa</a>
          </div>
        </div>
        <div class="preview card">
          <div class="preview-head"><ListChecks :size="21" /><strong>Przykładowy raport</strong></div>
          <pre><code>&lt;img src="cover.jpg"&gt;
  &lt;h2&gt; &lt;/h2&gt;
  &lt;a href="/poradnik"&gt;Czytaj więcej&lt;/a&gt;</code></pre>
          <div class="preview-row"><span class="pill warning">Obrazy</span><span>Brak atrybutu alt</span></div>
          <div class="preview-row"><span class="pill warning">Struktura</span><span>Pusty nagłówek</span></div>
          <div class="preview-row"><span class="pill">Linki</span><span>Sprawdź kontekst linku</span></div>
        </div>
      </div>
    </section>
    <section class="wrap section">
      <h2>Przygotuj treść do publikacji</h2>
      <div class="grid-three">
        <article v-for="benefit in benefits" :key="benefit.title" class="card tile">
          <span class="tile-icon"><component :is="benefit.icon" :size="23" /></span>
          <h3>{{ benefit.title }}</h3><p>{{ benefit.body }}</p>
        </article>
      </div>
    </section>
    <section id="how" class="wrap section how">
      <h2>Jak to działa?</h2>
      <ol>
        <li>Wklej fragment HTML lub wstaw przykład.</li>
        <li>Przejrzyj problemy i wskazówki w raporcie.</li>
        <li>Zdecyduj, które zmiany wprowadzisz w treści.</li>
      </ol>
      <p>Raport obejmuje wybrane reguły dostępności. Pełna ocena WCAG wymaga szerszego audytu.</p>
      <NuxtLink class="button primary" to="/register">Przejdź do rejestracji</NuxtLink>
    </section>
  </div>
</template>
