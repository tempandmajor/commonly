import { PaymentOptions, PaymentResult } from './types';
import { handlePaymentError } from './utils/paymentUtils';
import { createPaymentRecord } from './utils/paymentRecord';
import { createCheckoutSession } from '@/services/payment/api/stripe';
import { safeToast } from '@/services/api/utils/safeToast';
import type { PaymentRecordData } from './types';

/**
 * Creates a standard checkout session for regular payments
 */
export const initiateStandardCheckout = async (options: PaymentOptions): Promise<PaymentResult> => {
  try {
    // Map PaymentOptions to PaymentRecordData shape expected by DB
    const paymentRecordInput: PaymentRecordData = {
      amount_in_cents: Math.round((options.amount || 0) * 100),
      currency: options.currency || 'usd',
      description: options.description || options.title || 'Payment',
      user_id: options.userId,
      customer_id: options.customerId,
      status: options.status || 'pending',
      payment_method: 'stripe',
      metadata: {
        paymentType: options.paymentType,
        productId: options.productId,
          ...options.metadata,
      },
      // Internal mapping fields preserved if utilities rely on them
      amount: options.amount,
      userId: options.userId,
      customerId: options.customerId,
      creatorId: options.creatorId,
      eventId: options.eventId,
    };

    const paymentRecord = await createPaymentRecord(paymentRecordInput);

    if (!paymentRecord) {
      throw new Error('Failed to create payment record');
    }

    // Create Stripe Checkout Session via canonical payment API
    if (!options.userId) {
      throw new Error('User not authenticated');
    }

    const session = await createCheckoutSession({
      userId: options.userId,
      amount: options.amount || 0,
      currency: options.currency || 'usd',
      description: options.title || options.description || 'Payment',
      // Use SPA-friendly relative URLs; callers can override via options if needed
      successUrl: '/payment-success',
      cancelUrl: '/payment-cancelled',
      metadata: {
        payment_id: String(paymentRecord.id) as string,
        payment_type: options.paymentType || 'standard',
          ...options.metadata,
      },
      paymentMethodTypes: ['card'],
    });

    if (!session?.checkoutUrl) {
      throw new Error('Failed to create checkout session');
    }

    safeToast.success('Payment session created successfully');
    return {
      success: true,
      redirectUrl: session.checkoutUrl as string,
      };
  } catch (error) {
    const errorMessage = handlePaymentError(error);
    safeToast.error(`Error processing payment: ${errorMessage}`);
    return {
      success: false,
      redirectUrl: null,
      error: errorMessage,
    };
  }
};
