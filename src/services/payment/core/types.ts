/**
 * @file Core type definitions for the consolidated payment service
 */

// Define Json type if it's not available from database types
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ======== Wallet Types ========

/**
 * Unified wallet record structure that accommodates all existing wallet patterns
 */
export interface WalletRecord {
  id: string;
  user_id: string;

  // Balance fields - support multiple naming conventions for compatibility
  credit_balance?: number | undefined;
  credits?: number | undefined;
  balance?: number | undefined;
  balance_in_cents?: number | undefined;
  available_balance_in_cents?: number | undefined;
  pending_balance_in_cents?: number | undefined;

  // Metadata
  created_at: string;
  updated_at: string;
  metadata?: Json | undefined;
}

/**
 * Type for accessing wallet balance fields dynamically
 */
export type WalletBalanceField = 'credit_balance' | 'credits' | 'balance' | 'balance_in_cents';

/**
 * Normalized wallet interface used by public API
 */
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown> | undefined;
}

// ======== Transaction Types ========

/**
 * Raw transaction record as stored in database
 */
export interface TransactionRecord {
  id?: string | undefined;
  user_id: string;
  wallet_id?: string | undefined;
  amount_in_cents: number;
  description: string;
  transaction_type: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference_id?: string | undefined;
  created_at: string;
  updated_at?: string | undefined;
  metadata?: Json | undefined;
}

/**
 * Normalized transaction interface used by public API
 */
export interface Transaction {
  id: string;
  userId: string;
  amount: number; // Decimal amount (dollars/currency, not cents)
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  referenceId?: string | undefined;
  createdAt: Date;
  updatedAt?: Date | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Standard transaction types
 */
export enum TransactionType {
  CREDIT_ADDITION = 'credit_addition',
  CREDIT_DEDUCTION = 'credit_deduction',
  PAYMENT = 'payment',
  REFUND = 'refund',
  TRANSFER = 'transfer',
  BONUS = 'bonus',
  MISCELLANEOUS = 'miscellaneous',
}

/**
 * Transaction status values
 */
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// ======== Payment Types ========

/**
 * Payment method types
 */
export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  PLATFORM_CREDIT = 'platform_credit',
  BANK_ACCOUNT = 'bank_account',
  PAYPAL = 'paypal',
}

/**
 * Payment method interface
 */
export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  isDefault: boolean;
  lastFour?: string | undefined;
  expiryMonth?: number | undefined;
  expiryYear?: number | undefined;
  brand?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

// ======== Credit Processing Types ========

/**
 * Options for credit processing
 */
export interface CreditProcessingOptions {
  userId: string;
  amount: number;
  operation: 'add' | 'deduct' | 'use';
  description?: string | undefined;
  referenceId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

// ======== Stripe Types ========

/**
 * Checkout session options
 */
export interface CheckoutSessionOptions {
  userId: string;
  amount: number;
  description: string;
  currency?: string | undefined;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown> | undefined;
  paymentMethodTypes?: string[] | undefined;
}

/**
 * Connected account checkout options
 */
export interface ConnectedCheckoutOptions extends CheckoutSessionOptions {
  connectedAccountId: string;
  applicationFeePercent?: number;
}

// ======== Error Types ========

/**
 * Standard payment error types
 */
export enum PaymentErrorType {
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  PAYMENT_FAILED = 'payment_failed',
  INVALID_PAYMENT_METHOD = 'invalid_payment_method',
  WALLET_NOT_FOUND = 'wallet_not_found',
  TRANSACTION_FAILED = 'transaction_failed',
  AUTHORIZATION_FAILED = 'authorization_failed',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Standardized payment error
 */
export interface PaymentError {
  type: PaymentErrorType;
  message: string;
  originalError?: unknown | undefined;
}
