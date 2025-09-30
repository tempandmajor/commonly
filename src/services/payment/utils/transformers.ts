/**
 * Payment Service Data Transformers
 * Rebuilt with proper TypeScript types and patterns
 */

import {
  PaymentMethod,
  PaymentMethodType,
  CardBrand,
  SetupIntent,
  PaymentIntent,
  PaymentIntentStatus,
  Customer,
  Transaction,
  Refund,
} from '../types';

/**
 * Address transformation interface
 */
interface RawAddress {
  line1?: string | undefined;
  line2?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  postal_code?: string | undefined;
  country?: string | undefined;
}

/**
 * Raw billing details interface
 */
interface RawBillingDetails {
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  address?: RawAddress | undefined;
}

/**
 * Raw card details interface
 */
interface RawCardDetails {
  brand?: string | undefined;
  last4?: string | undefined;
  exp_month?: number | undefined;
  exp_year?: number | undefined;
  fingerprint?: string | undefined;
  country?: string | undefined;
}

/**
 * Raw bank account details interface
 */
interface RawBankAccount {
  bank_name?: string | undefined;
  last4?: string | undefined;
  country?: string | undefined;
  currency?: string | undefined;
}

/**
 * Raw wallet details interface
 */
interface RawWallet {
  type?: string | undefined;
  email?: string | undefined;
}

/**
 * Raw payment method data interface
 */
interface RawPaymentMethodData {
  id: string;
  type: string;
  isDefault?: boolean | undefined;
  created?: number | undefined;
  lastUsed?: number | undefined;
  billing_details?: RawBillingDetails | undefined;
  card?: RawCardDetails | undefined;
  bank_account?: RawBankAccount | undefined;
  wallet?: RawWallet | undefined;
}

/**
 * Raw setup intent data interface
 */
interface RawSetupIntentData {
  id: string;
  client_secret: string;
  status: string;
  created?: number | undefined;
  payment_method_types?: string[] | undefined;
  usage?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

/**
 * Raw payment intent data interface
 */
interface RawPaymentIntentData {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  created?: number | undefined;
  payment_method?: string | undefined;
  payment_method_types?: string[] | undefined;
  metadata?: Record<string, any> | undefined;
}

/**
 * Raw customer data interface
 */
interface RawCustomerData {
  id: string;
  email?: string | undefined;
  name?: string | undefined;
  phone?: string | undefined;
  address?: RawAddress | undefined;
  metadata?: Record<string, any> | undefined;
  default_payment_method?: string | undefined;
  created?: number | undefined;
}

/**
 * Raw transaction data interface
 */
interface RawTransactionData {
  id: string;
  user_id?: string | undefined;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string | undefined;
  payment_method_details?: any | undefined;
  created?: number | undefined;
  metadata?: Record<string, any> | undefined;
  description?: string | undefined;
  refunded?: boolean | undefined;
  amount_refunded?: number | undefined;
}

/**
 * Raw refund data interface
 */
interface RawRefundData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created?: number | undefined;
  payment_intent: string;
  reason?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

/**
 * Transform raw payment method data to application format
 */
export function transformPaymentMethodData(data: RawPaymentMethodData): PaymentMethod {
  const paymentMethod: PaymentMethod = {
    id: data.id,
    type: mapPaymentMethodType(data.type),
    isDefault: Boolean(data.isDefault),
    created: data.created
      ? new Date(data.created * 1000).toISOString()
      : new Date().toISOString(),
    billingDetails: transformBillingDetails(data.billing_details),
  };

  // Add optional lastUsed timestamp
  if (data.lastUsed) {
    paymentMethod.lastUsed = new Date(data.lastUsed * 1000).toISOString();
  }

  // Add card details if available
  if (data.card) {
    paymentMethod.card = {
      brand: mapCardBrand(data.card.brand || ''),
      last4: data.card.last4 || '',
      expMonth: data.card.exp_month || 0,
      expYear: data.card.exp_year || 0,
      fingerprint: data.card.fingerprint,
      country: data.card.country,
    };
  }

  // Add bank account details if available
  if (data.bank_account) {
    paymentMethod.bankAccount = {
      bankName: data.bank_account.bank_name,
      last4: data.bank_account.last4 || '',
      country: data.bank_account.country || '',
      currency: data.bank_account.currency || '',
    };
  }

  // Add wallet details if available
  if (data.wallet) {
    paymentMethod.wallet = {
      type: data.wallet.type || '',
      email: data.wallet.email,
    };
  }

  return paymentMethod;
}

/**
 * Transform raw billing details to application format
 */
function transformBillingDetails(data?: RawBillingDetails) {
  if (!data) {
    return {
      };
  }

  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address ? {
      line1: data.address.line1,
      line2: data.address.line2,
      city: data.address.city,
      state: data.address.state,
      postalCode: data.address.postal_code,
      country: data.address.country,
    } : undefined,
  };
}

/**
 * Transform raw setup intent data to application format
 */
export function transformSetupIntentData(data: RawSetupIntentData): SetupIntent {
  return {
    id: data.id,
    clientSecret: data.client_secret,
    status: data.status,
    created: data.created
      ? new Date(data.created * 1000).toISOString()
      : new Date().toISOString(),
    paymentMethodTypes: Array.isArray(data.payment_method_types)
      ? data.payment_method_types
      : [],
    usage: data.usage || 'off_session',
    metadata: data.metadata || {},
  };
}

/**
 * Transform raw payment intent data to application format
 */
export function transformPaymentIntentData(data: RawPaymentIntentData): PaymentIntent {
  return {
    id: data.id,
    clientSecret: data.client_secret,
    amount: data.amount,
    currency: data.currency,
    status: mapPaymentIntentStatus(data.status),
    created: data.created
      ? new Date(data.created * 1000).toISOString()
      : new Date().toISOString(),
    paymentMethodId: data.payment_method,
    paymentMethodTypes: Array.isArray(data.payment_method_types)
      ? data.payment_method_types
      : [],
    metadata: data.metadata || {},
  };
}

/**
 * Transform raw customer data to application format
 */
export function transformCustomerData(data: RawCustomerData): Customer {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone,
    address: data.address ? {
      line1: data.address.line1,
      line2: data.address.line2,
      city: data.address.city,
      state: data.address.state,
      postalCode: data.address.postal_code,
      country: data.address.country,
    } : undefined,
    metadata: data.metadata || {},
    defaultPaymentMethodId: data.default_payment_method,
    created: data.created
      ? new Date(data.created * 1000).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Transform raw transaction data to application format
 */
export function transformTransactionData(data: RawTransactionData): Transaction {
  return {
    id: data.id,
    userId: data.user_id || data.metadata?.user_id,
    amount: data.amount,
    currency: data.currency,
    status: mapPaymentIntentStatus(data.status),
    paymentMethodId: data.payment_method,
    paymentMethodDetails: data.payment_method_details ? transformPaymentMethodDetails(data.payment_method_details) : undefined,
    created: data.created
      ? new Date(data.created * 1000).toISOString()
      : new Date().toISOString(),
    metadata: data.metadata || {},
    description: data.description,
    refunded: Boolean(data.refunded),
    refundedAmount: data.amount_refunded || 0,
  };
}

/**
 * Transform payment method details from transaction data
 */
function transformPaymentMethodDetails(data: any) {
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  // Handle different payment method detail structures
  if (data.card) {
    return {
      type: 'card',
      card: {
        brand: mapCardBrand(data.card.brand || ''),
        last4: data.card.last4 || '',
        expMonth: data.card.exp_month || 0,
        expYear: data.card.exp_year || 0,
        country: data.card.country,
      },
    };
  }

  if (data.bank_account) {
    return {
      type: 'bank_account',
      bankAccount: {
        bankName: data.bank_account.bank_name,
        last4: data.bank_account.last4 || '',
        country: data.bank_account.country || '',
        currency: data.bank_account.currency || '',
      },
    };
  }

  if (data.wallet) {
    return {
      type: 'wallet',
      wallet: {
        type: data.wallet.type || '',
        email: data.wallet.email,
      },
    };
  }

  return undefined;
}

/**
 * Transform raw refund data to application format
 */
export function transformRefundData(data: RawRefundData): Refund {
  return {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    created: data.created
      ? new Date(data.created * 1000).toISOString()
      : new Date().toISOString(),
    paymentIntentId: data.payment_intent,
    reason: data.reason,
    metadata: data.metadata || {},
  };
}

/**
 * Map raw payment method type to enum
 */
function mapPaymentMethodType(type: string): PaymentMethodType {
  switch (type?.toLowerCase()) {
    case 'card':
      return PaymentMethodType.Card;
    case 'bank_account':
    case 'us_bank_account':
    case 'sepa_debit':
    case 'au_becs_debit':
    case 'bacs_debit':
      return PaymentMethodType.Bank;
    case 'alipay':
    case 'wechat_pay':
    case 'apple_pay':
    case 'google_pay':
    case 'paypal':
      return PaymentMethodType.Wallet;
    default:
      return PaymentMethodType.Card;
  }
}

/**
 * Map raw card brand to enum
 */
function mapCardBrand(brand: string): CardBrand {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return CardBrand.Visa;
    case 'mastercard':
      return CardBrand.Mastercard;
    case 'amex':
    case 'american_express':
      return CardBrand.Amex;
    case 'discover':
      return CardBrand.Discover;
    case 'jcb':
      return CardBrand.JCB;
    case 'diners':
    case 'diners_club':
      return CardBrand.DinersClub;
    case 'unionpay':
      return CardBrand.UnionPay;
    default:
      return CardBrand.Unknown;
  }
}

/**
 * Map raw payment intent status to enum
 */
function mapPaymentIntentStatus(status: string): PaymentIntentStatus {
  switch (status?.toLowerCase()) {
    case 'succeeded':
      return PaymentIntentStatus.Succeeded;
    case 'requires_payment_method':
      return PaymentIntentStatus.RequiresPaymentMethod;
    case 'requires_confirmation':
      return PaymentIntentStatus.RequiresConfirmation;
    case 'requires_action':
      return PaymentIntentStatus.RequiresAction;
    case 'processing':
      return PaymentIntentStatus.Processing;
    case 'canceled':
    case 'cancelled':
      return PaymentIntentStatus.Canceled;
    case 'requires_capture':
      return PaymentIntentStatus.RequiresCapture;
    default:
      return PaymentIntentStatus.RequiresPaymentMethod;
  }
}

/**
 * Batch transform multiple payment methods
 */
export function transformPaymentMethods(dataArray: RawPaymentMethodData[]): PaymentMethod[] {
  if (!Array.isArray(dataArray)) {
    return [];
  }

  return dataArray
    .filter(Boolean)
    .map(data => {
      try {
        return transformPaymentMethodData(data);
      } catch (error) {
        console.error('Failed to transform payment method:', error, data);
        return null;
      }
    })
    .filter((method): method is PaymentMethod => method !== null);
}

/**
 * Batch transform multiple transactions
 */
export function transformTransactions(dataArray: RawTransactionData[]): Transaction[] {
  if (!Array.isArray(dataArray)) {
    return [];
  }

  return dataArray
    .filter(Boolean)
    .map(data => {
      try {
        return transformTransactionData(data);
      } catch (error) {
        console.error('Failed to transform transaction:', error, data);
        return null;
      }
    })
    .filter((transaction): transaction is Transaction => transaction !== null);
}

/**
 * Batch transform multiple refunds
 */
export function transformRefunds(dataArray: RawRefundData[]): Refund[] {
  if (!Array.isArray(dataArray)) {
    return [];
  }

  return dataArray
    .filter(Boolean)
    .map(data => {
      try {
        return transformRefundData(data);
      } catch (error) {
        console.error('Failed to transform refund:', error, data);
        return null;
      }
    })
    .filter((refund): refund is Refund => refund !== null);
}

/**
 * Validate required fields for payment method
 */
export function validatePaymentMethodData(data: any): data is RawPaymentMethodData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.type === 'string'
  );
}

/**
 * Validate required fields for transaction data
 */
export function validateTransactionData(data: any): data is RawTransactionData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.amount === 'number' &&
    typeof data.currency === 'string' &&
    typeof data.status === 'string'
  );
}

/**
 * Validate required fields for refund data
 */
export function validateRefundData(data: any): data is RawRefundData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.amount === 'number' &&
    typeof data.currency === 'string' &&
    typeof data.status === 'string' &&
    typeof data.payment_intent === 'string'
  );
}

/**
 * Safe transformation with error handling
 */
export function safeTransformPaymentMethod(data: any): PaymentMethod | null {
  try {
    if (!validatePaymentMethodData(data)) {
      return null;
    }
    return transformPaymentMethodData(data);
  } catch (error) {
    console.error('Failed to safely transform payment method:', error, data);
    return null;
  }
}

/**
 * Safe transformation with error handling
 */
export function safeTransformTransaction(data: any): Transaction | null {
  try {
    if (!validateTransactionData(data)) {
      return null;
    }
    return transformTransactionData(data);
  } catch (error) {
    console.error('Failed to safely transform transaction:', error, data);
    return null;
  }
}

/**
 * Safe transformation with error handling
 */
export function safeTransformRefund(data: any): Refund | null {
  try {
    if (!validateRefundData(data)) {
      return null;
    }
    return transformRefundData(data);
  } catch (error) {
    console.error('Failed to safely transform refund:', error, data);
    return null;
  }
}