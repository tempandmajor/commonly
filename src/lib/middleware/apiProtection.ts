/**
 * API Protection Middleware
 *
 * Provides authentication, authorization, rate limiting, and validation
 * for Next.js API routes and server actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimiter } from '../security';
import { captureException } from '@/config/sentry';
import { UserRole, hasRole } from '../validation/auth';

/**
 * Rate limiter store (in-memory, use Redis in production)
 */
const rateLimiters = new Map<string, RateLimiter>();

/**
 * Get or create rate limiter for a key
 */
function getRateLimiter(key: string, maxRequests: number, windowMs: number): RateLimiter {
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, new RateLimiter(maxRequests, windowMs));
  }
  return rateLimiters.get(key)!;
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  return async function (req: NextRequest): Promise<NextResponse | null> {
    // Get identifier (IP or user ID)
    const identifier = req.headers.get('x-forwarded-for') ||
                      req.headers.get('x-real-ip') ||
                      'unknown';

    const limiter = getRateLimiter(identifier, maxRequests, windowMs);

    if (!limiter.isAllowed()) {
      const resetTime = limiter.getTimeUntilReset();
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(resetTime / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(resetTime / 1000)),
            'X-RateLimit-Limit': String(maxRequests) as string,
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() as string + resetTime),
          },
        }
      );
    }

    return null; // Continue to next middleware/handler
  };
}

/**
 * Authentication middleware
 * Verifies user is logged in
 */
export function withAuth() {
  return async function (req: NextRequest): Promise<NextResponse | null> {
    // Get session from cookie or header
    const sessionToken = req.cookies.get('session')?.value ||
                        req.headers.get('authorization')?.replace('Bearer ', '');

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify session (implement your session validation logic)
    // This is a placeholder - implement with your auth system
    try {
      // const session = await verifySession(sessionToken);
      // req.user = session.user;
      return null; // Continue
    } catch (error) {
      captureException(error as Error, { context: 'Authentication middleware' });
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }
  };
}

/**
 * Authorization middleware
 * Verifies user has required role
 */
export function withRole(requiredRole: UserRole) {
  return async function (req: NextRequest): Promise<NextResponse | null> {
    // Get user from request (set by withAuth middleware)
    const user = (req as any).user;

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!hasRole(user.role, requiredRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return null; // Continue
  };
}

/**
 * Request validation middleware
 * Validates request body against Zod schema
 */
export function withValidation<T extends z.ZodType>(schema: T) {
  return async function (req: NextRequest): Promise<NextResponse | null> {
    try {
      const body = await req.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: result.error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }

      // Attach validated data to request
      (req as any).validatedData = result.data;
      return null; // Continue
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
  };
}

/**
 * CORS middleware
 */
export function withCORS(allowedOrigins: string[] = []) {
  return async function (req: NextRequest): Promise<NextResponse | null> {
    const origin = req.headers.get('origin');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Check origin
    if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { error: 'CORS policy violation' },
        { status: 403 }
      );
    }

    return null; // Continue
  };
}

/**
 * Error handling middleware
 */
export function withErrorHandling() {
  return async function (
    handler: (req: NextRequest) => Promise<NextResponse>,
    req: NextRequest
  ): Promise<NextResponse> {
    try {
      return await handler(req);
    } catch (error) {
      console.error('API Error:', error);
      captureException(error as Error, {
        url: req.url,
        method: req.method,
      });

      return NextResponse.json(
        {
          error: 'Internal server error',
          message: process.env.NODE_ENV as string === 'development'
            ? (error as Error).message
            : 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(
          ...middlewares: Array<(req: NextRequest) => Promise<NextResponse | null>>
) {
  return async function (req: NextRequest): Promise<NextResponse | null> {
    for (const middleware of middlewares) {
      const response = await middleware(req);
      if (response) {
        return response; // Stop if middleware returns a response
      }
    }
    return null; // All middleware passed
  };
}

/**
 * Idempotency middleware
 * Prevents duplicate requests using idempotency keys
 */
const idempotencyStore = new Map<string, { response: any; expiresAt: number }>();

export function withIdempotency() {
  return async function (req: NextRequest): Promise<NextResponse | null> {
    const idempotencyKey = req.headers.get('idempotency-key');

    if (!idempotencyKey) {
      return null; // No idempotency key, continue
    }

    // Check if we've seen this key before
    const cached = idempotencyStore.get(idempotencyKey);
    if (cached && cached.expiresAt > Date.now()) {
      // Return cached response
      return NextResponse.json(cached!.response);
    }

    // Clean up expired keys
    for (const [key, value] of idempotencyStore.entries()) {
      if (value.expiresAt <= Date.now()) {
        idempotencyStore.delete(key);
      }
    }

    // Store key for this request
    (req as any).idempotencyKey = idempotencyKey;
    return null; // Continue
  };
}

/**
 * Store idempotent response
 */
export function storeIdempotentResponse(
  idempotencyKey: string,
  response: any,
  ttlMs: number = 86400000 // 24 hours
): void {
  idempotencyStore.set(idempotencyKey, {
    response,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders() {
  return async function (req: NextRequest): Promise<NextResponse | null> {
    // Security headers will be added to response in the handler
    (req as any).securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
    return null;
  };
}

/**
 * Helper to apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse, req: NextRequest): NextResponse {
  const headers = (req as any).securityHeaders || {};
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value as string);
  }
  return response;
}

/**
 * Example: Protected API route handler
 */
export function createProtectedRoute<T extends z.ZodType>(
  schema: T,
  handler: (req: NextRequest, data: z.infer<T>) => Promise<NextResponse>
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    // Apply middleware
    const middleware = composeMiddleware(
      withRateLimit(100, 60000), // 100 requests per minute
      withAuth(),
      withValidation(schema),
      withSecurityHeaders(),
      withIdempotency()
    );

    const middlewareResponse = await middleware(req);
    if (middlewareResponse) {
      return middlewareResponse; // Middleware blocked request
    }

    try {
      // Call handler with validated data
      const validatedData = (req as any).validatedData;
      const response = await handler(req, validatedData);

      // Apply security headers to response
      return applySecurityHeaders(response, req);
    } catch (error) {
      return withErrorHandling()(handler, req);
    }
  };
}

export default {
  withRateLimit,
  withAuth,
  withRole,
  withValidation,
  withCORS,
  withErrorHandling,
  withIdempotency,
  withSecurityHeaders,
  composeMiddleware,
  createProtectedRoute,
};