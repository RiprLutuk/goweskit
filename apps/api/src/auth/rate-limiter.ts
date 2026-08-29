export type AuthRateLimitScope = 'google' | 'login' | 'otp' | 'register';

interface AuthRateLimitRule {
  maxRequests: number;
  windowSeconds: number;
}

export interface AuthRateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface RateLimitBucket {
  count: number;
  resetsAt: number;
}

export const DEFAULT_AUTH_RATE_LIMIT_RULES: Record<
  AuthRateLimitScope,
  AuthRateLimitRule
> = {
  google: { maxRequests: 10, windowSeconds: 15 * 60 },
  login: { maxRequests: 10, windowSeconds: 15 * 60 },
  otp: { maxRequests: 5, windowSeconds: 15 * 60 },
  register: { maxRequests: 5, windowSeconds: 60 * 60 },
};

export class AuthRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  public constructor(
    private readonly rules = DEFAULT_AUTH_RATE_LIMIT_RULES,
    private readonly maxBuckets = 10_000,
  ) {
    if (!Number.isInteger(maxBuckets) || maxBuckets < 1) {
      throw new Error('Auth rate limit capacity is invalid.');
    }
  }

  public consume(
    scope: AuthRateLimitScope,
    requesterKey: string,
    now: Date,
  ): AuthRateLimitDecision {
    const nowMs = now.getTime();
    if (Number.isNaN(nowMs)) throw new Error('Rate limit time must be valid.');
    const rule = this.rules[scope];
    const bucketKey = `${scope}:${requesterKey}`;
    const current = this.buckets.get(bucketKey);
    if (current === undefined || nowMs >= current.resetsAt) {
      this.ensureCapacity(nowMs, bucketKey);
      this.buckets.set(bucketKey, {
        count: 1,
        resetsAt: nowMs + rule.windowSeconds * 1_000,
      });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (current.count >= rule.maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((current.resetsAt - nowMs) / 1_000),
        ),
      };
    }
    current.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  public size(): number {
    return this.buckets.size;
  }

  private ensureCapacity(nowMs: number, incomingKey: string): void {
    if (this.buckets.has(incomingKey)) return;
    for (const [key, bucket] of this.buckets) {
      if (nowMs >= bucket.resetsAt) this.buckets.delete(key);
    }
    if (this.buckets.size < this.maxBuckets) return;
    const oldestKey = this.buckets.keys().next().value;
    if (oldestKey !== undefined) this.buckets.delete(oldestKey);
  }
}
