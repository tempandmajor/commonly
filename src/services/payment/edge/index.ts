/**
 * @file Edge function interfaces for secure payment processing
 * These interfaces are designed to be implemented in Supabase Edge Functions
 */

import { TransactionType } from '../core/types';

/**
 * Create a Stripe checkout session (server-side implementation)
 */
export interface CreateCheckoutSessionRequest {
  userId: string;
  amount: number; // In cents
  description: string;
  currency?: string | undefined;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown> | undefined;
  paymentMethodTypes?: string[] | undefined;
  idempotencyKey?: string | undefined;
}

export interface CreateCheckoutSessionResponse {
  url: string;
  sessionId: string;
}

/**
 * Create a checkout session for a connected account (server-side implementation)
 */
export interface ConnectedCheckoutRequest extends CreateCheckoutSessionRequest {
  connectedAccountId: string;
  applicationFeePercent?: number;
}

/**
 * Customer portal request
 */
export interface CustomerPortalRequest {
  userId: string;
  returnUrl: string;
}

export interface CustomerPortalResponse {
  url: string;
}

/**
 * Webhook event handler request
 */
export interface WebhookEventRequest {
  signature: string;
  payload: unknown;
}

export interface WebhookEventResponse {
  received: boolean;
  processed: boolean;
  eventType?: string | undefined;
  error?: string | undefined;
}

/**
 * Payment verification request
 */
export interface VerifyPaymentRequest {
  paymentIntentId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  status: string;
  amount?: number | undefined;
  metadata?: Record<string, unknown> | undefined;
  error?: string | undefined;
}

/**
 * Process platform credit request
 */
export interface ProcessCreditRequest {
  userId: string;
  amount: number;
  description: string;
  transactionType: TransactionType;
  referenceId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface ProcessCreditResponse {
  success: boolean;
  balance?: number | undefined;
  transactionId?: string | undefined;
  error?: string | undefined;
}

/**
 * Validate if a user can perform a credit operation
 */
export interface ValidateCreditRequest {
  userId: string;
  amount: number;
  transactionType: TransactionType;
}

export interface ValidateCreditResponse {
  isValid: boolean;
  currentBalance?: number | undefined;
  error?: string | undefined;
}

/**
 * Set default payment method request
 */
export interface SetDefaultPaymentMethodRequest {
  userId: string;
  paymentMethodId: string;
}

export interface SetDefaultPaymentMethodResponse {
  success: boolean;
  error?: string | undefined;
}

/**
 * List payment methods request
 */
export interface ListPaymentMethodsRequest {
  userId: string;
}

export interface ListPaymentMethodsResponse {
  paymentMethods: Array<{
    id: string;
    type: string;
    isDefault: boolean;
    lastFour?: string | undefined;
    expiryMonth?: number | undefined;
    expiryYear?: number | undefined;
    brand?: string | undefined;
  }>;
}
