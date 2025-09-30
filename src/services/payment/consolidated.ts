/**
 * @file Consolidated payment service for backward compatibility
 * @deprecated Use individual API modules in payment/api/* instead
 */

import { safeToast } from '@/services/api/utils/safeToast';
import { getEnvironmentConfig } from '@/utils/environmentConfig';

// Import from the new consolidated API
import { stripeAPI, creditAPI } from './index';
import { handlePaymentError } from './core/errors';

// Import legacy types for backward compatibility
import { PaymentOptions, PaymentResult } from './types';

/**
 * Process a payment using the appropriate payment method
 *
 * Handles platform credits if applicable, otherwise processes through Stripe
 *
 * @param options Payment options
 * @returns Success status and payment details
 */
export async function processPayment(options: PaymentOptions): Promise<PaymentResult> {
  try {
    // Validate input
    if (!options.amount || options.amount <= 0) {
      return {
        success: false,
        error: 'Invalid payment amount',
        redirectUrl: null,
      };
    }

    if (!options.description) {
      options.description = 'Payment';
    }

    // Handle platform credit if applicable
    if (options.isPlatformFee && options.usePlatformCredit && options.userId) {
      try {
        // Use the new credit API
        const hasEnough = await creditAPI.hasEnoughCredit(options.userId, options.amount);

        if (hasEnough) {
          const deductResult = await creditAPI.deductCredit({
            userId: options.userId,
            amount: options.amount,
            description: options.description,
            metadata: options.metadata,
          });

          if (deductResult) {
            safeToast.success('Payment processed using platform credit');
            return {
              success: true,
              redirectUrl: options.successUrl || null,
              paymentMethod: 'platform_credit',
            };
          }
        }
      } catch (creditError) {
        // Fall through to regular payment if credit processing fails
      }
    }

    // Add environment info to metadata
    const enhancedMetadata = {
          ...options.metadata,
      environment: getEnvironmentConfig().environment,
      timestamp: new Date().toISOString(),
      userId: options.userId,
    };

    // Process through Stripe using the new API
    const session = await stripeAPI.createCheckoutSession({
      userId: options.userId || '',
      amount: options.amount,
      description: options.description,
      // Prefer SPA-friendly relative URLs by default
      successUrl: options.successUrl || '/payment-success',
      cancelUrl: options.cancelUrl || '/payment-cancelled',
      currency: options.currency,
      metadata: enhancedMetadata,
      paymentMethodTypes: ['card'],
    });

    if (session?.checkoutUrl) {
      return {
        success: true,
        redirectUrl: session.checkoutUrl,
        paymentMethod: 'stripe',
      };
    }

    return {
      success: false,
      error: 'Failed to create checkout session',
      redirectUrl: null,
    };
  } catch (error) {
    handlePaymentError(error, 'Payment processing error');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
      redirectUrl: null,
    };
  }
}

/**
 * Interface for navigation function from React Router
 */
export interface NavigateFunction {
  (to: string, options?: { replace?: boolean | undefined; state?: any } | undefined | undefined | undefined): void;
}

/**
 * Start a payment flow and redirect to checkout if successful
 *
 * @param options Payment options
 * @param navigate Optional React Router navigate function to use instead of window.location
 * @returns Success status and redirectUrl
 */
export async function checkout(
  options: PaymentOptions,
  navigate?: NavigateFunction
): Promise<{ success: boolean; redirectUrl?: string }> {
  try {
    const result = await processPayment(options);

    if (result.success && result.redirectUrl) {
      // Use React Router navigate if provided, otherwise fall back to window.location
      if (navigate && result.redirectUrl.startsWith('/')) {
        // Only use navigate for internal URLs
        navigate(result.redirectUrl);
      } else {
        // For external URLs or if navigate not provided, use window.location
        window.location.href = result.redirectUrl;
      }
      return { success: true, redirectUrl: result.redirectUrl };
    } else {
      safeToast.error(result.error || 'Payment initiation failed');
      return { success: false, };
    }
  } catch (error) {
    safeToast.error('Payment initiation failed');
    return { success: false, };
  }
}

/**
 * Verify a payment was successful
 *
 * @param sessionId Stripe session ID
 * @param paymentId Stripe payment intent ID
 * @returns Success status
 */
export async function verifyPayment(sessionId?: string, paymentId?: string): Promise<boolean> {
  try {
    if (!sessionId && !paymentId) {
      const urlParams = new URLSearchParams(window.location.search);
      sessionId = urlParams.get('session_id') || undefined;
      paymentId = urlParams.get('payment_intent') || undefined;
    }

    if (!sessionId && !paymentId) {
      return false;
    }

    // Verify with Stripe using new API (payment intent based)
    const verificationResult = await stripeAPI.verifyPaymentIntent(paymentId || '');

    if (verificationResult?.success) {
      safeToast.success('Payment successful!');
      return true;
    } else {
      safeToast.error('Payment verification failed');
      return false;
    }
  } catch (error) {
    handlePaymentError(error, 'Payment verification failed');
    return false;
  }
}

/**
 * Create a customer in the payment system
 *
 * @param email Customer email
 * @param name Optional customer name
 * @param metadata Optional metadata
 * @returns Customer ID or null if creation failed
 */
// Note: createCustomer helper removed because it relied on a non-existent stripeAPI.createCustomer.
// If needed, implement via a secured Edge Function and expose it in api/stripe.ts.

/**
 * Get payment methods for a customer
 *
 * @param customerId Customer ID
 * @returns Array of payment methods
 */
export async function getCustomerPaymentMethods(customerId: string): Promise<any[]> {
  try {
    const methods = await stripeAPI.listPaymentMethods(customerId);
    return methods;
  } catch (error) {
    handlePaymentError(error, 'Failed to load payment methods');
    return [];
  }
}

/**
 * Create a setup intent for saving payment methods
 *
 * @param customerId Customer ID
 * @returns Client secret for setup or null if creation failed
 */
// Note: createSetupIntent helper removed because it relied on a non-existent stripeAPI.createSetupIntent.
// Implement via Edge Function and add to api/stripe.ts if required.

// Export core types for direct usage
export type {
  TransactionType,
  TransactionStatus,
  PaymentMethodType,
  CheckoutSessionOptions,
  ConnectedCheckoutOptions,
} from './core/types';

// Consolidated formatters and validators
import { formatters, validators } from './index';
export { formatters, validators };

// Re-export payment types for convenience
export * from './types';

// Export these specific APIs
export { creditAPI, stripeAPI };

// Maintain backward compatibility by re-exporting from other modules
export { checkout as initiateCheckout } from './checkoutService';
export * from './standardCheckout';
export * from './connectedCheckout';
export * from './platformCredit';
export * from './verification';

import {
  getBalance,
  addCredit,
  deductCredit,
  processPlatformCredit,
  getTransactions,
  hasEnoughCredit,
} from './api/credit';
