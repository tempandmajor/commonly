/**
 * Payment Service Error Handling Utilities
 *
 * This file contains utilities for handling errors in the Payment Service.
 */

import { safeToast } from '@/services/api/utils/safeToast';
import { PaymentError, PaymentErrorCode } from '../types';

/**
 * Error codes that should be shown to the user
 */
const USER_VISIBLE_ERROR_CODES = [
  PaymentErrorCode.CardDeclined,
  PaymentErrorCode.ExpiredCard,
  PaymentErrorCode.IncorrectCVC,
  PaymentErrorCode.InsufficientFunds,
  PaymentErrorCode.InvalidCard,
];

/**
 * Check if an error is a payment error
 *
 * @param error - Error to check
 * @returns True if the error is a payment error
 */
export const isPaymentError = (error: unknown): error is PaymentError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as PaymentError).code === 'string' &&
    'message' in error &&
    typeof (error as PaymentError).message === 'string'
  );
};

/**
 * Format a payment error message for display
 *
 * @param error - Payment error
 * @returns Formatted error message
 */
export const formatPaymentErrorMessage = (error: PaymentError): string => {
  switch (error.code) {
    case PaymentErrorCode.CardDeclined:
      return 'Your card was declined. Please try another payment method.';
    case PaymentErrorCode.ExpiredCard:
      return 'Your card has expired. Please use a different card.';
    case PaymentErrorCode.IncorrectCVC:
      return "Your card's security code is incorrect. Please check and try again.";
    case PaymentErrorCode.InsufficientFunds:
      return 'Your card has insufficient funds. Please use a different payment method.';
    case PaymentErrorCode.InvalidCard:
      return 'Your card information is invalid. Please check and try again.';
    case PaymentErrorCode.ProcessingError:
      return 'An error occurred while processing your payment. Please try again later.';
    case PaymentErrorCode.RateLimit:
      return 'Too many payment attempts. Please wait a moment and try again.';
    default:
      return error.message || 'An unknown payment error occurred.';
  }
};

/**
 * Handle an API error
 *
 * @param message - Error message prefix
 * @param error - Error object
 * @param defaultValue - Default value to return on error
 * @returns Default value or throws error
 */
export const handleApiError = <T>(message: string, error: unknown, defaultValue?: T): T => {
  console.error(`${message}:`, error);

  // Handle payment errors
  if (isPaymentError(error)) {
    const formattedMessage = formatPaymentErrorMessage(error);

    // Only show toast for user-visible errors
    if (USER_VISIBLE_ERROR_CODES.includes(error.code)) {
      safeToast.error(formattedMessage);
    }

    // If default value is provided, return it instead of throwing
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(formattedMessage);
  }

  // Handle other errors
  const errorMessage = error instanceof Error ? error.message : String(error) as string;
  const fullMessage = `${message}: ${errorMessage}`;

  // Only show toast for non-payment errors if no default value is provided
  if (defaultValue === undefined) {
    safeToast.error(fullMessage);
  }

  // If default value is provided, return it instead of throwing
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  throw new Error(fullMessage);
};
