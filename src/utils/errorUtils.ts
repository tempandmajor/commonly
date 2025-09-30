import * as Sentry from '@sentry/react';
import { toast } from 'sonner';
import { getEnvironmentConfig } from '@/utils/environmentConfig';

/**
 * Handles errors consistently across the application
 *
 * @param error The error to handle
 * @param context Additional context information
 * @param userMessage Optional user-facing message
 * @param silent If true, no toast will be shown
 */
export function handleError(
  error: unknown,
  context: Record<string, unknown> = {},
  userMessage?: string,
  silent: boolean = false
): void {
  const errorMessage = error instanceof Error ? error.message : String(error) as string;
  const sentryEnabled = getEnvironmentConfig().sentryEnabled;

  // Log to console
  // Report to Sentry if enabled
  if (sentryEnabled) {
    Sentry.captureException(error, {
      extra: {
          ...context,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Show toast message if not silent
  if (!silent && userMessage) {
    toast.error(userMessage);
  }
}

/**
 * Wrap async functions with consistent error handling
 *
 * @param promise Promise to handle
 * @param errorMessage User-facing error message
 * @param context Additional context information
 * @param silent If true, no toast will be shown
 */
export async function withErrorHandling<T>(
  promise: Promise<T>,
  errorMessage: string = 'Something went wrong. Please try again.',
  context: Record<string, unknown> = {},
  silent: boolean = false
): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    handleError(error, context, errorMessage, silent);
    return null;
  }
}

/**
 * Create a wrapped version of a function with error handling
 *
 * @param fn Function to wrap
 * @param errorMessage User-facing error message
 * @param context Additional context information
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<any>>(
  fn: T,
  errorMessage: string = 'Something went wrong. Please try again.',
  context: Record<string, unknown> = {}
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, { ...context, functionArgs: args }, errorMessage);
      return null;
    }
  };
}

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  context?: Record<string, unknown>;
  code?: string;

  constructor(message: string, code?: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
