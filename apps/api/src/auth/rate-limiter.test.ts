import { describe, expect, it } from 'vitest';

import { AuthRateLimiter } from './rate-limiter.js';

describe('AuthRateLimiter', () => {
  it('isolates scopes, reports retry time, and resets expired buckets', () => {
    const limiter = new AuthRateLimiter({
      google: { maxRequests: 1, windowSeconds: 60 },
      login: { maxRequests: 1, windowSeconds: 60 },
      otp: { maxRequests: 1, windowSeconds: 60 },
      register: { maxRequests: 1, windowSeconds: 60 },
    });
    const now = new Date('2026-08-29T04:00:00.000Z');

    expect(limiter.consume('login', 'client', now).allowed).toBe(true);
    expect(limiter.consume('google', 'client', now).allowed).toBe(true);
    expect(limiter.consume('login', 'client', now)).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(
      limiter.consume('login', 'client', new Date(now.getTime() + 60_000))
        .allowed,
    ).toBe(true);
  });

  it('keeps attacker-controlled buckets bounded', () => {
    const limiter = new AuthRateLimiter(undefined, 2);
    const now = new Date('2026-08-29T04:00:00.000Z');
    limiter.consume('login', 'client-1', now);
    limiter.consume('login', 'client-2', now);
    limiter.consume('login', 'client-3', now);
    expect(limiter.size()).toBe(2);
  });
});
