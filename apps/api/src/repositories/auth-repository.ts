import type { User } from '@goweskit/contracts';
import { and, eq, gt } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import { sessions, users } from '../db/schema.js';
import { decryptText, encryptText } from '../crypto/encryption.js';

export interface StoredUser extends User {
  googleSubject: string | null;
  passwordHash: string | null;
}

export interface CreateUserInput {
  displayName: string;
  email: string;
  passwordHash: string;
}

export interface AuthRepository {
  createUser(input: CreateUserInput): Promise<StoredUser | null>;
  createGoogleUser(input: {
    displayName: string;
    email: string;
    googleSubject: string;
  }): Promise<StoredUser | null>;
  findUserByEmail(email: string): Promise<StoredUser | null>;
  findUserByGoogleSubject(subject: string): Promise<StoredUser | null>;
  createSession(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
  findUserBySession(tokenHash: string, now: Date): Promise<User | null>;
  deleteSession(tokenHash: string): Promise<void>;
}

function toStoredUser(row: typeof users.$inferSelect): StoredUser {
  return {
    id: row.id,
    displayName: decryptText(row.displayName),
    email: row.email,
    googleSubject: row.googleSubject,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}

export class DrizzleAuthRepository implements AuthRepository {
  public constructor(private readonly database: Database) {}

  public async createUser(input: CreateUserInput): Promise<StoredUser | null> {
    try {
      const [created] = await this.database
        .insert(users)
        .values({
          ...input,
          displayName: encryptText(input.displayName),
        })
        .returning();
      return created === undefined ? null : toStoredUser(created);
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        return null;
      }
      throw error;
    }
  }

  public async findUserByEmail(email: string): Promise<StoredUser | null> {
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user === undefined ? null : toStoredUser(user);
  }

  public async findUserByGoogleSubject(
    subject: string,
  ): Promise<StoredUser | null> {
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.googleSubject, subject))
      .limit(1);
    return user === undefined ? null : toStoredUser(user);
  }

  public async createGoogleUser(input: {
    displayName: string;
    email: string;
    googleSubject: string;
  }): Promise<StoredUser | null> {
    try {
      const [created] = await this.database
        .insert(users)
        .values({
          ...input,
          displayName: encryptText(input.displayName),
          passwordHash: null,
        })
        .returning();
      return created === undefined ? null : toStoredUser(created);
    } catch (error: unknown) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  public async createSession(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.database
      .insert(sessions)
      .values({ userId, tokenHash, expiresAt });
  }

  public async findUserBySession(
    tokenHash: string,
    now: Date,
  ): Promise<User | null> {
    const [row] = await this.database
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)),
      )
      .limit(1);

    if (row === undefined) {
      return null;
    }

    return {
      id: row.user.id,
      displayName: decryptText(row.user.displayName),
      email: row.user.email,
      createdAt: row.user.createdAt.toISOString(),
    };
  }

  public async deleteSession(tokenHash: string): Promise<void> {
    await this.database
      .delete(sessions)
      .where(eq(sessions.tokenHash, tokenHash));
  }
}
