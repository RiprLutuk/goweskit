import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const rootEnvPath = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../.env',
);
if (existsSync(rootEnvPath)) process.loadEnvFile(rootEnvPath);

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ?? 'postgresql://lutuk@localhost:1921/goweskit',
  },
  strict: true,
  verbose: true,
});
