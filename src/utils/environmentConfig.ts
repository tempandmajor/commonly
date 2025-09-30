import { env as appEnv } from '@/config/environment';

/**
 * Environment configuration utility
 * Returns a configuration object based on the current environment variables
 */
export function getEnvironmentConfig() {
  return {
    appVersion: appEnv.build.version || '0.1.0',
    environment: appEnv.environment,
    isDev: appEnv.isDevelopment,
    isProd: appEnv.isProduction,
    stripePublicKey: appEnv.stripe.publishableKey,
    sentryEnabled: !!appEnv.sentry?.dsn,
    sentryDSN: appEnv.sentry?.dsn,
    analyticsEnabled: appEnv.features.enableAnalytics,
    gaTrackingId: (process.env.NEXT_PUBLIC_GA_TRACKING as string) || undefined,
    name: appEnv.environment || 'development',
    apiUrl: appEnv.app.apiUrl,
  } as const;
}

/**
 * Get the current environment name
 */
export function getCurrentEnvironment(): string {
  return appEnv.environment || 'development';
}

/**
 * Get collection name based on environment
 * Useful for targeting different collections in development vs production
 */
export function getCollectionName(baseName: string): string {
  const isProd = appEnv.isProduction;
  return isProd ? baseName : `${baseName}_${appEnv.environment || 'dev'}`;
}
