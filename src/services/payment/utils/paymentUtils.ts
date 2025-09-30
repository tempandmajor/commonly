import { PaymentResult, PaymentStatus } from '../types';
import { safeToast } from '@/services/api/utils/safeToast';
import { updatePaymentRecord } from './paymentRecord';
import { createRetryHandler } from '@/utils/supabaseErrorHandling';

/**
 * Payment utility functions
 */

/**
 * Handle payment errors consistently
 *
 * @param error The error object
 * @param options Additional options for error handling
 * @returns PaymentResult with error details
 */
export const handlePaymentError = (
  error: unknown,
  options: { silent?: boolean } = {}
): PaymentResult => {
  const errorMessage =
    error instanceof Error ? error.message : 'An error occurred processing the payment';
  if (!options.silent) {
    safeToast.error(errorMessage);
  }

  return {
    success: false,
    error: errorMessage,
    redirectUrl: null,
  };
};

/**
 * Update a payment record with a new status
 *
 * @param paymentId The ID of the payment record to update
 * @param status The new payment status
 * @param metadata Optional additional metadata
 * @returns Promise resolved when the update completes
 */
export const updatePaymentStatus = async (
  paymentId: string,
  status: PaymentStatus,
  metadata?: Record<string, unknown>
): Promise<boolean> => {
  try {
    // Use the updatePaymentRecord function to update status
    const retryableUpdate = createRetryHandler(
      async () => await updatePaymentRecord(paymentId, status, metadata),
      2, // max retries
      500 // base delay ms
    );

    return await retryableUpdate();
  } catch (error) {
    return false;
  }
};

/**
 * Helper function to generate timestamp
 */
export const getCurrentTimestamp = () => new Date().toISOString();

/**
 * Validate payment amount
 */
export const validatePaymentAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000; // Max $10,000
};

/**
 * Format payment amount for display
 */
export const formatPaymentAmount = (amountInCents: number): string => {
  return `$${amountInCents / 100}.toFixed(2)}`;
};

/**
 * Create a payment record (placeholder implementation)
 */
export const createPaymentRecord = async (_paymentData: unknown) => {
  try {
    // TODO: Implement proper payment record creation when payment table schema is defined
    safeToast.error('Payment record creation not yet implemented');
    return { success: false, error: 'Not implemented' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
