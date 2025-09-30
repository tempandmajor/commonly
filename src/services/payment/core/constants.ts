/**
 * @file Constants for the payment service
 */

// Transaction types for consistency
export const TRANSACTION_TYPES = {
  CREDIT_ADDITION: 'credit_addition',
  CREDIT_DEDUCTION: 'credit_deduction',
  PAYMENT: 'payment',
  REFUND: 'refund',
  TRANSFER: 'transfer',
  BONUS: 'bonus',
};

// Transaction status values
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Default currency
export const DEFAULT_CURRENCY = 'usd';

// Minimum transaction amounts (in cents)
export const MIN_TRANSACTION_AMOUNT = {
  CREDIT: 50, // $0.50
  PAYMENT: 100, // $1.00
};

// Default Stripe API version
export const STRIPE_API_VERSION = '2023-10-16';

// Default platform fee percentage
export const DEFAULT_PLATFORM_FEE_PERCENT = 10;

// Wallet field names for dynamic field detection
export const WALLET_BALANCE_FIELDS = ['credit_balance', 'credits', 'balance', 'balance_in_cents'];

// Payment processing retry configuration
export const PAYMENT_RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BACKOFF_MS: 1000, // 1 second
};

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  WALLET: 60, // 1 minute
  TRANSACTIONS: 300, // 5 minutes
  PAYMENT_METHODS: 600, // 10 minutes
};

// Database tables mapping
export const DB_TABLES = {
  WALLETS: process.env.NODE_ENV as string === 'production' ? 'wallets' : 'wallets',
  TRANSACTIONS: process.env.NODE_ENV as string === 'production' ? 'transactions' : 'transactions',
  PAYMENTS: process.env.NODE_ENV as string === 'production' ? 'payments' : 'PaymentsTest',
  CREDIT_TRANSACTIONS:
    process.env.NODE_ENV as string === 'production' ? 'credit_transactions' : 'credit_transactions',
};
