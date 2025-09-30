import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { handleError } from '@/utils/errorUtils';

export interface PaymentMethod {
  id: string;
  type: string;
  isDefault: boolean;
  details: {
    brand?: string | undefined;
    last4?: string | undefined;
    expMonth?: number | undefined;
    expYear?: number | undefined;
    bankName?: string | undefined;
  };
}

export const createPaymentMethod = async (userId: string, cardDetails: unknown): Promise<any> => {
  try {
    const { data, error } = await supabase.functions.invoke('createStripePaymentMethod', {
      body: { userId, cardDetails },
    });

    if (error) throw error;

    return data;
  } catch (error: unknown) {
    handleError(error, { userId, cardDetails }, error.message || 'Failed to create payment method');
    return null;
  }
};

/**
 * Add a credit card as a payment method
 * @param cardElement - Stripe card element from the React Stripe.js library
 * @returns Payment method ID if successful, null otherwise
 */
export const addCardPaymentMethod = async (cardElement: unknown): Promise<string | null> => {
  try {
    const stripe = await import('@stripe/stripe-js');
    const user = await supabase.auth.getUser();

    if (!user.data.user) {
      toast.error('You must be logged in to add a payment method');
      return null;
    }

    // First create the payment method with Stripe directly
    const cardResult = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (cardResult.error) {
      toast.error(cardResult.error.message || 'Failed to process card');
      return null;
    }

    // Then attach it to the customer via our edge function
    const { data, error } = await supabase.functions.invoke('attachStripePaymentMethod', {
      body: {
        userId: user.data.user.id,
        paymentMethodId: cardResult.paymentMethod.id,
      },
    });

    if (error) throw error;

    toast.success('Card added successfully!');
    return cardResult.paymentMethod.id;
  } catch (error) {
    handleError(error, {}, 'Failed to add card payment method');
    return null;
  }
};

/**
 * Add a bank account as a payment method
 * @param userId - User ID
 * @param bankToken - Stripe bank account token
 * @param bankName - Display name for the bank
 * @param accountLast4 - Last 4 digits of the account number
 * @returns Payment method ID if successful, null otherwise
 */
export const addBankAccountPaymentMethod = async (
  userId: string,
  bankToken: string,
  bankName: string,
  accountLast4: string
): Promise<string | null> => {
  try {
    // Use the edge function to create and attach the bank account payment method
    const { data, error } = await supabase.functions.invoke('createBankAccountPaymentMethod', {
      body: {
        userId,
        bankToken,
        bankName,
        accountLast4,
      },
    });

    if (error) throw error;

    toast.success('Bank account added successfully!');
    return data?.paymentMethodId || null;
  } catch (error) {
    handleError(error, { userId, bankName }, 'Failed to add bank account payment method');
    return null;
  }
};

export const setDefaultPaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('setDefaultStripePaymentMethod', {
      body: { userId, paymentMethodId },
    });

    if (error) throw error;

    toast.success('Default payment method updated successfully!');
    return true;
  } catch (error: unknown) {
    handleError(
      error,
      { userId, paymentMethodId },
      error.message || 'Failed to set default payment method'
    );
    return false;
  }
};

export const getDefaultPaymentMethod = async (userId: string): Promise<PaymentMethod | null> => {
  try {
    const methods = await getPaymentMethods(userId);
    return methods.find(m => m.isDefault) || null;
  } catch (error) {
    return null;
  }
};

export const getPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('getStripePaymentMethods', {
      body: { userId },
    });

    if (error) throw error;

    if (!data) {
      return [];
    }

    // Handle both formats: direct array or nested in 'paymentMethods'
    const methods = Array.isArray(data) ? data : (data as unknown).paymentMethods || [];

    return methods;
  } catch (error) {
    handleError(error, { userId }, 'Failed to load payment methods. Please try again later.');
    return [];
  }
};

export const removePaymentMethod = async (
  userId: string,
  paymentMethodId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('deleteStripePaymentMethod', {
      body: { userId, paymentMethodId },
    });

    if (error) throw error;

    toast.success('Payment method deleted successfully!');
    return true;
  } catch (error: unknown) {
    handleError(
      error,
      { userId, paymentMethodId },
      error.message || 'Failed to delete payment method'
    );
    return false;
  }
};
