export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface RateLimitBucket {
  count: number;
  resetsAt: number;
}

export class SafetyPublicRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  public constructor(
    private readonly maxRequests: number,
    private readonly windowSeconds: number,
  ) {
    if (!Number.isInteger(maxRequests) || maxRequests < 1) {
      throw new Error('Safety rate limit must allow at least one request.');
    }
    if (!Number.isInteger(windowSeconds) || windowSeconds < 1) {
      throw new Error('Safety rate limit window must be at least one second.');
    }
  }

  public consume(key: string, now: Date): RateLimitDecision {
    const nowMs = now.getTime();
    if (Number.isNaN(nowMs)) throw new Error('Rate limit time must be valid.');
    const current = this.buckets.get(key);
    if (current === undefined || nowMs >= current.resetsAt) {
      this.buckets.set(key, {
        count: 1,
        resetsAt: nowMs + this.windowSeconds * 1000,
      });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (current.count >= this.maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((current.resetsAt - nowMs) / 1000),
        ),
      };
    }
    current.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  public clearExpired(now: Date): number {
    const nowMs = now.getTime();
    if (Number.isNaN(nowMs)) throw new Error('Rate limit time must be valid.');
    let cleared = 0;
    for (const [key, bucket] of this.buckets) {
      if (nowMs >= bucket.resetsAt) {
        this.buckets.delete(key);
        cleared += 1;
      }
    }
    return cleared;
  }
}
