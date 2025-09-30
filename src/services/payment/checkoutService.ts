import { safeToast } from '@/services/api/utils/safeToast';
import { initiateCheckout } from './stripeCheckout';
import { PaymentOptions, PaymentResult } from './types';
import { processPlatformCredit } from '@/services/platformCredit';
import { getEnvironmentConfig } from '@/utils/environmentConfig';

// Navigation function type from React Router
export interface NavigateFunction {
  (to: string, options?: { replace?: boolean | undefined; state?: any } | undefined | undefined | undefined): void;
}

// Create a checkout session and redirect to Stripe
export const checkout = async (
  options: PaymentOptions,
  navigate?: NavigateFunction
): Promise<{ success: boolean; redirectUrl?: string }> => {
  try {
    // Validate input
    if (!options.amount || options.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (!options.description) {
      options.description = 'Payment';
    }

    // Handle platform credit if applicable
    if (options.isPlatformFee && options.usePlatformCredit && options.userId) {
      try {
        const creditResult = await processPlatformCredit({
          amount: options.amount,
          currency: options.currency,
          paymentType: options.paymentType,
          description: options.description,
          isPlatformFee: options.isPlatformFee,
          metadata: options.metadata,
          customerId: options.userId,
          userId: options.userId,
          status: 'pending',
          title: options.title || options.description,
        });

        if (creditResult) {
          safeToast.success('Payment processed using platform credit');
          return { success: true };
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
    };

    // Initiate checkout with enhanced options
    const result = await initiateCheckout({
          ...options,
      metadata: enhancedMetadata,
    });

    if (result.success) {
      const redirectUrl = result.redirectUrl || result.url;
      if (redirectUrl) {
        // Use React Router navigate if provided and it's an internal URL, otherwise use window.location
        if (navigate && redirectUrl.startsWith('/')) {
          navigate(redirectUrl);
        } else {
          window.location.href = redirectUrl;
        }
        return { success: true, redirectUrl };
      }
      return { success: true };
    } else {
      throw new Error(result.error || 'Checkout failed');
    }
  } catch (error) {
    safeToast.error(error instanceof Error ? error.message : 'Payment processing failed');
    return { success: false };
  }
};

// Verify the payment was successful
export const verifyCheckoutPayment = async (
  sessionId?: string,
  paymentId?: string
): Promise<boolean> => {
  if (!sessionId && !paymentId) {
    return false;
  }

  try {
    // In a production app, you would verify with your backend
    // For demo purposes, we'll simulate a verification
    // Assume success for now, in production this would call your backend
    return true;
  } catch (error) {
    return false;
  }
};

// Export the initiateCheckout function
export { initiateCheckout };

// Make sure to export PaymentOptions from types for other modules to use
export type { PaymentOptions, PaymentResult };
