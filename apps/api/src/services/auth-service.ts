import type { GoogleAuthRequest, LoginRequest, RegisterRequest, User } from '@goweskit/contracts';

import { hashPassword, verifyPassword } from '../auth/password.js';
import {
  createSessionToken,
  hashSessionToken,
  SESSION_DURATION_MS,
} from '../auth/session.js';
import { AppError } from '../errors.js';
import type { AuthRepository } from '../repositories/auth-repository.js';

export interface AuthenticatedSession {
  user: User;
  token: string;
  expiresAt: Date;
}

function toPublicUser(user: {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
}): User {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export class AuthService {
  public constructor(private readonly repository: AuthRepository) {}

  public async loginWithGoogle(
    input: GoogleAuthRequest,
  ): Promise<AuthenticatedSession> {
    let email = input.email?.trim().toLowerCase();
    let displayName = input.displayName?.trim();

    // If idToken is provided, decode JWT payload
    if (input.idToken) {
      try {
        const parts = input.idToken.split('.');
        if (parts.length === 3 && parts[1] !== undefined) {
          const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
          const payload = JSON.parse(payloadJson) as {
            email?: string;
            name?: string;
            given_name?: string;
          };
          if (payload.email) email = payload.email.trim().toLowerCase();
          if (payload.name) displayName = payload.name.trim();
        }
      } catch {
        // Fallback to explicit fields
      }
    }

    if (!email) {
      throw new AppError(
        'AUTH_INVALID_CREDENTIALS',
        'Google authentication did not return a valid email address.',
        400,
      );
    }

    if (!displayName) {
      displayName = email.split('@')[0] ?? 'Rider';
    }

    // Find existing user or auto-register rider account
    let storedUser = await this.repository.findUserByEmail(email);
    if (storedUser === null) {
      const randomSecret = `GoogleOAuth_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      storedUser = await this.repository.createUser({
        displayName,
        email,
        passwordHash: await hashPassword(randomSecret),
      });

      if (storedUser === null) {
        throw new AppError(
          'AUTH_EMAIL_EXISTS',
          'Could not create account for Google user.',
          409,
        );
      }
    }

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await this.repository.createSession(
      storedUser.id,
      hashSessionToken(token),
      expiresAt,
    );

    return { user: toPublicUser(storedUser), token, expiresAt };
  }

  public async register(input: RegisterRequest): Promise<User> {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing !== null) {
      throw new AppError(
        'AUTH_EMAIL_EXISTS',
        'An account already uses this email.',
        409,
      );
    }

    const created = await this.repository.createUser({
      displayName: input.displayName,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    });

    if (created === null) {
      throw new AppError(
        'AUTH_EMAIL_EXISTS',
        'An account already uses this email.',
        409,
      );
    }

    return toPublicUser(created);
  }

  public async login(input: LoginRequest): Promise<AuthenticatedSession> {
    const storedUser = await this.repository.findUserByEmail(input.email);
    if (
      storedUser === null ||
      !(await verifyPassword(input.password, storedUser.passwordHash))
    ) {
      throw new AppError(
        'AUTH_INVALID_CREDENTIALS',
        'Email or password is incorrect.',
        401,
      );
    }

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await this.repository.createSession(
      storedUser.id,
      hashSessionToken(token),
      expiresAt,
    );

    return { user: toPublicUser(storedUser), token, expiresAt };
  }

  public async authenticate(token: string | undefined): Promise<User> {
    if (token === undefined || token.length === 0) {
      throw new AppError('AUTH_REQUIRED', 'Sign in to continue.', 401);
    }

    const user = await this.repository.findUserBySession(
      hashSessionToken(token),
      new Date(),
    );
    if (user === null) {
      throw new AppError(
        'AUTH_SESSION_EXPIRED',
        'Your session has expired.',
        401,
      );
    }

    return user;
  }

  public async logout(token: string | undefined): Promise<void> {
    if (token !== undefined && token.length > 0) {
      await this.repository.deleteSession(hashSessionToken(token));
    }
  }
}
