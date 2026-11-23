export default defineNuxtConfig({
  compatibilityDate: '2026-11-20',
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  typescript: { strict: true },
  app: {
    head: {
      htmlAttrs: { lang: 'pl' },
      titleTemplate: '%s · ContentCheck AI',
      meta: [{ name: 'description', content: 'Sprawdź jakość i dostępność fragmentów HTML.' }],
    },
  },
})
