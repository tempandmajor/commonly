/**
 * Stripe Checkout Service
 */

export interface CheckoutSession {
  id: string;
  url: string;
  status: 'open' | 'complete' | 'expired';
  customer?: string | undefined;
  payment_intent?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface CreateCheckoutSessionOptions {
  line_items: Array<{
    price?: string | undefined;
    price_data?: {
      currency: string | undefined;
      product_data: {
        name: string;
        description?: string | undefined;
      };
      unit_amount: number;
    };
    quantity: number;
  }>;
  mode: 'payment' | 'subscription' | 'setup';
  success_url: string;
  cancel_url: string;
  customer?: string;
  customer_email?: string;
  metadata?: Record<string, any>;
  allow_promotion_codes?: boolean;
  billing_address_collection?: 'auto' | 'required';
  payment_method_types?: string[];
}

export class StripeCheckoutService {
  static async createSession(options: CreateCheckoutSessionOptions): Promise<CheckoutSession> {
    console.log('Creating checkout session:', options);

    return {
      id: 'cs_mock_' + Date.now(),
      url: `https://checkout.stripe.com/pay/mock-session`,
      status: 'open',
      customer: options.customer,
      metadata: options.metadata,
    };
  }

  static async retrieveSession(sessionId: string): Promise<CheckoutSession> {
    console.log('Retrieving checkout session:', sessionId);

    return {
      id: sessionId,
      url: `https://checkout.stripe.com/pay/${sessionId}`,
      status: 'complete',
      payment_intent: 'pi_mock',
    };
  }

  static async listSessions(customerId?: string): Promise<CheckoutSession[]> {
    console.log('Listing checkout sessions for customer:', customerId);

    return [];
  }

  static async expireSession(sessionId: string): Promise<CheckoutSession> {
    console.log('Expiring checkout session:', sessionId);

    const session = await this.retrieveSession(sessionId);
    return { ...session, status: 'expired' };
  }
}

// Additional convenience function
export const initiateCheckout = (options: CreateCheckoutSessionOptions) =>
  StripeCheckoutService.createSession(options);

export default StripeCheckoutService;
