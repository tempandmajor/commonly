/**
 * Stripe service types
 * Defines all interfaces and types for the Stripe payment service
 */

import { PaymentStatus, PaymentType } from '../types';

/**
 * Stripe checkout session options
 */
export interface StripeCheckoutOptions {
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string | undefined;
  metadata?: Record<string, string> | undefined;
  paymentIntentData?: Record<string, unknown> | undefined;
  paymentType: PaymentType;
  lineItems?: StripeLineItem[] | undefined;
  isSubscription?: boolean | undefined;
  applicationFeeAmount?: number | undefined;
  connectedAccountId?: string | undefined;
  customerEmail?: string | undefined;
}

/**
 * Stripe line item for checkout
 */
export interface StripeLineItem {
  name: string;
  amount: number;
  currency: string;
  quantity: number;
  description?: string | undefined;
}

/**
 * Stripe customer creation options
 */
export interface StripeCustomerOptions {
  email: string;
  name?: string | undefined;
  phone?: string | undefined;
  metadata?: Record<string, string> | undefined;
}

/**
 * Stripe payment intent options
 */
export interface StripePaymentIntentOptions {
  amount: number;
  currency: string;
  description: string;
  customerId?: string | undefined;
  metadata?: Record<string, string> | undefined;
  receiptEmail?: string | undefined;
  statementDescriptor?: string | undefined;
  applicationFeeAmount?: number | undefined;
  connectedAccountId?: string | undefined;
}

/**
 * Stripe payment verification result
 */
export interface StripeVerificationResult {
  success: boolean;
  error?: string | undefined;
  paymentId?: string | undefined;
  status?: PaymentStatus | undefined;
  customerId?: string | undefined;
  amount?: number | undefined;
  currency?: string | undefined;
  metadata?: Record<string, string> | undefined;
}

/**
 * Stripe webhook event types that we handle
 */
export type StripeWebhookEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'checkout.session.completed'
  | 'checkout.session.expired'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted';

/**
 * Stripe webhook handler
 */
export interface StripeWebhookHandler {
  handleEvent: (event: unknown) => Promise<void>;
}
