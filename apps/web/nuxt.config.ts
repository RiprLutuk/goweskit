export default defineNuxtConfig({
  compatibilityDate: '2026-08-26',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  modules: ['@nuxt/eslint'],
  vite: {
    optimizeDeps: {
      exclude: ['maplibre-gl'],
    },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'GowesKit',
      meta: [
        {
          name: 'description',
          content: 'A learning-first cycling platform.',
        },
        { name: 'theme-color', content: '#fffdf7' },
      ],
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
});
