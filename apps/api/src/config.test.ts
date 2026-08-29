import { describe, expect, it } from 'vitest';

import { readConfig } from './config.js';

const environment = {
  DATABASE_URL: 'postgresql://lutuk@localhost:1921/goweskit',
  R2_ACCOUNT_ID: 'account-id',
  R2_ACCESS_KEY_ID: 'access-key-id',
  R2_SECRET_ACCESS_KEY: 'secret-access-key',
  R2_BUCKET_NAME: 'goweskit-media',
  R2_PUBLIC_BASE_URL: 'https://pub.example.r2.dev/',
};

describe('API configuration', () => {
  it('reads and normalizes required R2 configuration', () => {
    expect(readConfig(environment)).toMatchObject({
      environment: 'development',
      r2: {
        accountId: 'account-id',
        accessKeyId: 'access-key-id',
        secretAccessKey: 'secret-access-key',
        bucketName: 'goweskit-media',
        publicBaseUrl: 'https://pub.example.r2.dev',
        keyPrefix: 'goweskit/bike-photos',
      },
      trustProxyHops: 0,
    });
  });

  it('fails fast when an R2 credential is missing', () => {
    const missingSecret = { ...environment, R2_SECRET_ACCESS_KEY: '' };
    expect(() => readConfig(missingSecret)).toThrow();
  });

  it('requires secure HTTPS and trusted proxy configuration in production', () => {
    const production = {
      ...environment,
      NODE_ENV: 'production',
      SESSION_COOKIE_SECURE: 'true',
      TRUST_PROXY_HOPS: '1',
      WEB_ORIGIN: 'https://goweskit.example',
    };
    expect(readConfig(production)).toMatchObject({
      environment: 'production',
      sessionCookieSecure: true,
      trustProxyHops: 1,
      webOrigin: 'https://goweskit.example',
    });

    for (const invalid of [
      { ...production, SESSION_COOKIE_SECURE: 'false' },
      { ...production, TRUST_PROXY_HOPS: '0' },
      { ...production, WEB_ORIGIN: 'http://goweskit.example' },
    ]) {
      expect(() => readConfig(invalid)).toThrow();
    }
  });
});
