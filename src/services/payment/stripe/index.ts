/**
 * Stripe Service
 *
 * Provides complete Stripe payment processing functionality following the standard
 * service consolidation pattern established in the codebase.
 */

import { safeToast } from '@/services/api/utils/safeToast';
import { stripeService } from './client';
import { createCheckoutSession as createCanonicalCheckout } from '@/services/payment/api/stripe';
import type {
  StripeCheckoutOptions,
  StripeCustomerOptions,
  StripePaymentIntentOptions,
  StripeVerificationResult,
} from './types';
import { PaymentOptions, PaymentResult, PaymentStatus, PaymentRecordData } from '../types';
import { createPaymentRecord } from '../utils/paymentRecord';

/**
 * Create a Stripe checkout session
 *
 * @param options Payment options for checkout
 * @returns PaymentResult with success status and redirect URL
 */
/**
 * @deprecated Use payment/api/stripe#createCheckoutSession for session creation.
 * This function delegates to the canonical API and preserves the original return shape.
 */
export async function createStripeCheckout(options: PaymentOptions): Promise<PaymentResult> {
  try {
    // Validate required options
    if (!options.amount || options.amount <= 0) {
      return { success: false, error: 'Invalid payment amount', redirectUrl: null };
    }

    if (!options.successUrl || !options.cancelUrl) {
      return { success: false, error: 'Missing success or cancel URLs', redirectUrl: null };
    }

    // Format options for Stripe
    const checkoutOptions: StripeCheckoutOptions = {
      amount: options.amount,
      currency: options.currency,
      description: options.description || 'Payment',
      successUrl: options.successUrl,
      cancelUrl: options.cancelUrl,
      customerId: options.customerId,
      metadata: {
          ...options.metadata,
        userId: options.userId || '',
        paymentType: options.paymentType,
        creatorId: options.creatorId || '',
        eventId: options.eventId || '',
      },
      paymentType: options.paymentType,
    };

    // Handle connected account if creator ID is provided
    if (options.creatorId) {
      checkoutOptions.connectedAccountId = options.creatorId;

      if (options.isPlatformFee) {
        checkoutOptions.applicationFeeAmount = calculateApplicationFee(
          options.amount,
          options.paymentType
        );
      }
    }

    // Create the checkout session via canonical API
    const session = await createCanonicalCheckout({
      userId: options.userId || '',
      amount: options.amount,
      currency: options.currency,
      description: options.description || 'Payment',
      successUrl: options.successUrl!,
      cancelUrl: options.cancelUrl!,
      metadata: checkoutOptions.metadata as Record<string, any>,
      paymentMethodTypes: ['card'],
    });

    if (!session) {
      return { success: false, error: 'Failed to create checkout session', redirectUrl: null };
    }

    // Create a payment record in the database
    const paymentRecord: PaymentRecordData = {
      amount_in_cents: Math.round(options.amount * 100),
      amount: options.amount,
      currency: options.currency,
      description: options.description || 'Payment',
      userId: options.userId,
      customerId: options.customerId,
      status: 'pending',
      metadata: {
        sessionId: session.sessionId,
        paymentType: options.paymentType,
        creatorId: options.creatorId,
        eventId: options.eventId,
          ...options.metadata,
      },
    };

    await createPaymentRecord(paymentRecord);

    return {
      success: true,
      redirectUrl: session.checkoutUrl,
      transactionId: session.sessionId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
      redirectUrl: null,
    };
  }
}

/**
 * Create a Stripe customer
 *
 * @param options Customer creation options
 * @returns Customer ID or null if creation failed
 */
export async function createStripeCustomer(options: StripeCustomerOptions): Promise<string | null> {
  return stripeService.createCustomer(options);
}

/**
 * Create a Stripe payment intent
 *
 * @param options Payment intent options
 * @returns Client secret for payment confirmation
 */
export async function createStripePaymentIntent(
  options: StripePaymentIntentOptions
): Promise<string | null> {
  return stripeService.createPaymentIntent(options);
}

/**
 * Verify a Stripe payment
 *
 * @param sessionId Checkout session ID
 * @returns Verification result
 */
export async function verifyStripePayment(sessionId: string): Promise<StripeVerificationResult> {
  try {
    // Verify the payment with Stripe
    const result = await stripeService.verifyPayment(sessionId);

    if (result.success) {
      // Update payment record in the database
      await updatePaymentStatus(sessionId, result.status || 'completed', result.paymentId);

      return result;
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed',
    };
  }
}

/**
 * Process a Stripe checkout
 *
 * @param options Payment options
 * @returns Success status
 */
export interface NavigateFunction {
  (to: string, options?: { replace?: boolean | undefined; state?: any } | undefined | undefined | undefined): void;
}
export async function processStripeCheckout(
  options: PaymentOptions,
  navigate?: NavigateFunction
): Promise<boolean> {
  try {
    const result = await createStripeCheckout(options);

    if (result.success && result.redirectUrl) {
      // Prefer SPA navigation for internal URLs
      if (navigate && result.redirectUrl.startsWith('/')) {
        navigate(result.redirectUrl);
      } else {
        window.location.href = result.redirectUrl;
      }
      return true;
    } else {
      safeToast.error(result.error || 'Payment processing failed');
      return false;
    }
  } catch (error) {
    safeToast.error(error instanceof Error ? error.message : 'Payment processing failed');
    return false;
  }
}

/**
 * Update a payment status in the database
 *
 * @param sessionId Checkout session ID
 * @param status New payment status
 * @param paymentId Payment ID from Stripe
 */
async function updatePaymentStatus(
  sessionId: string,
  status: PaymentStatus,
  paymentId?: string
): Promise<void> {
  try {
    // Find the payment record by session ID
    const { data } = await supabaseService.executeRawQuery<any[]>(async () => {
      const response = await supabaseService
        .getRawClient()
        .from('payments')
        .select('id')
        .filter('metadata->sessionId', 'eq', sessionId)
        .limit(1);
      return response;
    });

    if (!data || data.length === 0) {
      return;
    }

    // Update the payment status
    await supabaseService.update('payments', data[0].id, {
      status,
      payment_id: paymentId,
      updated_at: new Date().toISOString(),
    });
  } catch (_error) {
    // Error handling silently ignored
  }
}

/**
 * Calculate application fee for the platform
 *
 * @param amount Payment amount
 * @param paymentType Type of payment
 * @returns Application fee amount
 */
function calculateApplicationFee(amount: number, paymentType: string): number {
  // Default fee is 10%
  let feePercentage = 0.1;

  // Different fee structure based on payment type
  switch (paymentType) {
    case 'subscription':
      feePercentage = 0.15; // 15% for subscriptions
      break;
    case 'event':
      feePercentage = 0.08; // 8% for events
      break;
    case 'donation':
      feePercentage = 0.05; // 5% for donations
      break;
    default:
      feePercentage = 0.1; // 10% default
  }

  // Calculate and round to nearest cent
  return Math.round(amount * feePercentage);
}

// Import supabaseService for database operations

// Re-export types
export * from './types';

// Export the client
export { stripeService };

// Create backward compatibility layer
export const stripePaymentService = {
  createCheckout: createStripeCheckout,
  processCheckout: processStripeCheckout,
  verifyPayment: verifyStripePayment,
  createCustomer: createStripeCustomer,
  createPaymentIntent: createStripePaymentIntent,
};
