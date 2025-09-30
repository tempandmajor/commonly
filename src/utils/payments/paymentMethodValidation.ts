import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethodCheck {
  hasPaymentMethods: boolean;
  paymentMethods?: unknown[] | undefined;
}

/**
 * Check if a user has valid payment methods on file
 */
export const checkUserPaymentMethods = async (userId: string): Promise<PaymentMethodCheck> => {
  try {
    // Check if user has any payment methods stored
    const { data, error } = await supabase.functions.invoke('payment-handler', {
      body: {
        action: 'get-payment-methods',
        userId,
      },
    });

    if (error) {
      return { hasPaymentMethods: false };
    }

    const paymentMethods = data?.paymentMethods || [];
    return {
      hasPaymentMethods: paymentMethods.length > 0,
      paymentMethods,
    };
  } catch (error) {
    return { hasPaymentMethods: false };
  }
};
