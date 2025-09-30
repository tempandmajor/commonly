/**
 * Generic error handling and retry utilities
 */

import { toast } from 'sonner';

export interface RetryOptions {
  maxAttempts?: number | undefined;
  initialDelay?: number | undefined;
  maxDelay?: number | undefined;
  backoffFactor?: number | undefined;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
};

/**
 * Creates a retry handler for async operations
 */
export function createRetryHandler<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): () => Promise<T> {
  const { maxAttempts, initialDelay, maxDelay, backoffFactor } = { ...DEFAULT_OPTIONS, ...options };

  return async function retryOperation(): Promise<T> {
    let lastError: Error | null = null;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts!; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxAttempts) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        // Increase delay for next attempt
        delay = Math.min(delay * backoffFactor!, maxDelay!);
      }
    }

    // If we get here, all attempts failed
    throw lastError;
  };
}

/**
 * Handles errors from async operations with optional user feedback
 */
export async function handleOperationError(
  error: unknown,
  operation: string,
  showToast = true
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error) as string;
  if (showToast) {
    toast.error(`Failed to ${operation}: ${errorMessage}`);
  }
}

/**
 * Categorizes errors for appropriate handling
 */
export enum ErrorCategory {
  Network = 'network',
  Authentication = 'auth',
  Permission = 'permission',
  NotFound = 'not_found',
  Validation = 'validation',
  Unknown = 'unknown',
}

export function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('connection')) {
      return ErrorCategory.Network;
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorCategory.Permission;
    }

    if (message.includes('not found') || message.includes('404')) {
      return ErrorCategory.NotFound;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.Validation;
    }

    if (message.includes('auth') || message.includes('unauthenticated')) {
      return ErrorCategory.Authentication;
    }
  }

  return ErrorCategory.Unknown;
}
