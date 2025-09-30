import { toast } from 'sonner';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Check if an error is a rate limit or quota exceeded error
 */
export const isQuotaError = (error: PostgrestError | any): boolean => {
  return (
    error?.message?.includes('quota') ||
    error?.message?.includes('storage') ||
    error?.message?.includes('rate limit') ||
    error?.code === 'resource-exhausted' ||
    error?.code === '429'
  );
};

/**
 * Handle Supabase errors consistently
 * @param error The error object from Supabase
 * @param operation Description of the operation that failed
 * @param showToast Whether to show a toast notification
 * @param retryFn Optional retry function to call
 */
export const handleSupabaseError = async (
  error: PostgrestError | any,
  operation: string,
  showToast: boolean = true,
  retryFn?: () => Promise<boolean>
): Promise<void> => {
  if (showToast) {
    if (isQuotaError(error)) {
      toast.error('Service limits exceeded. Please try again later.');
    } else if (error?.code === 'PGRST116') {
      toast.error(`Data not found while trying to ${operation}.`);
    } else {
      toast.error(`Failed to ${operation}. Please try again.`);
    }
  }

  if (retryFn) {
    try {
      await retryFn();
    } catch (retryError) {}
  }
};

/**
 * Create a retry handler for operations that might fail
 * @param operation The operation to retry
 * @param maxRetries Maximum number of retry attempts
 * @param baseDelay Base delay in ms between retries (exponential backoff)
 */
export const createRetryHandler = <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
) => {
  return async (): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };
};
