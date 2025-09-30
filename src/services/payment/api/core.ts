/**
 * Payment Service Core API
 *
 * This file contains the core API functions for the Payment Service.
 * It uses Supabase Edge Functions to interact with Stripe.
 */

import { supabase } from '@/lib/supabase';
import {
  PaymentMethod,
  SetupIntent,
  PaymentIntent,
  CreatePaymentIntentParams,
  CreateSetupIntentParams,
  Customer,
  CustomerParams,
  Transaction,
  TransactionListResult,
  ListTransactionsParams,
  Refund,
  CreateRefundParams,
  UpdatePaymentMethodParams,
} from '../types';
import { handleApiError } from '../utils/errorHandling';
import {
  transformPaymentMethodData,
  transformSetupIntentData,
  transformPaymentIntentData,
  transformCustomerData,
  transformTransactionData,
  transformRefundData,
} from '../utils/transformers';
import { paymentMethodCache, customerCache, clearCaches } from '../utils/cache';

/**
 * Create a Setup Intent for adding a new payment method
 *
 * @param params - Setup intent parameters
 * @returns Setup intent data
 */
export const createSetupIntent = async (params: CreateSetupIntentParams): Promise<SetupIntent> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-setup-intent', {
      body: {
        userId: params.userId,
        metadata: params.metadata || {},
      },
    });

    if (error) throw error;
    return transformSetupIntentData(data);
  } catch (error) {
    return handleApiError('Failed to create setup intent', error);
  }
};

/**
 * Get all payment methods for a user
 *
 * @param userId - User ID
 * @returns Array of payment methods
 */
export const getPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  try {
    // Check cache first
    const cachedMethods = paymentMethodCache.get(userId);
    if (cachedMethods) {
      return cachedMethods;
    }

    const { data, error } = await supabase.functions.invoke('get-payment-methods', {
      body: { userId },
    });

    if (error) throw error;

    const paymentMethods = Array.isArray(data) ? data.map(transformPaymentMethodData) : [];

    // Cache the result
    paymentMethodCache.set(userId, paymentMethods);

    return paymentMethods;
  } catch (error) {
    return handleApiError('Failed to get payment methods', error, []);
  }
};

/**
 * Get a specific payment method
 *
 * @param userId - User ID
 * @param paymentMethodId - Payment method ID
 * @returns Payment method or null if not found
 */
export const getPaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<PaymentMethod | null> => {
  try {
    const methods = await getPaymentMethods(userId);
    return methods.find(method => method.id === paymentMethodId) || null;
  } catch (error) {
    return handleApiError('Failed to get payment method', error, null);
  }
};

/**
 * Detach a payment method from a customer
 *
 * @param userId - User ID
 * @param paymentMethodId - Payment method ID to detach
 * @returns Success status
 */
export const detachPaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('detach-payment-method', {
      body: { userId, paymentMethodId },
    });

    if (error) throw error;

    // Clear cache
    paymentMethodCache.delete(userId);

    return true;
  } catch (error) {
    return handleApiError('Failed to detach payment method', error, false);
  }
};

/**
 * Set a payment method as default
 *
 * @param userId - User ID
 * @param paymentMethodId - Payment method ID to set as default
 * @returns Updated payment method
 */
export const setDefaultPaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<PaymentMethod | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('set-default-payment-method', {
      body: { userId, paymentMethodId },
    });

    if (error) throw error;

    // Clear cache
    paymentMethodCache.delete(userId);
    customerCache.delete(userId);

    return data ? transformPaymentMethodData(data) : null;
  } catch (error) {
    return handleApiError('Failed to set default payment method', error, null);
  }
};

/**
 * Update a payment method
 *
 * @param params - Update parameters
 * @returns Updated payment method
 */
export const updatePaymentMethod = async (
  params: UpdatePaymentMethodParams
): Promise<PaymentMethod | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('update-payment-method', {
      body: {
        userId: params.userId,
        paymentMethodId: params.paymentMethodId,
        billingDetails: params.billingDetails,
        isDefault: params.isDefault,
      },
    });

    if (error) throw error;

    // Clear cache
    paymentMethodCache.delete(params.userId);

    return data ? transformPaymentMethodData(data) : null;
  } catch (error) {
    return handleApiError('Failed to update payment method', error, null);
  }
};

/**
 * Create a payment intent for processing payments
 *
 * @param params - Payment intent parameters
 * @returns Payment intent data
 */
export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<PaymentIntent> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        userId: params.userId,
        amount: params.amount,
        currency: params.currency || 'usd',
        metadata: params.metadata || {},
        paymentMethodId: params.paymentMethodId,
        setupFutureUsage: params.setupFutureUsage,
        description: params.description,
      },
    });

    if (error) throw error;
    return transformPaymentIntentData(data);
  } catch (error) {
    return handleApiError('Failed to create payment intent', error);
  }
};

/**
 * Confirm a payment intent
 *
 * @param paymentIntentId - Payment intent ID
 * @param paymentMethodId - Payment method ID
 * @returns Confirmed payment intent
 */
export const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId: string
): Promise<PaymentIntent> => {
  try {
    const { data, error } = await supabase.functions.invoke('confirm-payment-intent', {
      body: {
        paymentIntentId,
        paymentMethodId,
      },
    });

    if (error) throw error;
    return transformPaymentIntentData(data);
  } catch (error) {
    return handleApiError('Failed to confirm payment intent', error);
  }
};

/**
 * Get a payment intent by ID
 *
 * @param paymentIntentId - Payment intent ID
 * @returns Payment intent data
 */
export const getPaymentIntent = async (paymentIntentId: string): Promise<PaymentIntent> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-payment-intent', {
      body: { paymentIntentId },
    });

    if (error) throw error;
    return transformPaymentIntentData(data);
  } catch (error) {
    return handleApiError('Failed to get payment intent', error);
  }
};

/**
 * Cancel a payment intent
 *
 * @param paymentIntentId - Payment intent ID
 * @returns Canceled payment intent
 */
export const cancelPaymentIntent = async (paymentIntentId: string): Promise<PaymentIntent> => {
  try {
    const { data, error } = await supabase.functions.invoke('cancel-payment-intent', {
      body: { paymentIntentId },
    });

    if (error) throw error;
    return transformPaymentIntentData(data);
  } catch (error) {
    return handleApiError('Failed to cancel payment intent', error);
  }
};

/**
 * Get or create a customer for a user
 *
 * @param params - Customer parameters
 * @returns Customer data
 */
export const getOrCreateCustomer = async (params: CustomerParams): Promise<Customer> => {
  try {
    // Check cache first
    const cachedCustomer = customerCache.get(params.userId);
    if (cachedCustomer) {
      return cachedCustomer;
    }

    const { data, error } = await supabase.functions.invoke('get-or-create-customer', {
      body: {
        userId: params.userId,
        email: params.email,
        name: params.name,
        phone: params.phone,
        address: params.address,
        metadata: params.metadata,
      },
    });

    if (error) throw error;

    const customer = transformCustomerData(data);

    // Cache the result
    customerCache.set(params.userId, customer);

    return customer;
  } catch (error) {
    return handleApiError('Failed to get or create customer', error);
  }
};

/**
 * Update a customer
 *
 * @param params - Customer parameters
 * @returns Updated customer data
 */
export const updateCustomer = async (params: CustomerParams): Promise<Customer> => {
  try {
    const { data, error } = await supabase.functions.invoke('update-customer', {
      body: {
        userId: params.userId,
        email: params.email,
        name: params.name,
        phone: params.phone,
        address: params.address,
        metadata: params.metadata,
      },
    });

    if (error) throw error;

    const customer = transformCustomerData(data);

    // Update cache
    customerCache.set(params.userId, customer);

    return customer;
  } catch (error) {
    return handleApiError('Failed to update customer', error);
  }
};

/**
 * Get a customer by user ID
 *
 * @param userId - User ID
 * @returns Customer data or null if not found
 */
export const getCustomer = async (userId: string): Promise<Customer | null> => {
  try {
    // Check cache first
    const cachedCustomer = customerCache.get(userId);
    if (cachedCustomer) {
      return cachedCustomer;
    }

    const { data, error } = await supabase.functions.invoke('get-customer', {
      body: { userId },
    });

    if (error) throw error;

    if (!data) return null;

    const customer = transformCustomerData(data);

    // Cache the result
    customerCache.set(userId, customer);

    return customer;
  } catch (error) {
    return handleApiError('Failed to get customer', error, null);
  }
};

/**
 * List transactions for a user
 *
 * @param params - List transactions parameters
 * @returns Transaction list result
 */
export const listTransactions = async (
  params: ListTransactionsParams
): Promise<TransactionListResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('list-transactions', {
      body: {
        userId: params.userId,
        startDate: params.startDate,
        endDate: params.endDate,
        status: params.status,
        limit: params.limit || 10,
        startingAfter: params.startingAfter,
      },
    });

    if (error) throw error;

    return {
      items: Array.isArray(data.items) ? data.items.map(transformTransactionData) : [],
      hasMore: data.hasMore || false,
      totalCount: data.totalCount || 0,
    };
  } catch (error) {
    return handleApiError('Failed to list transactions', error, {
      items: [],
      hasMore: false,
      totalCount: 0,
    });
  }
};

/**
 * Get a transaction by ID
 *
 * @param transactionId - Transaction ID
 * @returns Transaction data or null if not found
 */
export const getTransaction = async (transactionId: string): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-transaction', {
      body: { transactionId },
    });

    if (error) throw error;

    return data ? transformTransactionData(data) : null;
  } catch (error) {
    return handleApiError('Failed to get transaction', error, null);
  }
};

/**
 * Create a refund
 *
 * @param params - Refund parameters
 * @returns Refund data
 */
export const createRefund = async (params: CreateRefundParams): Promise<Refund> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-refund', {
      body: {
        paymentIntentId: params.paymentIntentId,
        amount: params.amount,
        reason: params.reason,
        metadata: params.metadata,
      },
    });

    if (error) throw error;

    return transformRefundData(data);
  } catch (error) {
    return handleApiError('Failed to create refund', error);
  }
};

/**
 * Get a refund by ID
 *
 * @param refundId - Refund ID
 * @returns Refund data or null if not found
 */
export const getRefund = async (refundId: string): Promise<Refund | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-refund', {
      body: { refundId },
    });

    if (error) throw error;

    return data ? transformRefundData(data) : null;
  } catch (error) {
    return handleApiError('Failed to get refund', error, null);
  }
};

/**
 * Clear all payment caches
 */
export const clearPaymentCaches = (): void => {
  clearCaches();
};
