import { describe, expect, it } from 'vitest';

import { SafetyPublicRateLimiter } from './rate-limiter.js';

describe('SafetyPublicRateLimiter', () => {
  it('blocks repeated requests by requester key until the bounded window resets', () => {
    const limiter = new SafetyPublicRateLimiter(2, 60);
    const start = new Date('2026-08-27T10:00:00.000Z');

    expect(limiter.consume('ip-1', start).allowed).toBe(true);
    expect(limiter.consume('ip-1', start).allowed).toBe(true);
    expect(limiter.consume('ip-1', start)).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(
      limiter.consume('ip-1', new Date('2026-08-27T10:01:00.000Z')).allowed,
    ).toBe(true);
  });

  it('isolates requester keys and clears expired buckets', () => {
    const limiter = new SafetyPublicRateLimiter(1, 10);
    const start = new Date('2026-08-27T10:00:00.000Z');

    expect(limiter.consume('ip-1', start).allowed).toBe(true);
    expect(limiter.consume('ip-2', start).allowed).toBe(true);
    expect(limiter.clearExpired(new Date('2026-08-27T10:00:10.000Z'))).toBe(2);
  });
});
