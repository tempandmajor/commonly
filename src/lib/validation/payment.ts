/**
 * Payment Validation Schemas
 *
 * Type-safe validation for all payment-related operations
 * Uses Zod for runtime validation and TypeScript type inference
 */

import { z } from 'zod';

/**
 * Currency codes (ISO 4217)
 */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD'] as const;

/**
 * Payment method types
 */
export const PaymentMethodSchema = z.enum(['card', 'bank', 'wallet', 'crypto']);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

/**
 * Transaction status types
 */
export const TransactionStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded',
]);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

/**
 * Currency schema
 */
export const CurrencySchema = z.enum(SUPPORTED_CURRENCIES);
export type Currency = z.infer<typeof CurrencySchema>;

/**
 * Amount validation (must be positive, max 2 decimal places)
 */
export const AmountSchema = z.number()
  .positive('Amount must be positive')
  .multipleOf(0.01, 'Amount can have at most 2 decimal places')
  .max(999999.99, 'Amount exceeds maximum allowed');

/**
 * Amount in cents (avoids floating point issues)
 */
export const AmountInCentsSchema = z.number()
  .int('Amount in cents must be an integer')
  .positive('Amount must be positive')
  .max(99999999, 'Amount exceeds maximum allowed');

/**
 * Payment intent creation schema
 */
export const CreatePaymentIntentSchema = z.object({
  amount: AmountInCentsSchema,
  currency: CurrencySchema.default('USD'),
  paymentMethod: PaymentMethodSchema,
  customerId: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  metadata: z.record(z.unknown()).optional(),
  idempotencyKey: z.string().min(1).max(255),
});

export type CreatePaymentIntent = z.infer<typeof CreatePaymentIntentSchema>;

/**
 * Payment confirmation schema
 */
export const ConfirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
  paymentMethodId: z.string().min(1).optional(),
  returnUrl: z.string().url().optional(),
});

export type ConfirmPayment = z.infer<typeof ConfirmPaymentSchema>;

/**
 * Refund request schema
 */
export const RefundSchema = z.object({
  transactionId: z.string().uuid(),
  amount: AmountInCentsSchema.optional(), // If not provided, refund full amount
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer', 'other']),
  description: z.string().max(500).optional(),
  idempotencyKey: z.string().min(1).max(255),
});

export type RefundRequest = z.infer<typeof RefundSchema>;

/**
 * Transaction record schema
 */
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: AmountInCentsSchema,
  currency: CurrencySchema,
  status: TransactionStatusSchema,
  paymentMethod: PaymentMethodSchema,
  description: z.string(),
  referenceId: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * Wallet balance schema
 */
export const WalletBalanceSchema = z.object({
  userId: z.string().uuid(),
  availableBalance: AmountInCentsSchema,
  pendingBalance: AmountInCentsSchema.default(0),
  totalBalance: AmountInCentsSchema,
  currency: CurrencySchema.default('USD'),
});

export type WalletBalance = z.infer<typeof WalletBalanceSchema>;

/**
 * Wallet transaction schema
 */
export const WalletTransactionSchema = z.object({
  userId: z.string().uuid(),
  amount: AmountInCentsSchema,
  type: z.enum(['credit', 'debit', 'transfer', 'refund']),
  description: z.string().min(1).max(500),
  referenceId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  idempotencyKey: z.string().min(1).max(255),
});

export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;

/**
 * Checkout session schema
 */
export const CheckoutSessionSchema = z.object({
  eventId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  amount: AmountInCentsSchema,
  currency: CurrencySchema.default('USD'),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().int().positive(),
    pricePerUnit: AmountInCentsSchema,
  })).min(1),
  paymentMethod: PaymentMethodSchema,
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  metadata: z.record(z.unknown()).optional(),
});

export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;

/**
 * Stripe webhook event schema
 */
export const StripeWebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
  created: z.number(),
});

export type StripeWebhookEvent = z.infer<typeof StripeWebhookEventSchema>;

/**
 * Utility: Convert dollars to cents (avoids floating point errors)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Utility: Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Utility: Format amount for display
 */
export function formatAmount(cents: number, currency: Currency = 'USD'): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars);
}

/**
 * Utility: Validate amount before processing
 */
export function validateAmount(cents: number): { valid: boolean; error?: string } {
  const result = AmountInCentsSchema.safeParse(cents);
  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0]?.message || 'Invalid amount',
    };
  }
  return { valid: true };
}

/**
 * Utility: Calculate total with fees
 */
export function calculateTotalWithFees(
  subtotal: number,
  platformFeePercent: number = 2.5,
  stripeFeePercent: number = 2.9,
  stripeFeeFixed: number = 30 // in cents
): {
  subtotal: number;
  platformFee: number;
  stripeFee: number;
  total: number;
} {
  const platformFee = Math.round(subtotal * (platformFeePercent / 100));
  const stripeFee = Math.round(subtotal * (stripeFeePercent / 100)) + stripeFeeFixed;
  const total = subtotal + platformFee + stripeFee;

  return {
    subtotal,
    platformFee,
    stripeFee,
    total,
  };
}

/**
 * Utility: Validate transaction status transition
 */
export function isValidStatusTransition(
  currentStatus: TransactionStatus,
  newStatus: TransactionStatus
): boolean {
  const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
    pending: ['processing', 'failed', 'cancelled'],
    processing: ['completed', 'failed'],
    completed: ['refunded'],
    failed: ['pending'], // Allow retry
    cancelled: [], // Terminal state
    refunded: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}