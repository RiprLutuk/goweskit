import type { TokenPayload } from 'google-auth-library';
import { describe, expect, it } from 'vitest';

import {
  GoogleIdentityVerifier,
  type GoogleTokenVerifierClient,
} from './google-identity.js';

function verifierWith(payload: Record<string, unknown>) {
  const client: GoogleTokenVerifierClient = {
    verifyIdToken: () =>
      Promise.resolve({
        getPayload: () => payload as unknown as TokenPayload,
      }),
  };
  return new GoogleIdentityVerifier('google-client-id', client);
}

describe('GoogleIdentityVerifier', () => {
  it('uses the verified Google subject as identity and normalizes claims', async () => {
    await expect(
      verifierWith({
        sub: 'google-subject-1',
        email: ' Rider@Gmail.com ',
        email_verified: true,
        name: 'Rider Tangerang',
      }).verify('signed-id-token'),
    ).resolves.toEqual({
      subject: 'google-subject-1',
      email: 'rider@gmail.com',
      displayName: 'Rider Tangerang',
      emailAuthoritative: true,
    });
  });

  it('rejects unverified, incomplete, and provider-rejected tokens neutrally', async () => {
    for (const verifier of [
      verifierWith({
        sub: 'subject',
        email: 'rider@example.com',
        email_verified: false,
      }),
      verifierWith({ email: 'rider@example.com', email_verified: true }),
      new GoogleIdentityVerifier('client-id', {
        verifyIdToken: () => Promise.reject(new Error('provider details')),
      }),
    ]) {
      await expect(verifier.verify('bad-token')).rejects.toMatchObject({
        code: 'AUTH_GOOGLE_INVALID',
        statusCode: 401,
      });
    }
  });
});
