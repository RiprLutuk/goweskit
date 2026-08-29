import { OAuth2Client, type TokenPayload } from 'google-auth-library';

import { AppError } from '../errors.js';
import type { VerifiedGoogleIdentity } from '../services/auth-service.js';

interface GoogleVerificationTicket {
  getPayload(): TokenPayload | undefined;
}

export interface GoogleTokenVerifierClient {
  verifyIdToken(input: {
    idToken: string;
    audience: string;
  }): Promise<GoogleVerificationTicket>;
}

export class GoogleIdentityVerifier {
  private readonly client: GoogleTokenVerifierClient;

  public constructor(
    private readonly clientId: string,
    client?: GoogleTokenVerifierClient,
  ) {
    this.client = client ?? new OAuth2Client();
  }

  public async verify(idToken: string): Promise<VerifiedGoogleIdentity> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      const payload = ticket.getPayload();
      if (payload === undefined) {
        throw new Error('Google identity claims are incomplete.');
      }
      const email = payload.email?.trim().toLowerCase();
      const subject = payload.sub.trim();
      if (
        payload.email_verified !== true ||
        email === undefined ||
        email.length === 0 ||
        subject.length === 0
      ) {
        throw new Error('Google identity claims are incomplete.');
      }
      const fallbackName = email.split('@')[0] ?? 'Rider';
      const googleName = payload.name?.trim();
      const displayName = (
        googleName === undefined || googleName.length === 0
          ? fallbackName
          : googleName
      ).slice(0, 80);
      return {
        displayName,
        email,
        subject,
      };
    } catch {
      throw new AppError(
        'AUTH_GOOGLE_INVALID',
        'Google sign-in could not be verified.',
        401,
      );
    }
  }
}
