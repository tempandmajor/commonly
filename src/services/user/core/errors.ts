/**
 * @file Error handling utilities for user service
 */

import { UserError, UserErrorType } from './types';

/**
 * Create a standardized user error
 * @param type The type of error
 * @param message User-friendly error message
 * @param originalError The original error object if available
 * @returns A standardized user error
 */
export function createUserError(
  type: UserErrorType,
  message: string,
  originalError?: unknown
): UserError {
  return {
    type,
    message,
    originalError,
  };
}

/**
 * Handle user service errors consistently
 * @param error The error to handle
 * @param defaultMessage Default error message if one can't be determined
 * @returns A standardized user error
 */
export function handleUserError(error: unknown, defaultMessage = 'An error occurred'): UserError {
  // If it's already a UserError, return it
  if (typeof error === 'object' && error !== null && 'type' in error && 'message' in error) {
    return error as UserError;
  }

  // Handle specific error types
  if (error instanceof Error) {
    // Check for authentication errors
    if (
      error.message.includes('auth') ||
      error.message.includes('token') ||
      error.message.includes('login')
    ) {
      return createUserError(UserErrorType.AUTH_ERROR, error.message, error);
    }

    // Check for not found errors
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return createUserError(UserErrorType.NOT_FOUND, error.message, error);
    }

    // Check for permission errors
    if (error.message.includes('permission') || error.message.includes('access')) {
      return createUserError(UserErrorType.PERMISSION_DENIED, error.message, error);
    }

    // Check for validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return createUserError(UserErrorType.VALIDATION_ERROR, error.message, error);
    }

    // Check for storage errors
    if (error.message.includes('upload') || error.message.includes('storage')) {
      return createUserError(UserErrorType.STORAGE_ERROR, error.message, error);
    }

    return createUserError(UserErrorType.UNKNOWN_ERROR, error.message, error);
  }

  // For string errors
  if (typeof error === 'string') {
    return createUserError(UserErrorType.UNKNOWN_ERROR, error);
  }

  // Default case
  return createUserError(UserErrorType.UNKNOWN_ERROR, defaultMessage, error);
}

/**
 * Log user service error details
 * @param error The error to log
 * @param context Additional context information
 */
export function logUserError(error: unknown, context?: string): void {
  const errorContext = context ? `[${context}]` : '';
  if (error instanceof Error) {
  }
}

/**
 * Check if an error is of a specific user error type
 * @param error The error to check
 * @param type The error type to check for
 * @returns True if the error is of the specified type
 */
export function isUserErrorType(error: unknown, type: UserErrorType): boolean {
  if (typeof error === 'object' && error !== null && 'type' in error) {
    return (error as UserError).type === type;
  }
  return false;
}
