import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  tier: string;
  status: string;
  expiresAt: string | null;
}

interface UserSubscription {
  subscription: SubscriptionData | null;
}

export const checkUserSubscription = async (userId: string): Promise<boolean> => {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('subscription')
      .eq('id', userId)
      .single();

    if (error) {
      return false;
    }

    // Handle the case where subscription data might not exist or be null
    if (!userData || !userData.subscription) {
      return false;
    }

    const subscription = userData.subscription as unknown;

    if (subscription && typeof subscription === 'object') {
      return (
        subscription.tier === 'pro' &&
        subscription.status === 'active' &&
        (subscription.expiresAt ? new Date(subscription.expiresAt) > new Date() : false)
      );
    }

    return false;
  } catch (error) {
    return false;
  }
};
