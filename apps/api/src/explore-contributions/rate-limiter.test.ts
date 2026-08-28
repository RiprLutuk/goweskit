import type { FastifyRequest } from 'fastify';
import { describe, expect, it } from 'vitest';

import { ExploreContributionHttpError } from './http-errors.js';
import { ExploreContributionRateLimiter } from './rate-limiter.js';

const request = {} as FastifyRequest;

describe('ExploreContributionRateLimiter', () => {
  it('enforces scope-specific windows with retry details', async () => {
    const now = new Date('2026-08-28T00:00:00.000Z');
    const limiter = new ExploreContributionRateLimiter(10, () => now, {
      contribution_submit: { maxRequests: 1, windowSeconds: 60 },
      gpx_import: { maxRequests: 1, windowSeconds: 60 },
      moderation: { maxRequests: 1, windowSeconds: 60 },
      public_contribution_read: { maxRequests: 1, windowSeconds: 60 },
    });
    const input = {
      scope: 'contribution_submit' as const,
      key: 'user-1',
      request,
    };

    await expect(limiter.enforce(input)).resolves.toBeUndefined();
    await expect(limiter.enforce(input)).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      statusCode: 429,
      details: { retryAfterSeconds: 60 },
    });
  });

  it('keeps memory bounded and removes expired buckets', async () => {
    let now = new Date('2026-08-28T00:00:00.000Z');
    const limiter = new ExploreContributionRateLimiter(2, () => now);
    for (const key of ['one', 'two', 'three']) {
      await limiter.enforce({
        scope: 'public_contribution_read',
        key,
        request,
      });
    }
    expect(limiter.size()).toBe(2);

    now = new Date('2026-08-28T00:02:00.000Z');
    await limiter.enforce({
      scope: 'public_contribution_read',
      key: 'four',
      request,
    });
    expect(limiter.size()).toBe(1);
  });

  it('rejects an invalid capacity', () => {
    expect(() => new ExploreContributionRateLimiter(0)).toThrow(
      'capacity is invalid',
    );
    expect(
      () => new ExploreContributionHttpError('RATE_LIMITED', 'Limited.', 429),
    ).not.toThrow();
  });
});
