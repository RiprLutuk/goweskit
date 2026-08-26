import { z } from 'zod';

const environmentSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z.url().default('postgresql://lutuk@localhost:1921/goweskit'),
  SESSION_COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
});

export interface AppConfig {
  apiPort: number;
  databaseUrl: string;
  sessionCookieSecure: boolean;
  webOrigin: string;
}

export function readConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const parsed = environmentSchema.parse(environment);

  return {
    apiPort: parsed.API_PORT,
    databaseUrl: parsed.DATABASE_URL,
    sessionCookieSecure: parsed.SESSION_COOKIE_SECURE,
    webOrigin: parsed.WEB_ORIGIN,
  };
}
