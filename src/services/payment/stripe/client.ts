/**
 * Stripe service client
 * Provides secure server-side communication with Stripe API
 */

// Removed environmentConfig usage; Supabase functions client is used directly
import type {
  StripeCheckoutOptions,
  StripeCustomerOptions,
  StripePaymentIntentOptions,
  StripeVerificationResult,
} from './types';
import { safeToast } from '@/services/api/utils/safeToast';
import { supabaseService } from '../../supabase';

// Cache to minimize redundant API calls
class StripeCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string, ttl = this.DEFAULT_TTL): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data as T;
    }
    return null;
  }

  set(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton cache instance
const cache = new StripeCache();

/**
 * StripeService class
 * Handles all interactions with the Stripe API through secure server-side functions
 */
class StripeService {
  /**
   * Create a Stripe checkout session
   * @param options - Checkout options
   * @returns URL to redirect to Stripe checkout
   */
  async createCheckoutSession(
    options: StripeCheckoutOptions
  ): Promise<{ url: string; sessionId: string } | null> {
    try {
      const response = await this.callStripeFunction('create-checkout-session', options);

      if (!response.url) {
        throw new Error('Failed to create checkout session');
      }

      return {
        url: response.url,
        sessionId: response.sessionId,
      };
    } catch (error) {
      safeToast.error('Payment processing failed. Please try again.');
      return null;
    }
  }

  /**
   * Create a Stripe customer
   * @param options - Customer creation options
   * @returns Customer ID
   */
  async createCustomer(options: StripeCustomerOptions): Promise<string | null> {
    try {
      // Check cache first
      const cacheKey = `customer:${options.email}`;
      const cachedCustomerId = cache.get<string>(cacheKey);

      if (cachedCustomerId) {
        return cachedCustomerId;
      }

      const response = await this.callStripeFunction('create-customer', options);

      if (!response.customerId) {
        throw new Error('Failed to create customer');
      }

      // Cache the customer ID
      cache.set(cacheKey, response.customerId);

      return response.customerId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a Stripe payment intent
   * @param options - Payment intent options
   * @returns Client secret for payment confirmation
   */
  async createPaymentIntent(options: StripePaymentIntentOptions): Promise<string | null> {
    try {
      const response = await this.callStripeFunction('create-payment-intent', options);

      if (!response.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      return response.clientSecret;
    } catch (error) {
      safeToast.error('Payment processing failed. Please try again.');
      return null;
    }
  }

  /**
   * Verify a Stripe payment
   * @param sessionId - Checkout session ID
   * @returns Verification result
   */
  async verifyPayment(sessionId: string): Promise<StripeVerificationResult> {
    try {
      // Check cache to prevent duplicate verifications
      const cacheKey = `verify:${sessionId}`;
      const cachedResult = cache.get<StripeVerificationResult>(cacheKey);

      if (cachedResult) {
        return cachedResult;
      }

      const response = await this.callStripeFunction('verify-payment', { sessionId });

      const result: StripeVerificationResult = {
        success: response.success,
        paymentId: response.paymentId,
        status: response.status,
        customerId: response.customerId,
        amount: response.amount,
        currency: response.currency,
        metadata: response.metadata,
      };

      // Cache successful verifications
      if (result.success) {
        cache.set(cacheKey, result);
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
   * Get customer payment methods
   * @param customerId - Stripe customer ID
   * @returns Array of payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<any[]> {
    try {
      // Check cache first
      const cacheKey = `payment-methods:${customerId}`;
      const cachedMethods = cache.get<any[]>(cacheKey);

      if (cachedMethods) {
        return cachedMethods;
      }

      const response = await this.callStripeFunction('get-payment-methods', { customerId });

      if (!response.paymentMethods) {
        return [];
      }

      // Cache payment methods
      cache.set(cacheKey, response.paymentMethods);

      return response.paymentMethods;
    } catch (error) {
      return [];
    }
  }

  /**
   * Create a setup intent for saving payment methods
   * @param customerId - Stripe customer ID
   * @returns Client secret for setup
   */
  async createSetupIntent(customerId: string): Promise<string | null> {
    try {
      const response = await this.callStripeFunction('create-setup-intent', { customerId });

      if (!response.clientSecret) {
        throw new Error('Failed to create setup intent');
      }

      return response.clientSecret;
    } catch (error) {
      safeToast.error('Payment setup failed. Please try again.');
      return null;
    }
  }

  /**
   * Private method to call Stripe edge functions
   * @param endpoint - Function endpoint
   * @param data - Request data
   * @returns Response data
   */
  private async callStripeFunction(endpoint: string, data: unknown): Promise<any> {
    try {
      const client = supabaseService.getRawClient();

      const { data: responseData, error } = await client.functions.invoke(`stripe/${endpoint}`, {
        body: JSON.stringify(data),
      });

      if (error) {
        throw new Error(`Stripe API error: ${error.message}`);
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  }
}

// Export a singleton instance
export const stripeService = new StripeService();
