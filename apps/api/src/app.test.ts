import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

const openApps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('GET /health', () => {
  it('reports that the API is healthy', async () => {
    const app = buildApp();
    openApps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('sets API security headers without enabling development HSTS', async () => {
    const app = buildApp();
    openApps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.headers).toMatchObject({
      'content-security-policy':
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      'permissions-policy': 'camera=(), microphone=(), geolocation=(self)',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
    });
    expect(response.headers['strict-transport-security']).toBeUndefined();
  });

  it('reports database readiness and enables production HSTS', async () => {
    const app = buildApp({
      readinessCheck: () => Promise.resolve(),
      strictTransportSecurity: true,
    });
    openApps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      checks: { database: 'ok' },
    });
    expect(response.headers['strict-transport-security']).toContain(
      'max-age=31536000',
    );
  });

  it('returns a sanitized degraded readiness response', async () => {
    const app = buildApp({
      logger: false,
      readinessCheck: () => Promise.reject(new Error('secret database URL')),
    });
    openApps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      status: 'degraded',
      checks: { database: 'unavailable' },
    });
    expect(response.body).not.toContain('secret database URL');
  });
});
