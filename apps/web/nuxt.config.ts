import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const rootEnvPath = resolve(import.meta.dirname, '../../.env');
if (existsSync(rootEnvPath)) process.loadEnvFile(rootEnvPath);

const devServerPort = Number(process.env.NUXT_PORT ?? 3000);
if (
  !Number.isInteger(devServerPort) ||
  devServerPort < 1 ||
  devServerPort > 65_535
) {
  throw new Error('NUXT_PORT must be an integer between 1 and 65535.');
}

export default defineNuxtConfig({
  compatibilityDate: '2026-08-26',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  modules: ['@nuxt/eslint', '@vite-pwa/nuxt'],
  devServer: {
    port: devServerPort,
  },
  routeRules: {
    '/communities': { redirect: '/community' },
    '/maintenance': { redirect: '/garage' },
  },
  vite: {
    optimizeDeps: {
      exclude: ['maplibre-gl'],
    },
    ssr: {
      external: ['zod'],
    },
  },
  nitro: {
    // Zod 4 exports an internal top-level `process` function. Keeping Zod as a
    // runtime external avoids a name collision with Nitro's Vercel env shim.
    externals: {
      external: ['zod'],
    },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1',
      googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'GowesKit — Cycling Knowledge & Workshop',
      short_name: 'GowesKit',
      description:
        'Learn bicycle anatomy, verify upgrade compatibility with deterministic rules, and share safe rides.',
      theme_color: '#17202A',
      background_color: '#FFFDF7',
      display: 'standalone',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: '/icons/icon-192.svg',
          sizes: '192x192',
          type: 'image/svg+xml',
          purpose: 'any',
        },
        {
          src: '/icons/icon.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,json}'],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
      suppressWarnings: true,
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'GowesKit — Cycling Knowledge & Workshop',
      meta: [
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
        },
        {
          name: 'description',
          content:
            'Learn bicycle anatomy, verify upgrade compatibility with deterministic rules, and share safe rides.',
        },
        { name: 'theme-color', content: '#17202A' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black-translucent',
        },
        { name: 'apple-mobile-web-app-title', content: 'GowesKit' },
        { name: 'application-name', content: 'GowesKit' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&display=swap',
        },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
});
