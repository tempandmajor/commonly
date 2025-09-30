import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import type {
  CommunitySubscriptionSettings as CommunitySubscriptionSettingsType,
  CommunitySubscriber,
} from '@/lib/types/community';
import {
  getCommunitySubscriptionSettings,
  getUserCommunitySubscription,
  createCommunitySubscription,
  cancelCommunitySubscription,
  updateCommunitySubscriptionSettings,
  getCommunitySubscribers,
} from '@/services/communitySubscriptionService';
import { toast } from 'sonner';

interface UseCommunitySubscriptionOptions {
  communityId: string;
  autoLoad?: boolean | undefined;
}

export const useCommunitySubscription = ({
  communityId,
  autoLoad = true,
}: UseCommunitySubscriptionOptions) => {
  const { user } = useAuth();
  const [subscriptionSettings, setSubscriptionSettings] =
    useState<CommunitySubscriptionSettingsType | null>(null);
  const [userSubscription, setUserSubscription] = useState<CommunitySubscriber | null>(null);
  const [subscribers, setSubscribers] = useState<CommunitySubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load subscription data
  const loadSubscriptionData = useCallback(async () => {
    if (!communityId) return;

    setIsLoading(true);
    try {
      // Load subscription settings
      const settings = await getCommunitySubscriptionSettings(communityId);
      setSubscriptionSettings(settings);

      // Load user's subscription status if logged in
      if (user) {
        const subscription = await getUserCommunitySubscription(user.id, communityId);
        setUserSubscription(subscription);
      }
    } catch (error) {
      toast.error('Failed to load subscription information');
    } finally {
      setIsLoading(false);
    }
  }, [communityId, user]);

  // Load subscribers (for admins)
  const loadSubscribers = useCallback(async () => {
    if (!communityId) return;

    try {
      const subscribersList = await getCommunitySubscribers(communityId);
      setSubscribers(subscribersList);
    } catch (error) {
      toast.error('Failed to load subscribers');
    }
  }, [communityId]);

  // Subscribe to community
  const subscribe = useCallback(
    async (subscriptionType: 'monthly' | 'yearly', paymentMethodId: string): Promise<boolean> => {
      if (!user || !subscriptionSettings) {
        toast.error('Unable to process subscription');
        return false;
      }

      setIsProcessing(true);
      try {
        const price =
          subscriptionType === 'monthly'
            ? subscriptionSettings.monthlyPrice
            : subscriptionSettings.yearlyPrice;

        const subscriptionId = await createCommunitySubscription({
          communityId,
          userId: user.id,
          subscriptionType,
          paymentMethodId,
          price,
        });

        if (subscriptionId) {
          // Refresh subscription status
          await loadSubscriptionData();
          toast.success('Successfully subscribed to community events!');
          return true;
        }
        return false;
      } catch (error) {
        toast.error('Failed to process subscription');
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [user, subscriptionSettings, communityId, loadSubscriptionData]
  );

  // Cancel subscription
  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    if (!userSubscription || !user) {
      toast.error('No active subscription found');
      return false;
    }

    setIsProcessing(true);
    try {
      const success = await cancelCommunitySubscription(userSubscription.id, user.id);
      if (success) {
        setUserSubscription(null);
        toast.success('Subscription cancelled successfully');
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Failed to cancel subscription');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [userSubscription, user]);

  // Update subscription settings (for admins)
  const updateSettings = useCallback(
    async (settings: CommunitySubscriptionSettingsType): Promise<boolean> => {
      if (!user) {
        toast.error('You must be logged in to update settings');
        return false;
      }

      setIsProcessing(true);
      try {
        const success = await updateCommunitySubscriptionSettings({
          communityId,
          settings,
          userId: user.id,
        });

        if (success) {
          setSubscriptionSettings(settings);
          return true;
        }
        return false;
      } catch (error) {
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [communityId, user]
  );

  // Check if user is subscribed
  const isSubscribed = Boolean(userSubscription && userSubscription.status === 'active');

  // Check if subscriptions are enabled
  const subscriptionsEnabled = Boolean(subscriptionSettings?.enabled);

  // Get subscription status
  const getSubscriptionStatus = useCallback(() => {
    if (!userSubscription) return 'none';
    return userSubscription.status;
  }, [userSubscription]);

  // Get next billing date
  const getNextBillingDate = useCallback(() => {
    if (!userSubscription) return null;
    return new Date(userSubscription.nextBillingDate);
  }, [userSubscription]);

  // Get subscription type
  const getSubscriptionType = useCallback(() => {
    if (!userSubscription) return null;
    return userSubscription.subscriptionType;
  }, [userSubscription]);

  // Calculate savings for yearly subscription
  const calculateYearlyDiscount = useCallback(() => {
    if (!subscriptionSettings) return { savings: 0, percentage: 0 };

    const monthlyTotal = subscriptionSettings.monthlyPrice * 12;
    const savings = monthlyTotal - subscriptionSettings.yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { savings, percentage };
  }, [subscriptionSettings]);

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadSubscriptionData();
    }
  }, [autoLoad, loadSubscriptionData]);

  return {
    // State
    subscriptionSettings,
    userSubscription,
    subscribers,
    isLoading,
    isProcessing,

    // Computed values
    isSubscribed,
    subscriptionsEnabled,

    // Actions
    subscribe,
    cancelSubscription,
    updateSettings,
    loadSubscriptionData,
    loadSubscribers,

    // Getters
    getSubscriptionStatus,
    getNextBillingDate,
    getSubscriptionType,
    calculateYearlyDiscount,
  };
};
