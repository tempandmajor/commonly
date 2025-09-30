/**
 * Error handling utilities for the Event Service
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Handle API errors in a consistent way
 * @param message - Custom error message
 * @param error - The original error
 * @param defaultValue - Optional default value to return on error
 * @returns Either throws an error or returns the default value
 */
export function handleApiError<T>(message: string, error: unknown, defaultValue?: T): T {
  // Log the error for debugging
  console.error(`${message}:`, error);

  // Format the error message
  let errorMessage = message;
  if (error instanceof Error) {
    errorMessage += `: ${error.message}`;
  } else if (typeof error === 'object' && error !== null) {
    const postgrestError = error as PostgrestError;
    if (postgrestError.message) {
      errorMessage += `: ${postgrestError.message}`;
    }
    if (postgrestError.details) {
      errorMessage += ` (${postgrestError.details})`;
    }
  }

  // If a default value is provided, return it instead of throwing
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  // Otherwise throw the error
  throw new Error(errorMessage);
}

/**
 * Format validation errors
 * @param errors - Object containing validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  return Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join(', ');
}

/**
 * Check if an error is a specific type
 * @param error - The error to check
 * @param code - The error code to check for
 * @returns True if the error matches the code
 */
export function isErrorCode(error: unknown, code: string): boolean {
  if (typeof error === 'object' && error !== null) {
    const postgrestError = error as PostgrestError;
    return postgrestError.code === code;
  }
  return false;
}

/**
 * Check if an error is a not found error
 * @param error - The error to check
 * @returns True if the error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  return isErrorCode(error, 'PGRST116');
}

/**
 * Check if an error is a foreign key violation
 * @param error - The error to check
 * @returns True if the error is a foreign key violation
 */
export function isForeignKeyViolation(error: unknown): boolean {
  return isErrorCode(error, '23503');
}

/**
 * Check if an error is a unique constraint violation
 * @param error - The error to check
 * @returns True if the error is a unique constraint violation
 */
export function isUniqueConstraintViolation(error: unknown): boolean {
  return isErrorCode(error, '23505');
}
