/**
 * Payment Service
 *
 * This module exports the consolidated payment service functionality.
 * It maintains backward compatibility with existing code while providing
 * the new, improved implementations.
 */

// Core exports
export * from './core/types';
export * from './core/constants';
export * from './core/errors';
export * from './core/client';

// API exports - use explicit re-exports to avoid ambiguity

export { creditAPI, walletAPI, transactionsAPI, stripeAPI, paymentMethodsAPI };

// Utility exports - use explicit re-exports to avoid ambiguity

export { formatters, validators };

// For backward compatibility, re-export the original functions
export {
  checkout,
  initiateCheckout,
  verifyCheckoutPayment as verifyPayment,
} from './checkoutService';
export * from './standardCheckout';
export * from './connectedCheckout';
export * from './platformCredit';
export * from './verification';

// Also export compatibility layers
export * as LegacyPlatformCredit from './compatibility/platformCredit';
export * as LegacyWallet from './compatibility/wallet';

// Export a comment about the consolidation
export const PAYMENT_SERVICE_INFO = {
  version: '3.0.0',
  updated: new Date().toISOString().split('T')[0],
  consolidated: true,
  secureOperations: true,
  description:
    'Consolidated payment service with secure server-side Stripe operations, unified credit and wallet management, and improved TypeScript support',
};
