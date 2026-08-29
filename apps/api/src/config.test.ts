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
      r2: {
        accountId: 'account-id',
        accessKeyId: 'access-key-id',
        secretAccessKey: 'secret-access-key',
        bucketName: 'goweskit-media',
        publicBaseUrl: 'https://pub.example.r2.dev',
        keyPrefix: 'goweskit/bike-photos',
      },
    });
  });

  it('fails fast when an R2 credential is missing', () => {
    const missingSecret = { ...environment, R2_SECRET_ACCESS_KEY: '' };
    expect(() => readConfig(missingSecret)).toThrow();
  });
});
