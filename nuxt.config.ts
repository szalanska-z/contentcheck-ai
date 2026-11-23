export default defineNuxtConfig({
  compatibilityDate: '2026-11-20',
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  typescript: { strict: true },
  runtimeConfig: {
    aiMode: 'demo',
    openaiApiKey: '',
    openaiModel: '',
    aiAllowProductionLive: false,
  },
  routeRules: {
    '/': { headers: { 'cache-control': 'private, no-store' } },
    '/login': { headers: { 'cache-control': 'private, no-store' } },
    '/register': { headers: { 'cache-control': 'private, no-store' } },
    '/app': { headers: { 'cache-control': 'private, no-store' } },
    '/app/**': { headers: { 'cache-control': 'private, no-store' } },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'pl' },
      titleTemplate: '%s · ContentCheck AI',
      meta: [{ name: 'description', content: 'Sprawdź jakość i dostępność fragmentów HTML.' }],
    },
  },
})
