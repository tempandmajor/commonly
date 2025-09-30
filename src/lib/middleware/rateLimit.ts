/**
 * Rate Limiting Middleware
 * Protects API routes and edge functions from abuse
 */

import { logger } from '../logger';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyGenerator?: (req: Request) => string | undefined; // Custom key generator
}

interface RateLimitRecord {
  identifier: string;
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private readonly cleanupInterval = 60000; // 1 minute

  constructor() {
    // Cleanup expired records periodically
    if (typeof window === 'undefined') {
      setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }

  /**
   * Check if request is within rate limit
   */
  public async check(
    identifier: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const record = this.store.get(identifier);

    // No record or expired - create new
    if (!record || record.resetAt < now) {
      const resetAt = now + config.windowMs;
      this.store.set(identifier, {
        identifier,
        count: 1,
        resetAt,
      });

      return {
        allowed: true,
        remaining: config.max - 1,
        resetAt,
      };
    }

    // Increment counter
    record.count++;

    // Check if exceeded
    if (record.count > config.max) {
      logger.warn('Rate limit exceeded', {
        identifier,
        count: record.count,
        max: config.max,
      });

      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
      };
    }

    return {
      allowed: true,
      remaining: config.max - record.count,
      resetAt: record.resetAt,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  public reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Cleanup expired records
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current stats
   */
  public getStats(): {
    totalRecords: number;
    expiredRecords: number;
  } {
    const now = Date.now();
    let expiredCount = 0;

    for (const record of this.store.values()) {
      if (record.resetAt < now) {
        expiredCount++;
      }
    }

    return {
      totalRecords: this.store.size,
      expiredRecords: expiredCount,
    };
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware for API routes
 */
export async function rateLimit(
  req: Request,
  config: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    max: 100, // 100 requests per minute
  }
): Promise<Response | null> {
  try {
    // Generate identifier (IP address or custom key)
    const identifier = config.keyGenerator
      ? config.keyGenerator(req)
      : await getClientIdentifier(req);

    // Check rate limit
    const result = await rateLimiter.check(identifier, config);

    // Set rate limit headers
    const headers = {
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
    };

    // If exceeded, return 429
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
          ...headers,
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Return null to continue (middleware passes)
    return null;
  } catch (error) {
    logger.error('Rate limit check failed', error);
    // On error, allow request to continue
    return null;
  }
}

/**
 * Get client identifier from request
 */
async function getClientIdentifier(req: Request): Promise<string> {
  // Try to get IP from headers (works with most proxies/load balancers)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Try to get authenticated user ID
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // This is a simplified version - in production, verify the token
      return `user:${authHeader.substring(0, 20)}`;
    }
  } catch {
    // Ignore auth errors
  }

  // Fallback to URL as identifier (not ideal but prevents complete failure)
  return `anonymous:${new URL(req.url).pathname}`;
}

/**
 * Rate limit by authenticated user
 */
export async function rateLimitByUser(
  req: Request,
  userId: string,
  config: RateLimitConfig = {
    windowMs: 60000,
    max: 100,
  }
): Promise<Response | null> {
  return rateLimit(req, {
          ...config,
    keyGenerator: () => `user:${userId}`,
  });
}

/**
 * Stricter rate limit for expensive operations
 */
export async function strictRateLimit(req: Request): Promise<Response | null> {
  return rateLimit(req, {
    windowMs: 60000, // 1 minute
    max: 10, // 10 requests per minute
  });
}

/**
 * Rate limit for authentication endpoints
 */
export async function authRateLimit(req: Request): Promise<Response | null> {
  return rateLimit(req, {
    windowMs: 300000, // 5 minutes
    max: 5, // 5 attempts per 5 minutes
  });
}

// Export rate limiter instance for manual control
export { rateLimiter };