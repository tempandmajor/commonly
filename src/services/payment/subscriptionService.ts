// Subscription service using the new subscription column in users table
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  plan: string;
  status: string;
  subscriptionId?: string | undefined;
  [key: string]: unknown;
}

export interface SubscriptionOptions {
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Get user subscription data
 */
export const getUserSubscription = async (userId: string): Promise<SubscriptionData | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return (data?.subscription as SubscriptionData) || null;
  } catch (error) {
    return null;
  }
};

/**
 * Update user subscription data
 */
export const updateUserSubscription = async (
  userId: string,
  subscriptionData: SubscriptionData
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        subscription: subscriptionData,
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
 * Cancel user subscription
 */
export const cancelUserSubscription = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        subscription: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    return false;
  }
};
