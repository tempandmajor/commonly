import * as Sentry from '@sentry/react';
import { env as appEnv } from '@/config/environment';

/**
 * Essential environment variables required for production
 */
const ESSENTIAL_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PROJECT_ID',
];

/**
 * Additional environment variables recommended for production
 */
const RECOMMENDED_ENV_VARS = [
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_GOOGLE_API_KEY',
];

/**
 * Validates that essential environment variables are present
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const isProduction = appEnv.isProduction;

  // Always check essential environment variables
  ESSENTIAL_ENV_VARS.forEach(key => {
    const val = (process.env as any)[key];
    if (!val) {
      errors.push(`Missing essential environment variable: ${key}`);
    }
  });

  // In production, check recommended variables as well
  if (isProduction) {
    RECOMMENDED_ENV_VARS.forEach(key => {
      const val = (process.env as any)[key];
      if (!val) {
        errors.push(`Missing recommended environment variable for production: ${key}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get the environment name from mode
 */
export function getEnvironmentName(): string {
  const envMode = appEnv.environment || 'development';

  if (envMode === 'production') {
    return 'production';
  } else if (envMode === 'staging') {
    return 'staging';
  } else {
    return 'development';
  }
}

/**
 * Generate a deployment readiness report
 */
export function getDeploymentReadinessReport(): {
  ready: boolean;
  issues: string[];
  recommendations: string[];
} {
  const envValidation = validateEnvironment();
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check environment variables
  if (!envValidation.valid) {
    issues.push(...envValidation.errors);
  }

  // Check for Stripe API keys in production
  if (getEnvironmentName() === 'production') {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_K as string && !appEnv.stripe.publishableKey) {
      issues.push('Missing Stripe publishable key for production');
      recommendations.push('Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment');
    }

    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_K as string || appEnv.stripe.publishableKey;
    if (pk && pk.startsWith('pk_test_')) {
      issues.push('Using Stripe test keys in production');
      recommendations.push('Replace Stripe test keys with production keys');
    }
  }

  // Check for Sentry DSN in production
  if (
    getEnvironmentName() === 'production' &&
    !process.env.NEXT_PUBLIC_SENTRY_D as string &&
    !appEnv.sentry?.dsn
  ) {
    issues.push('Error monitoring not configured for production');
    recommendations.push('Add NEXT_PUBLIC_SENTRY_DSN to enable error tracking in production');
  }

  return {
    ready: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Initializes error tracking with Sentry if configured
 */
export function initializeErrorTracking(): void {
  const sentryDsn = appEnv.sentry?.dsn;
  const environment = appEnv.environment || 'development';
  const isProduction = environment === 'production';

  if (sentryDsn) {
    try {
      Sentry.init({
        dsn: sentryDsn,
        environment,
        // Set different sample rates based on environment
        tracesSampleRate: isProduction ? 0.2 : 0.1,

        // Limit the number of errors sent to Sentry in development
        maxBreadcrumbs: isProduction ? 100 : 50,

        // Ignore some common errors
        ignoreErrors: [
          // Network errors that aren't actionable
          'Network request failed',
          'Failed to fetch',
          'NetworkError',
          // Third-party plugin/extension errors
          /Chrome-extension/,
          /^ResizeObserver loop/,
        ],
      });
    } catch (error) {}
  } else if (isProduction) {
    // No DSN configured in production
  }
}

/**
 * Checks if required API keys are present for specific features
 */
export function validateFeatureRequirements(feature: 'stripe' | 'maps' | 'livekit'): boolean {
  switch (feature) {
    case 'stripe':
      return !!(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_K as string || appEnv.stripe.publishableKey);
    case 'maps':
      return !!(process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string || appEnv.google.apiKey);
    case 'livekit':
      return !!(
        (process.env.NEXT_PUBLIC_LIVEKIT_URL as string || appEnv.livekit.url) &&
        (process.env.NEXT_PUBLIC_LIVEKIT_API_KEY as string || appEnv.livekit.apiKey)
      );
    default:
      return false;
  }
}
