import { validateEnvironment, initializeErrorTracking } from './environmentCheck';
import { getEnvironmentConfig } from './environmentConfig';
import * as Sentry from '@sentry/react';

/**
 * Initialize the application environment
 * Sets up error tracking, analytics, and validates required environment variables
 */
export function initializeEnvironment(): void {
  // Check if we're in a production environment
  const isProduction = process.env.NODE_ENV as string === 'production';

  // Validate required environment variables
  const { valid, errors } = validateEnvironment();

  if (!valid) {
    // In production, also report to Sentry
    if (isProduction && process.env.NEXT_PUBLIC_SENTRY_D as string) {
      Sentry.captureMessage(`Environment validation failed: ${errors.join(', ')}`, {
        level: 'error',
        tags: {
          source: 'environment-validation',
        },
      });
    }
  }

  // Initialize error tracking
  initializeErrorTracking();

  // Log environment info
  const envConfig = getEnvironmentConfig();
}

/**
 * Get a required environment variable or throw an error if it's not defined
 * @param key Environment variable key
 * @param fallback Optional fallback value
 * @returns The environment variable value
 */
export function getRequiredEnvVar(key: string, fallback?: string): string {
  const value = import.meta.env[key];

  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }

    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

/**
 * Check if a feature flag is enabled
 * @param flagName Feature flag name
 * @returns Boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(flagName: string): boolean {
  const envVar = `VITE_FEATURE_${flagName.toUpperCase()}`;
  return import.meta.env[envVar] === 'true';
}

/**
 * Get the application URLs configuration
 */
export function getAppUrls(): {
  baseUrl: string;
  apiUrl: string;
  frontendUrl: string;
} {
  const envConfig = getEnvironmentConfig();

  return {
    baseUrl: process.env.NEXT_PUBLIC_BASE_U as string || window.location.origin,
    apiUrl: envConfig.apiUrl || process.env.NEXT_PUBLIC_API_U as string || '',
    frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_U as string || '',
  };
}
