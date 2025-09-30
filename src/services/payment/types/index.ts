/**
 * Payment Service Types
 *
 * This file contains TypeScript types for the Payment Service.
 */

/**
 * Payment method types supported by the system
 */
export enum PaymentMethodType {
  Card = 'card',
  Bank = 'bank',
  Wallet = 'wallet',
}

/**
 * Payment intent status
 */
export enum PaymentIntentStatus {
  Succeeded = 'succeeded',
  RequiresPaymentMethod = 'requires_payment_method',
  RequiresConfirmation = 'requires_confirmation',
  RequiresAction = 'requires_action',
  Processing = 'processing',
  Canceled = 'canceled',
  RequiresCapture = 'requires_capture',
}

/**
 * Payment method brand (for cards)
 */
export enum CardBrand {
  Visa = 'visa',
  Mastercard = 'mastercard',
  Amex = 'amex',
  Discover = 'discover',
  JCB = 'jcb',
  DinersClub = 'diners',
  UnionPay = 'unionpay',
  Unknown = 'unknown',
}

/**
 * Payment method interface
 */
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  isDefault: boolean;
  created: string;
  lastUsed?: string | undefined;
  billingDetails: {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    address?: {
      line1?: string | undefined;
      line2?: string | undefined;
      city?: string | undefined;
      state?: string | undefined;
      postalCode?: string | undefined;
      country?: string | undefined;
    };
  };
  card?: {
    brand: CardBrand;
    last4: string;
    expMonth: number;
    expYear: number;
    fingerprint?: string;
    country?: string;
  };
  bankAccount?: {
    bankName: string;
    last4: string;
    country: string;
    currency: string;
  };
  wallet?: {
    type: string;
    email?: string;
  };
}

/**
 * Setup intent interface
 */
export interface SetupIntent {
  id: string;
  clientSecret: string;
  status: string;
  created: string;
  paymentMethodTypes: string[];
  usage: string;
  metadata?: Record<string, string> | undefined;
}

/**
 * Payment intent interface
 */
export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  created: string;
  paymentMethodId?: string | undefined;
  paymentMethodTypes: string[];
  metadata?: Record<string, string> | undefined;
}

/**
 * Parameters for creating a payment intent
 */
export interface CreatePaymentIntentParams {
  userId: string;
  amount: number;
  currency?: string | undefined;
  metadata?: Record<string, string> | undefined;
  paymentMethodId?: string | undefined;
  setupFutureUsage?: boolean | undefined;
  description?: string | undefined;
}

/**
 * Parameters for creating a setup intent
 */
export interface CreateSetupIntentParams {
  userId: string;
  metadata?: Record<string, string> | undefined;
}

/**
 * Parameters for updating a payment method
 */
export interface UpdatePaymentMethodParams {
  userId: string;
  paymentMethodId: string;
  isDefault?: boolean | undefined;
  billingDetails?: {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    address?: {
      line1?: string | undefined;
      line2?: string | undefined;
      city?: string | undefined;
      state?: string | undefined;
      postalCode?: string | undefined;
      country?: string | undefined;
    };
  };
}

/**
 * Payment error codes
 */
export enum PaymentErrorCode {
  CardDeclined = 'card_declined',
  ExpiredCard = 'expired_card',
  IncorrectCVC = 'incorrect_cvc',
  InsufficientFunds = 'insufficient_funds',
  InvalidCard = 'invalid_card',
  ProcessingError = 'processing_error',
  RateLimit = 'rate_limit',
  Unknown = 'unknown',
}

/**
 * Payment error interface
 */
export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
  declineCode?: string | undefined;
  param?: string | undefined;
}

/**
 * Customer interface
 */
export interface Customer {
  id: string;
  email: string;
  name?: string | undefined;
  phone?: string | undefined;
  address?: {
    line1?: string | undefined;
    line2?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    postalCode?: string | undefined;
    country?: string | undefined;
  };
  metadata?: Record<string, string>;
  defaultPaymentMethodId?: string;
  created: string;
}

/**
 * Parameters for creating or updating a customer
 */
export interface CustomerParams {
  userId: string;
  email: string;
  name?: string | undefined;
  phone?: string | undefined;
  address?: {
    line1?: string | undefined;
    line2?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    postalCode?: string | undefined;
    country?: string | undefined;
  };
  metadata?: Record<string, string>;
}

/**
 * Transaction interface
 */
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  paymentMethodId?: string | undefined;
  paymentMethodDetails?: PaymentMethod | undefined;
  created: string;
  metadata?: Record<string, string> | undefined;
  description?: string | undefined;
  refunded?: boolean | undefined;
  refundedAmount?: number | undefined;
}

/**
 * Transaction list result
 */
export interface TransactionListResult {
  items: Transaction[];
  hasMore: boolean;
  totalCount: number;
}

/**
 * Parameters for listing transactions
 */
export interface ListTransactionsParams {
  userId: string;
  startDate?: string | undefined;
  endDate?: string | undefined;
  status?: PaymentIntentStatus | undefined;
  limit?: number | undefined;
  startingAfter?: string | undefined;
}

/**
 * Refund interface
 */
export interface Refund {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  paymentIntentId: string;
  reason?: string | undefined;
  metadata?: Record<string, string> | undefined;
}

/**
 * Parameters for creating a refund
 */
export interface CreateRefundParams {
  paymentIntentId: string;
  amount?: number | undefined;
  reason?: string | undefined;
  metadata?: Record<string, string> | undefined;
}
