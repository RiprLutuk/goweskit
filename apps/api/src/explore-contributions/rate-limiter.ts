import type { FastifyRequest } from 'fastify';

import { ExploreContributionHttpError } from './http-errors.js';
import type {
  ExploreContributionRateLimitPolicy,
  ExploreContributionRateLimitScope,
} from './routes.js';

interface RateLimitBucket {
  count: number;
  resetsAt: number;
}

interface RateLimitRule {
  maxRequests: number;
  windowSeconds: number;
}

const DEFAULT_RULES: Record<ExploreContributionRateLimitScope, RateLimitRule> =
  {
    contribution_submit: { maxRequests: 12, windowSeconds: 15 * 60 },
    gpx_import: { maxRequests: 5, windowSeconds: 15 * 60 },
    moderation: { maxRequests: 60, windowSeconds: 15 * 60 },
    public_contribution_read: { maxRequests: 120, windowSeconds: 60 },
  };

export class ExploreContributionRateLimiter implements ExploreContributionRateLimitPolicy {
  private readonly buckets = new Map<string, RateLimitBucket>();

  public constructor(
    private readonly maxBuckets = 10_000,
    private readonly clock: () => Date = () => new Date(),
    private readonly rules = DEFAULT_RULES,
  ) {
    if (!Number.isInteger(maxBuckets) || maxBuckets < 1) {
      throw new Error('Explore contribution rate limit capacity is invalid.');
    }
  }

  public enforce(input: {
    scope: ExploreContributionRateLimitScope;
    key: string;
    request: FastifyRequest;
  }): Promise<void> {
    const rule = this.rules[input.scope];
    const now = this.clock().getTime();
    if (Number.isNaN(now)) {
      return Promise.reject(new Error('Rate limit time must be valid.'));
    }
    const bucketKey = `${input.scope}:${input.key}`;
    const current = this.buckets.get(bucketKey);
    if (current === undefined || now >= current.resetsAt) {
      this.ensureCapacity(now, bucketKey);
      this.buckets.set(bucketKey, {
        count: 1,
        resetsAt: now + rule.windowSeconds * 1_000,
      });
      return Promise.resolve();
    }
    if (current.count >= rule.maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((current.resetsAt - now) / 1_000),
      );
      return Promise.reject(
        new ExploreContributionHttpError(
          'RATE_LIMITED',
          'Too many Explore requests. Try again shortly.',
          429,
          { retryAfterSeconds },
        ),
      );
    }
    current.count += 1;
    return Promise.resolve();
  }

  public size(): number {
    return this.buckets.size;
  }

  private ensureCapacity(now: number, incomingKey: string): void {
    if (this.buckets.has(incomingKey)) return;
    for (const [key, bucket] of this.buckets) {
      if (now >= bucket.resetsAt) this.buckets.delete(key);
    }
    if (this.buckets.size < this.maxBuckets) return;
    const oldestKey = this.buckets.keys().next().value;
    if (oldestKey !== undefined) this.buckets.delete(oldestKey);
  }
}
