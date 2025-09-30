/**
 * Main Stripe service - Re-exports stripe functionality
 */

// Re-export from the stripe client
export { stripeService as StripeClient } from './payment/stripe/client';
export type {
  StripeCheckoutOptions,
  StripeCustomerOptions,
  StripePaymentIntentOptions,
  StripeVerificationResult,
} from './payment/stripe/types';

// Create a default service instance
export class StripeService {
  static async createPaymentIntent(options: any) {
    // Basic implementation for compatibility
    console.log('Creating payment intent:', options);
    return {
      client_secret: 'mock_secret',
      id: 'mock_payment_intent',
    };
  }

  static async confirmPayment(paymentIntentId: string) {
    // Basic implementation for compatibility
    console.log('Confirming payment:', paymentIntentId);
    return {
      status: 'succeeded',
      id: paymentIntentId,
    };
  }

  static async createCustomer(options: any) {
    // Basic implementation for compatibility
    console.log('Creating customer:', options);
    return {
      id: 'mock_customer',
      email: options.email,
    };
  }

  static async retrievePaymentIntent(paymentIntentId: string) {
    // Basic implementation for compatibility
    console.log('Retrieving payment intent:', paymentIntentId);
    return {
      id: paymentIntentId,
      status: 'succeeded',
      amount: 0,
    };
  }
}

export default StripeService;
