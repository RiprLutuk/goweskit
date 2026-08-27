import { describe, expect, it } from 'vitest';

import {
  SAFETY_SHARE_MAX_DURATION_MINUTES,
  SAFETY_SHARE_MIN_DURATION_MINUTES,
  SAFETY_SHARE_TOKEN_BYTES,
  SAFETY_SHARE_TOKEN_LENGTH,
  createSafetyShareExpiry,
  createSafetyShareToken,
  hashSafetyShareToken,
  isSafetyShareExpired,
  isSafetyShareToken,
  issueSafetyShareToken,
} from './token.js';

describe('Ride Safety share tokens', () => {
  it('generates a unique unpadded base64url token with 32 random bytes', () => {
    const tokens = new Set(
      Array.from({ length: 128 }, () => createSafetyShareToken()),
    );
    expect(tokens).toHaveLength(128);
    for (const token of tokens) {
      expect(token).toHaveLength(SAFETY_SHARE_TOKEN_LENGTH);
      expect(isSafetyShareToken(token)).toBe(true);
      expect(token).not.toContain('=');
      expect(Buffer.from(token, 'base64url')).toHaveLength(
        SAFETY_SHARE_TOKEN_BYTES,
      );
    }
  });

  it('hashes the raw token with SHA-256 for storage', () => {
    expect(hashSafetyShareToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(hashSafetyShareToken('abc')).toHaveLength(64);
    expect(hashSafetyShareToken('abc')).not.toContain('abc');
  });

  it('issues the raw token separately from its hash-only storage value', () => {
    const now = new Date('2026-08-27T10:00:00.000Z');
    const issued = issueSafetyShareToken(now, 180);
    expect(issued.token).toHaveLength(SAFETY_SHARE_TOKEN_LENGTH);
    expect(issued.storage).toEqual({
      shareTokenHash: hashSafetyShareToken(issued.token),
      shareExpiresAt: new Date('2026-08-27T13:00:00.000Z'),
    });
    expect(Object.values(issued.storage)).not.toContain(issued.token);
  });

  it('requires an integer expiry duration inside the bounded window', () => {
    const now = new Date('2026-08-27T10:00:00.000Z');
    expect(
      createSafetyShareExpiry(now, SAFETY_SHARE_MIN_DURATION_MINUTES),
    ).toEqual(new Date('2026-08-27T10:15:00.000Z'));
    expect(
      createSafetyShareExpiry(now, SAFETY_SHARE_MAX_DURATION_MINUTES),
    ).toEqual(new Date('2026-08-28T10:00:00.000Z'));

    for (const duration of [
      SAFETY_SHARE_MIN_DURATION_MINUTES - 1,
      SAFETY_SHARE_MAX_DURATION_MINUTES + 1,
      15.5,
      Number.NaN,
    ]) {
      expect(() => createSafetyShareExpiry(now, duration)).toThrow(
        'Safety share duration must be an integer',
      );
    }
    expect(() => createSafetyShareExpiry(new Date('invalid'), 60)).toThrow(
      'Safety share start time must be a valid date.',
    );
  });

  it('treats the exact expiry instant as expired', () => {
    const expiresAt = new Date('2026-08-27T13:00:00.000Z');
    expect(
      isSafetyShareExpired(expiresAt, new Date('2026-08-27T12:59:59.999Z')),
    ).toBe(false);
    expect(isSafetyShareExpired(expiresAt, expiresAt)).toBe(true);
    expect(
      isSafetyShareExpired(expiresAt, new Date('2026-08-27T13:00:00.001Z')),
    ).toBe(true);
  });

  it('rejects malformed token shapes before a public lookup', () => {
    expect(isSafetyShareToken('A'.repeat(SAFETY_SHARE_TOKEN_LENGTH))).toBe(
      true,
    );
    expect(isSafetyShareToken('short')).toBe(false);
    expect(isSafetyShareToken(`${'A'.repeat(42)}=`)).toBe(false);
    expect(isSafetyShareToken(`${'A'.repeat(42)}+`)).toBe(false);
  });
});
