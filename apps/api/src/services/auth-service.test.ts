import type { LoginRequest, RegisterRequest, User } from '@goweskit/contracts';
import { describe, expect, it } from 'vitest';

import type {
  AuthRepository,
  CreateUserInput,
  StoredUser,
} from '../repositories/auth-repository.js';
import { AuthService } from './auth-service.js';

class MemoryAuthRepository implements AuthRepository {
  public user: StoredUser | null = null;
  public session: {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  } | null = null;

  public createUser(input: CreateUserInput): Promise<StoredUser | null> {
    if (this.user?.email === input.email) return Promise.resolve(null);
    this.user = {
      id: '019c9c80-2896-7593-bd02-509894b9ffff',
      ...input,
      createdAt: '2026-08-27T00:00:00.000Z',
    };
    return Promise.resolve(this.user);
  }

  public findUserByEmail(email: string): Promise<StoredUser | null> {
    return Promise.resolve(this.user?.email === email ? this.user : null);
  }

  public createSession(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    this.session = { userId, tokenHash, expiresAt };
    return Promise.resolve();
  }

  public findUserBySession(tokenHash: string, now: Date): Promise<User | null> {
    if (
      this.session?.tokenHash !== tokenHash ||
      this.session.expiresAt <= now ||
      this.user === null
    ) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      id: this.user.id,
      displayName: this.user.displayName,
      email: this.user.email,
      createdAt: this.user.createdAt,
    });
  }

  public deleteSession(tokenHash: string): Promise<void> {
    if (this.session?.tokenHash === tokenHash) this.session = null;
    return Promise.resolve();
  }
}

const registration: RegisterRequest = {
  displayName: 'Ayu Rider',
  email: 'ayu@example.com',
  password: 'safe-password',
};

const login: LoginRequest = {
  email: registration.email,
  password: registration.password,
};

describe('AuthService', () => {
  it('registers, logs in, authenticates, and revokes a session', async () => {
    const repository = new MemoryAuthRepository();
    const service = new AuthService(repository);

    const user = await service.register(registration);
    expect(user.email).toBe(registration.email);

    const session = await service.login(login);
    expect(session.token).toHaveLength(43);
    await expect(service.authenticate(session.token)).resolves.toEqual(user);

    await service.logout(session.token);
    await expect(service.authenticate(session.token)).rejects.toMatchObject({
      code: 'AUTH_SESSION_EXPIRED',
    });
  });

  it('does not reveal whether the email or password was incorrect', async () => {
    const service = new AuthService(new MemoryAuthRepository());
    await expect(service.login(login)).rejects.toMatchObject({
      code: 'AUTH_INVALID_CREDENTIALS',
    });
  });

  it('authenticates or auto-provisions a user via Google login', async () => {
    const repository = new MemoryAuthRepository();
    const service = new AuthService(repository);

    const session = await service.loginWithGoogle({
      email: 'budi.google@example.com',
      displayName: 'Budi Google',
    });

    expect(session.user.email).toBe('budi.google@example.com');
    expect(session.user.displayName).toBe('Budi Google');
    expect(session.token).toHaveLength(43);

    // Logging in again with the same Google email should reuse the user
    const secondSession = await service.loginWithGoogle({
      email: 'budi.google@example.com',
    });
    expect(secondSession.user.id).toBe(session.user.id);
  });
});
