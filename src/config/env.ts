/**
 * Environment Variable Validation and Configuration
 *
 * This module validates all required environment variables at startup
 * and provides type-safe access to configuration values.
 *
 * FAIL-FAST PRINCIPLE: If required env vars are missing, the app will
 * not start. This prevents runtime errors in production.
 */

import { z } from 'zod';

/**
 * Environment validation schema using Zod
 *
 * REQUIRED: These variables MUST be set or the app will not start
 * OPTIONAL: These variables have defaults or are not critical
 */
const envSchema = z.object({
  // Core Application - REQUIRED
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),

  // Google Maps - REQUIRED for location features
  NEXT_PUBLIC_GOOGLE_API_KEY: z.string().min(1, 'Google API key is required'),

  // Cloudinary - REQUIRED for image uploads
  NEXT_PUBLIC_CLOUDINARY_PRESET: z.string().min(1, 'Cloudinary preset is required'),
  NEXT_PUBLIC_CLOUDINARY_NAME: z.string().min(1, 'Cloudinary name is required'),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().min(1, 'Cloudinary API key is required'),

  // Stripe - REQUIRED for payments
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Invalid Stripe publishable key'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Stripe secret key').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Invalid Stripe webhook secret').optional(),

  // Optional - API URLs
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_FRONTEND_URL: z.string().url().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),

  // Optional - Supabase
  NEXT_PUBLIC_SUPABASE_PROJECT_ID: z.string().optional(),

  // Optional - LiveKit for real-time features
  NEXT_PUBLIC_LIVEKIT_URL: z.string().url().optional(),
  NEXT_PUBLIC_LIVEKIT_API_KEY: z.string().optional(),
  NEXT_PUBLIC_LIVEKIT_API_SECRET: z.string().optional(),

  // Optional - OpenAI
  NEXT_PUBLIC_OPENAI_API_KEY: z.string().optional(),

  // Optional - Sentry for error tracking
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Optional - Feature flags
  NEXT_PUBLIC_USE_MOCKS: z.enum(['true', 'false']).optional().default('false'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.enum(['true', 'false']).optional().default('false'),
  NEXT_PUBLIC_DEBUG_MODE: z.enum(['true', 'false']).optional().default('false'),

  // Optional - Admin
  NEXT_PUBLIC_ADMIN_ACCESS_CODE: z.string().optional(),

  // Optional - Build info
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  NEXT_PUBLIC_BUILD_TIMESTAMP: z.string().optional(),
  NEXT_PUBLIC_COMMIT_HASH: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),

  // Optional - Database URL (for migrations)
  DATABASE_URL: z.string().optional(),
});

/**
 * Parsed and validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at startup
 *
 * This function will throw an error if required variables are missing
 * or invalid. This ensures the app fails fast at startup rather than
 * at runtime when trying to use missing configuration.
 */
function validateEnv(): Env {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL as string,
    NEXT_PUBLIC_GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    NEXT_PUBLIC_CLOUDINARY_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET as string,
    NEXT_PUBLIC_CLOUDINARY_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_NAME as string,
    NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY as string,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL as string,
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL as string,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL as string,
    NEXT_PUBLIC_SUPABASE_PROJECT_ID: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID as string,
    NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL as string,
    NEXT_PUBLIC_LIVEKIT_API_KEY: process.env.NEXT_PUBLIC_LIVEKIT_API_KEY as string,
    NEXT_PUBLIC_LIVEKIT_API_SECRET: process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET as string,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY as string,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN as string,
    SENTRY_ORG: process.env.SENTRY_ORG as string,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT as string,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN as string,
    NEXT_PUBLIC_USE_MOCKS: process.env.NEXT_PUBLIC_USE_MOCKS as string,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS as string,
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE as string,
    NEXT_PUBLIC_ADMIN_ACCESS_CODE: process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE as string,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION as string,
    NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP as string,
    NEXT_PUBLIC_COMMIT_HASH: process.env.NEXT_PUBLIC_COMMIT_HASH as string,
    NODE_ENV: process.env.NODE_ENV as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
  };

  try {
    const validated = envSchema.parse(env);

    // Log successful validation in development
    if (validated.NODE_ENV === 'development') {
      console.log('✅ Environment variables validated successfully');
    }

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      console.error('');

      error.errors.forEach((err) => {
        console.error(`  • ${err.path.join('.')}: ${err.message}`);
      });

      console.error('');
      console.error('Please check your environment variables and try again.');
      console.error('See .env.example for required variables.');
      console.error('');

      // In production, fail fast
      if (process.env.NODE_ENV as string === 'production') {
        throw new Error('Environment validation failed. Cannot start application.');
      }
    }

    throw error;
  }
}

/**
 * Validated environment configuration
 *
 * Import this in your app to get type-safe access to env vars
 *
 * @example
 * import { env } from '@/config/env';
 * console.log(env.NEXT_PUBLIC_SUPABASE_URL);
 */
export const env = validateEnv();

/**
 * Utility to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Utility to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Utility to check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Utility to check if debug mode is enabled
 */
export const isDebugMode = env.NEXT_PUBLIC_DEBUG_MODE === 'true';

/**
 * Utility to check if analytics is enabled
 */
export const isAnalyticsEnabled = env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';

/**
 * Utility to check if mocks are enabled
 */
export const useMocks = env.NEXT_PUBLIC_USE_MOCKS === 'true';