/**
 * @file Error handling utilities for the consolidated payment service
 */

import { safeToast } from '@/services/api/utils/safeToast';
import * as Sentry from '@sentry/react';
import { PaymentError, PaymentErrorType } from './types';

/**
 * Map database or API errors to standardized payment errors
 * @param error The original error
 * @param context Optional context message
 * @returns Standardized payment error
 */
export function mapToPaymentError(
  error: unknown,
  context = 'Payment operation failed'
): PaymentError {
  // Handle Supabase errors
  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as { code?: string; message?: string };

    // Specific error mappings
    if (supabaseError.code === '23503') {
      // Foreign key violation
      return {
        type: PaymentErrorType.WALLET_NOT_FOUND,
        message: 'Wallet or user not found',
        originalError: error,
      };
    }

    if (supabaseError.code === '23514') {
      // Check constraint violation
      return {
        type: PaymentErrorType.INSUFFICIENT_FUNDS,
        message: 'Insufficient funds for this operation',
        originalError: error,
      };
    }

    if (supabaseError.code === '42501') {
      // Permission denied
      return {
        type: PaymentErrorType.AUTHORIZATION_FAILED,
        message: 'You do not have permission to perform this operation',
        originalError: error,
      };
    }
  }

  // Handle Stripe errors
  if (typeof error === 'object' && error !== null && 'type' in error) {
    const stripeError = error as { type: string; message?: string };

    if (stripeError.type === 'StripeCardError') {
      return {
        type: PaymentErrorType.PAYMENT_FAILED,
        message: stripeError.message || 'Card payment failed',
        originalError: error,
      };
    }

    if (stripeError.type === 'StripeInvalidRequestError') {
      return {
        type: PaymentErrorType.INVALID_PAYMENT_METHOD,
        message: stripeError.message || 'Invalid payment details',
        originalError: error,
      };
    }
  }

  // Default to unknown error
  return {
    type: PaymentErrorType.UNKNOWN_ERROR,
    message: typeof error === 'string' ? error : context,
    originalError: error,
  };
}

/**
 * Standard error handler for payment operations
 * @param error The error to handle
 * @param userMessage Optional user-friendly message
 * @param silent If true, suppress toast notifications
 */
export function handlePaymentError(
  error: unknown,
  userMessage?: string,
  silent = false
): PaymentError {
  // Convert to standardized error format
  const paymentError = mapToPaymentError(error, userMessage || 'Payment operation failed');

  // Log all errors
  // Report to Sentry if it's not a user error
  if (
    paymentError.type !== PaymentErrorType.INSUFFICIENT_FUNDS &&
    paymentError.type !== PaymentErrorType.INVALID_PAYMENT_METHOD
  ) {
    Sentry.captureException(error, {
      tags: {
        errorType: paymentError.type,
      },
      extra: {
        message: paymentError.message,
      },
    });
  }

  // Show toast notification if not silent
  if (!silent && userMessage) {
    safeToast.error(userMessage);
  }

  return paymentError;
}

/**
 * Check if an error is a specific payment error type
 * @param error The error to check
 * @param type The payment error type to check against
 */
export function isPaymentErrorType(error: unknown, type: PaymentErrorType): boolean {
  if (typeof error === 'object' && error !== null && 'type' in error) {
    return (error as PaymentError).type === type;
  }
  return false;
}

/**
 * Create a new payment error
 * @param type Error type
 * @param message Error message
 * @param originalError Optional original error
 */
export function createPaymentError(
  type: PaymentErrorType,
  message: string,
  originalError?: unknown
): PaymentError {
  return { type, message, originalError };
}
