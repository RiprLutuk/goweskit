import type { LoginRequest, RegisterRequest, User } from '@goweskit/contracts';

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
