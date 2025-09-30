/**
 * Sentry Configuration for Error Monitoring
 *
 * Configures Sentry for production error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';
import { env, isProduction, isDevelopment } from './env';

/**
 * Initialize Sentry
 *
 * Only initializes if DSN is configured and we're not in development
 */
export function initSentry(): void {
  // Only initialize Sentry if DSN is provided
  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    if (isDevelopment) {
      console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    }
    return;
  }

  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,

    // Set environment
    environment: env.NODE_ENV || 'development',

    // Release tracking
    release: env.NEXT_PUBLIC_APP_VERSION || undefined,

    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, // Sample 10% in production, 100% in dev

    // Session Replay
    replaysSessionSampleRate: isProduction ? 0.1 : 0, // 10% in production, disabled in dev
    replaysOnErrorSampleRate: 1.0, // Always capture replays on errors

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration({
        // Trace these operations
        tracePropagationTargets: [
          'localhost',
          env.NEXT_PUBLIC_APP_URL,
          /^\//,  // Trace relative URLs
        ],
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Error filtering
    beforeSend(event, hint) {
      // Filter out errors in development
      if (isDevelopment) {
        console.error('Sentry would send:', event, hint);
        return null; // Don't send to Sentry in development
      }

      // Filter out specific error types
      const error = hint.originalException;

      // Ignore network errors (they're usually not actionable)
      if (error instanceof Error) {
        if (error.message.includes('NetworkError')) {
          return null;
        }
        if (error.message.includes('Failed to fetch')) {
          return null;
        }
      }

      // Filter out specific known non-critical errors
      const ignoredErrors = [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
      ];

      if (event.message && ignoredErrors.some(msg => event.message.includes(msg))) {
        return null;
      }

      return event;
    },

    // Add user context
    beforeBreadcrumb(breadcrumb) {
      // Don't log console messages in production (too noisy)
      if (isProduction && breadcrumb.category === 'console') {
        return null;
      }
      return breadcrumb;
    },

    // Ignore specific URLs
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Random plugins/extensions
      'Can\'t find variable: webkit',
      'Can\'t find variable: MSStream',
    ],

    // Don't send PII (Personally Identifiable Information)
    sendDefaultPii: false,

    // Set max breadcrumbs
    maxBreadcrumbs: 50,

    // Attach stack traces
    attachStacktrace: true,
  });

  // Set initial context
  Sentry.setContext('app', {
    version: env.NEXT_PUBLIC_APP_VERSION,
    buildTimestamp: env.NEXT_PUBLIC_BUILD_TIMESTAMP,
    commitHash: env.NEXT_PUBLIC_COMMIT_HASH,
  });

  if (isDevelopment) {
    console.log('✅ Sentry initialized (development mode - not sending events)');
  }
}

/**
 * Set user context in Sentry
 *
 * Call this after user authentication to track errors by user
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context in Sentry
 *
 * Call this on logout
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Manually capture an exception
 *
 * Use this for expected errors that you want to track
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): string {
  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Manually capture a message
 *
 * Use this for non-error events you want to track
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
): string {
  return Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Transaction | undefined {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Set custom context
 */
export function setContext(
  name: string,
  context: Record<string, unknown>
): void {
  Sentry.setContext(name, context);
}

/**
 * Set custom tag
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

export default {
  init: initSentry,
  setUser: setSentryUser,
  clearUser: clearSentryUser,
  captureException,
  captureMessage,
  addBreadcrumb,
  startTransaction,
  setContext,
  setTag,
};