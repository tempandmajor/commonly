// Payment preferences service using the new payment_settings column
import { supabase } from '@/integrations/supabase/client';

export interface PaymentPreferences {
  defaultPaymentMethod?: string | undefined;
  savePaymentMethod?: boolean | undefined;
  currency?: string | undefined;
  locale?: string | undefined;
}

/**
 * Gets payment preferences for a user
 */
export const getPaymentPreferences = async (userId: string): Promise<PaymentPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('payment_settings')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (data?.payment_settings) {
      return data.payment_settings as PaymentPreferences;
    }

    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Updates payment preferences for a user
 */
export const updatePaymentPreferences = async (
  userId: string,
  preferences: PaymentPreferences
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        payment_settings: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Retrieves payment history for a user
 */
export const getPaymentHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('PaymentsTest')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw error;
  }
};
