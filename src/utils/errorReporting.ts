/**
 * Error reporting utility for handling and reporting errors
 */

import { createLogger } from './logger';

const logger = createLogger('ErrorReporting');

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string | undefined;
  action?: string | undefined;
  component?: string | undefined;
  severity?: ErrorSeverity | undefined;
  [key: string]: unknown;
}

export function reportError(error: Error, context?: ErrorContext, severity?: ErrorSeverity) {
  // Log the error locally
  logger.error('Error reported', error, context);

  // In a real app, you might send this to an error reporting service
  // For now, we'll just log it

  return error;
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  errorMessage = 'An error occurred',
  context?: ErrorContext
): Promise<T | null> {
  return promise.catch(err => {
    const error = err instanceof Error ? err : new Error(errorMessage);
    reportError(error, context);
    return null;
  });
}
