<script setup lang="ts">
import { History, LayoutDashboard, LogOut, Plus } from '@lucide/vue'
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
      <div class="account"><strong>Ola · konto demo</strong><NuxtLink to="/login"><LogOut :size="17" /> Opuść demo</NuxtLink></div>
    </aside>
    <main class="workspace">
      <p class="eyebrow">Panel demonstracyjny</p>
      <slot />
    </main>
  </div>
</template>
