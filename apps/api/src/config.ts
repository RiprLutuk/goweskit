import { z } from 'zod';

const environmentSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z.url().default('postgresql://lutuk@localhost:1921/goweskit'),
  R2_ACCOUNT_ID: z.string().trim().min(1),
  R2_ACCESS_KEY_ID: z.string().trim().min(1),
  R2_SECRET_ACCESS_KEY: z.string().trim().min(1),
  R2_BUCKET_NAME: z.string().trim().min(1),
  R2_PUBLIC_BASE_URL: z
    .url()
    .refine((value) => value.startsWith('https://'))
    .transform((value) => value.replace(/\/+$/u, '')),
  R2_KEY_PREFIX: z
    .string()
    .trim()
    .min(1)
    .max(180)
    .regex(/^[a-zA-Z0-9/_-]+$/u)
    .transform((value) => value.replace(/^\/+|\/+$/gu, ''))
    .default('goweskit/bike-photos'),
  SESSION_COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
});

export interface AppConfig {
  apiPort: number;
  databaseUrl: string;
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicBaseUrl: string;
    keyPrefix: string;
  };
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
    r2: {
      accountId: parsed.R2_ACCOUNT_ID,
      accessKeyId: parsed.R2_ACCESS_KEY_ID,
      secretAccessKey: parsed.R2_SECRET_ACCESS_KEY,
      bucketName: parsed.R2_BUCKET_NAME,
      publicBaseUrl: parsed.R2_PUBLIC_BASE_URL,
      keyPrefix: parsed.R2_KEY_PREFIX,
    },
    sessionCookieSecure: parsed.SESSION_COOKIE_SECURE,
    webOrigin: parsed.WEB_ORIGIN,
  };
}
