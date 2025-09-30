import * as Sentry from '@sentry/react';

/**
 * Configuration for a retry operation
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  jitter?: boolean | undefined; // Add some randomness to the delay
}

/**
 * Retry a promise-based operation with exponential backoff
 *
 * @param operation Function that returns a promise
 * @param config Retry configuration
 * @param errorContext Additional context for error tracking
 * @returns Promise with the result or throws an error after all retries fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = { maxRetries: 3, initialDelayMs: 300, jitter: true },
  errorContext: Record<string, unknown> = {}
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // If this is the last attempt, don't retry
      if (attempt === config.maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = config.initialDelayMs * Math.pow(2, attempt);
      // Add jitter if configured
      const jitterAmount = config.jitter ? Math.random() * 0.3 * delay : 0;
      const finalDelay = delay + jitterAmount;

      // Log retry attempt

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  // All retries failed, log the error with context and throw
  Sentry.captureException(lastError, {
    extra: {
          ...errorContext,
      retryAttempts: config.maxRetries,
      finalAttempt: true,
    },
  });

  throw lastError;
}

/**
 * Process API response with proper error handling
 */
export async function processApiResponse<T>(
  response: Response,
  errorContext: Record<string, unknown> = {}
): Promise<T> {
  if (!response.ok) {
    // Try to parse error response if possible
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { status: response.status, statusText: response.statusText };
    }

    // Log the error
    Sentry.captureException(new Error(`API request failed: ${response.status}`), {
      extra: {
          ...errorContext,
        status: response.status,
        statusText: response.statusText,
        errorData,
      },
    });

    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Make an API request with retry capability
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  retryConfig?: RetryConfig,
  errorContext: Record<string, unknown> = {}
): Promise<T> {
  return withRetry(
    async () => {
      const response = await fetch(url, options);
      return processApiResponse<T>(response, errorContext);
    },
    retryConfig,
    {
      url,
      method: options.method || 'GET',
          ...errorContext,
    }
  );
}
