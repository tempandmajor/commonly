export const COLLECTIONS = {
  EVENTS: 'events',
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  PAYMENTS_TEST: 'PaymentsTest',
  NOTIFICATIONS: 'notifications',
  CONTENT: 'ContentTest',
  CATERERS: 'ContentTest',
  VENUES: 'venues',
  STORES: 'stores',
  TRANSACTIONS: 'transactions',
  CONVERSATIONS: 'conversations',
  LOCATIONS: 'locations',
  USER_LOCATIONS: 'user_locations',
  WALLETS: 'wallets',
  REFERRAL_CODES: 'referral_codes',
  CREDIT_TRANSACTIONS: 'credit_transactions',
};

import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/utils/errorUtils';

/**
 * Retrieves payment document by ID from the database
 * @param paymentId - The ID of the payment to retrieve
 * @returns Promise resolving to the payment document or null if not found
 */
export const getPaymentDoc = async (paymentId: string) => {
  try {
    // Check if payment exists in the payments table
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found error code
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    handleError(error, { paymentId }, 'Error retrieving payment document');
    return null;
  }
};

/**
 * Fetches a payment document with extended data including related transactions
 * @param paymentId - The ID of the payment to fetch
 * @returns Promise resolving to the payment document with related data or null if not found
 */
export const fetchPaymentDocument = async (paymentId: string): Promise<any> => {
  try {
    // First get the basic payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError) {
      if (paymentError.code === 'PGRST116') {
        // Not found error code
        return null;
      }
      throw paymentError;
    }

    if (!payment) return null;

    // Fetch related transactions
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_id', paymentId);

    if (transactionError) throw transactionError;

    // Fetch related order if exists
    let order = null;
    if (payment.order_id) {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', payment.order_id)
        .single();

      if (!orderError) {
        order = orderData;
      }
    }

    // Return combined payment document with related data
    return {
          ...payment,
      transactions: transactions || [],
      order,
    };
  } catch (error) {
    handleError(error, { paymentId }, 'Error fetching payment document with related data');
    return null;
  }
};
