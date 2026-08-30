import { z } from 'zod';

const optionalSecret = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim().length === 0 ? undefined : value,
  z.string().trim().min(1).optional(),
);
const optionalEmail = z.preprocess(
  (value) =>
    typeof value === 'string'
      ? value.trim().length === 0
        ? undefined
        : value.trim()
      : value,
  z.email().toLowerCase().optional(),
);
const optionalHmacSecret = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim().length === 0 ? undefined : value,
  z.string().trim().min(32).optional(),
);

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  BREVO_API_KEY: optionalSecret,
  BREVO_SENDER_NAME: optionalSecret,
  BREVO_SENDER_EMAIL: optionalEmail,
  DATABASE_URL: z.url().default('postgresql://lutuk@localhost:1921/goweskit'),
  GEMINI_API_KEY: optionalSecret,
  GOOGLE_CLIENT_ID: optionalSecret,
  OPENAI_API_KEY: optionalSecret,
  OTP_DEMO_ENABLED: z.enum(['true', 'false']).optional(),
  OTP_HMAC_SECRET: optionalHmacSecret,
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
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
});

export interface AppConfig {
  ai: {
    geminiApiKey: string | null;
    openaiApiKey: string | null;
  };
  apiPort: number;
  databaseUrl: string;
  email: null | {
    apiKey: string;
    senderName: string;
    senderEmail: string;
  };
  environment: 'development' | 'test' | 'production';
  googleClientId: string | null;
  otpDemoEnabled: boolean;
  otpHmacSecret: string | null;
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicBaseUrl: string;
    keyPrefix: string;
  };
  sessionCookieSecure: boolean;
  trustProxyHops: number;
  webOrigin: string;
}

export function readConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const parsed = environmentSchema.parse(environment);
  const emailConfigured =
    parsed.BREVO_API_KEY !== undefined ||
    parsed.BREVO_SENDER_EMAIL !== undefined;
  if (
    emailConfigured &&
    (parsed.BREVO_API_KEY === undefined ||
      parsed.BREVO_SENDER_EMAIL === undefined)
  ) {
    throw new Error(
      'BREVO_API_KEY and BREVO_SENDER_EMAIL must be configured together.',
    );
  }

  if (parsed.NODE_ENV === 'production') {
    if (!parsed.SESSION_COOKIE_SECURE) {
      throw new Error('SESSION_COOKIE_SECURE must be true in production.');
    }
    if (!parsed.WEB_ORIGIN.startsWith('https://')) {
      throw new Error('WEB_ORIGIN must use HTTPS in production.');
    }
    if (parsed.TRUST_PROXY_HOPS < 1) {
      throw new Error('TRUST_PROXY_HOPS must be at least 1 in production.');
    }
    if (parsed.GOOGLE_CLIENT_ID === undefined) {
      throw new Error('GOOGLE_CLIENT_ID is required in production.');
    }
    if (parsed.OTP_DEMO_ENABLED === 'true') {
      throw new Error('OTP_DEMO_ENABLED cannot be true in production.');
    }
    if (emailConfigured && parsed.OTP_HMAC_SECRET === undefined) {
      throw new Error(
        'OTP_HMAC_SECRET is required when Brevo is configured in production.',
      );
    }
  }

  return {
    ai: {
      geminiApiKey: parsed.GEMINI_API_KEY ?? null,
      openaiApiKey: parsed.OPENAI_API_KEY ?? null,
    },
    apiPort: parsed.API_PORT,
    databaseUrl: parsed.DATABASE_URL,
    email:
      parsed.BREVO_API_KEY === undefined ||
      parsed.BREVO_SENDER_EMAIL === undefined
        ? null
        : {
            apiKey: parsed.BREVO_API_KEY,
            senderName: parsed.BREVO_SENDER_NAME ?? 'GowesKit',
            senderEmail: parsed.BREVO_SENDER_EMAIL,
          },
    environment: parsed.NODE_ENV,
    googleClientId: parsed.GOOGLE_CLIENT_ID ?? null,
    otpDemoEnabled:
      parsed.OTP_DEMO_ENABLED === undefined
        ? parsed.NODE_ENV !== 'production'
        : parsed.OTP_DEMO_ENABLED === 'true',
    otpHmacSecret: parsed.OTP_HMAC_SECRET ?? null,
    r2: {
      accountId: parsed.R2_ACCOUNT_ID,
      accessKeyId: parsed.R2_ACCESS_KEY_ID,
      secretAccessKey: parsed.R2_SECRET_ACCESS_KEY,
      bucketName: parsed.R2_BUCKET_NAME,
      publicBaseUrl: parsed.R2_PUBLIC_BASE_URL,
      keyPrefix: parsed.R2_KEY_PREFIX,
    },
    sessionCookieSecure: parsed.SESSION_COOKIE_SECURE,
    trustProxyHops: parsed.TRUST_PROXY_HOPS,
    webOrigin: parsed.WEB_ORIGIN,
  };
}
