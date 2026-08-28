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
  modules: ['@nuxt/eslint'],
  devServer: {
    port: devServerPort,
  },
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
