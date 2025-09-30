/**
 * Payment Record Utilities
 *
 * Provides functions for creating and managing payment records in the database.
 * Uses the consolidated Supabase service layer for database operations.
 */

import { PaymentRecordData } from '../types';
import { supabaseService } from '../../supabase';

/**
 * Create a new payment record
 *
 * @param paymentData Payment record data
 * @returns Created payment record with ID
 */
export const createPaymentRecord = async (paymentData: PaymentRecordData): Promise<any> => {
  try {
    // Make sure we have essential fields
    const now = new Date().toISOString();

    // Map fields to database schema
    const dbRecord: any = {
      // Required fields
      amount_in_cents:
        paymentData.amount_in_cents ||
        (paymentData.amount ? Math.round(paymentData.amount * 100) : 0),
      status: paymentData.status || 'pending',
      created_at: now,
      updated_at: now,

      // Optional fields with proper mapping
      user_id: paymentData.user_id || paymentData.userId,
      customer_id: paymentData.customer_id || paymentData.customerId,
      payment_method: paymentData.payment_method || paymentData.paymentMethod || 'stripe',
      stripe_payment_id: paymentData.stripe_payment_id || paymentData.paymentIntentId,
      currency: paymentData.currency || 'usd',
      description: paymentData.description || 'Payment',
    };

    // Handle metadata - combine any existing metadata with special fields
    const metadata = paymentData.metadata ? { ...paymentData.metadata } : {};

    // Add special fields to metadata if they exist
    if (paymentData.creatorId) metadata.creatorId = paymentData.creatorId;
    if (paymentData.eventId) metadata.eventId = paymentData.eventId;

    dbRecord.metadata = metadata;

    // Insert the payment record
    const { data, error } = await supabaseService
      .getRawClient()
      .from('payments')
      .insert(dbRecord)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a payment record
 *
 * @param id Payment record ID
 * @param status New payment status
 * @param metadata Optional updated metadata
 * @returns Success status
 */
export const updatePaymentRecord = async (
  id: string,
  status: string,
  metadata?: unknown
): Promise<boolean> => {
  try {
    // Create update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Add metadata if provided
    if (metadata) {
      updateData.metadata = metadata;
    }

    // Update the payment record
    const { error } = await supabaseService
      .getRawClient()
      .from('payments')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get a payment record by ID
 *
 * @param id Payment record ID
 * @returns Payment record or null if not found
 */
export const getPaymentRecord = async (id: string): Promise<any> => {
  try {
    const { data, error } = await supabaseService
      .getRawClient()
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Get payment records by user ID
 *
 * @param userId User ID
 * @param limit Maximum number of records to retrieve
 * @returns Array of payment records
 */
export const getUserPaymentRecords = async (userId: string, limit = 10): Promise<any[]> => {
  try {
    const { data, error } = await supabaseService
      .getRawClient()
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
};

// Re-export backward compatibility helpers
export const paymentsCollection = () => ({
  add: async (data: unknown) => {
    const result = await createPaymentRecord(data);

    return {
      id: result?.id || '',
    };
  },

});

export const getPaymentDoc = (id: string) => ({
  single: async () => {
    const data = await getPaymentRecord(id);
    return { data };
  },
});
