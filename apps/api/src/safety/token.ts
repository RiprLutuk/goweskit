import { createHash, randomBytes } from 'node:crypto';

export const SAFETY_SHARE_TOKEN_BYTES = 32;
export const SAFETY_SHARE_TOKEN_LENGTH = 43;
export const SAFETY_SHARE_MIN_DURATION_MINUTES = 15;
export const SAFETY_SHARE_MAX_DURATION_MINUTES = 24 * 60;

const MILLISECONDS_PER_MINUTE = 60_000;
const SAFETY_SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

export interface StoredSafetyShareToken {
  shareTokenHash: string;
  shareExpiresAt: Date;
}

export interface IssuedSafetyShareToken {
  token: string;
  storage: StoredSafetyShareToken;
}

export function createSafetyShareToken(): string {
  return randomBytes(SAFETY_SHARE_TOKEN_BYTES).toString('base64url');
}

export function isSafetyShareToken(value: string): boolean {
  return SAFETY_SHARE_TOKEN_PATTERN.test(value);
}

export function hashSafetyShareToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSafetyShareExpiry(
  now: Date,
  durationMinutes: number,
): Date {
  if (Number.isNaN(now.getTime())) {
    throw new Error('Safety share start time must be a valid date.');
  }
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < SAFETY_SHARE_MIN_DURATION_MINUTES ||
    durationMinutes > SAFETY_SHARE_MAX_DURATION_MINUTES
  ) {
    throw new Error(
      `Safety share duration must be an integer from ${String(SAFETY_SHARE_MIN_DURATION_MINUTES)} to ${String(SAFETY_SHARE_MAX_DURATION_MINUTES)} minutes.`,
    );
  }

  return new Date(now.getTime() + durationMinutes * MILLISECONDS_PER_MINUTE);
}

export function issueSafetyShareToken(
  now: Date,
  durationMinutes: number,
): IssuedSafetyShareToken {
  const token = createSafetyShareToken();
  return {
    token,
    storage: {
      shareTokenHash: hashSafetyShareToken(token),
      shareExpiresAt: createSafetyShareExpiry(now, durationMinutes),
    },
  };
}

export function isSafetyShareExpired(expiresAt: Date, now: Date): boolean {
  if (Number.isNaN(expiresAt.getTime()) || Number.isNaN(now.getTime())) {
    throw new Error('Safety share expiry comparison requires valid dates.');
  }
  return now.getTime() >= expiresAt.getTime();
}
