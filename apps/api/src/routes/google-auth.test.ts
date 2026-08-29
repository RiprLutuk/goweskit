import type { User } from '@goweskit/contracts';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type AppServices } from '../app.js';
import {
  GoogleIdentityVerifier,
  type GoogleTokenVerifierClient,
} from '../auth/google-identity.js';
import type { VerifiedGoogleIdentity } from '../services/auth-service.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000002',
  displayName: 'Rider Tangerang',
  email: 'rider@gmail.com',
  createdAt: '2026-08-29T00:00:00.000Z',
};
const openApps: ReturnType<typeof buildApp>[] = [];

function services(
  onGoogleIdentity: (identity: VerifiedGoogleIdentity) => void,
) {
  return {
    auth: {
      loginWithGoogle: (identity: VerifiedGoogleIdentity) => {
        onGoogleIdentity(identity);
        return Promise.resolve({
          user,
          token: 'session-token',
          expiresAt: new Date('2026-09-28T00:00:00.000Z'),
        });
      },
    } as unknown as AppServices['auth'],
    catalog: {} as AppServices['catalog'],
    compatibility: {} as AppServices['compatibility'],
    community: {} as AppServices['community'],
    explore: {} as AppServices['explore'],
    garage: {} as AppServices['garage'],
    installedComponents: {} as AppServices['installedComponents'],
    maintenance: {} as AppServices['maintenance'],
  };
}

function configuredVerifier() {
  const client: GoogleTokenVerifierClient = {
    verifyIdToken: () =>
      Promise.resolve({
        getPayload: () => ({
          sub: 'google-subject-1',
          email: user.email,
          email_verified: true,
          name: user.displayName,
        }),
      }),
  };
  return new GoogleIdentityVerifier('google-client-id', client);
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('POST /api/v1/auth/google', () => {
  it('verifies Google identity before issuing a secure GowesKit session', async () => {
    let receivedIdentity: VerifiedGoogleIdentity | null = null;
    const app = buildApp({
      cookieSecure: true,
      googleIdentityVerifier: configuredVerifier(),
      logger: false,
      services: services((identity) => {
        receivedIdentity = identity;
      }),
    });
    openApps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/google',
      payload: { idToken: 'signed-token'.padEnd(100, 'x') },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user });
    expect(receivedIdentity).toMatchObject({
      subject: 'google-subject-1',
      email: user.email,
    });
    expect(response.headers['set-cookie']).toContain('HttpOnly');
    expect(response.headers['set-cookie']).toContain('Secure');
    expect(response.headers['set-cookie']).toContain('SameSite=Lax');
  });

  it('rejects unsigned fallback profiles and disabled provider configuration', async () => {
    const app = buildApp({
      logger: false,
      services: services(() => undefined),
    });
    openApps.push(app);

    const invalid = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/google',
      payload: { email: 'fake-google@example.com' },
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json()).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    });

    const unavailable = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/google',
      payload: { idToken: 'signed-token'.padEnd(100, 'x') },
    });
    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.json()).toMatchObject({
      error: { code: 'AUTH_GOOGLE_UNAVAILABLE' },
    });
  });
});
