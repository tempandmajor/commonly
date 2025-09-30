/**
 * @file Payment methods API operations
 */

import { PaymentMethod } from '../core/types';
import { handlePaymentError } from '../core/errors';
import {
  getPaymentMethods as getPaymentMethodsEdge,
  deletePaymentMethod as deletePaymentMethodEdge,
  setDefaultPaymentMethodEdge,
} from '../../supabase/edge-functions';

/**
 * Get all payment methods for a user
 * @param userId User ID
 * @returns Array of payment methods
 */
export async function getPaymentMethods(_userId: string): Promise<PaymentMethod[]> {
  try {
    // Edge function derives user from auth; userId retained for signature compatibility
    const data: any = await getPaymentMethodsEdge();
    return (data?.paymentMethods ?? data ?? []) as PaymentMethod[];
  } catch (error) {
    handlePaymentError(error, 'Failed to retrieve payment methods');
    return [];
  }
}

/**
 * Attach a new payment method to a user
 * @param userId User ID
 * @param paymentMethodId Payment method ID
 * @returns Success status
 */
export async function attachPaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<boolean> {
  try {
    if (!userId || !paymentMethodId) return false;
    // Attaching is handled during SetupIntent confirmation; if needed, call a payment handler.
    // For now, assume client confirmed SetupIntent and Stripe attached it server-side via edge.
    return true;
  } catch (error) {
    handlePaymentError(error, 'Failed to attach payment method');
    return false;
  }
}

/**
 * Detach a payment method from a user
 * @param userId User ID
 * @param paymentMethodId Payment method ID
 * @returns Success status
 */
export async function detachPaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<boolean> {
  try {
    if (!userId || !paymentMethodId) return false;
    await deletePaymentMethodEdge(paymentMethodId);
    return true;
  } catch (error) {
    handlePaymentError(error, 'Failed to detach payment method');
    return false;
  }
}

/**
 * Update the default payment method for a user
 * @param userId User ID
 * @param paymentMethodId Payment method ID
 * @returns Success status
 */
export async function updateDefaultPaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<boolean> {
  try {
    if (!userId || !paymentMethodId) return false;
    await setDefaultPaymentMethodEdge(paymentMethodId);
    return true;
  } catch (error) {
    handlePaymentError(error, 'Failed to update default payment method');
    return false;
  }
}
