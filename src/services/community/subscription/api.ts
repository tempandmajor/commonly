/**
 * API functions for community subscription management
 */
import { supabase } from '@/integrations/supabase/client';
import { createCheckoutSession } from '@/services/payment/api/stripe';
import StripeService from '@/services/stripe';
import { CommunitySubscriptionSettings, CommunitySubscriber } from '../types';

/**
 * Get subscription settings for a community
 */
export const getCommunitySubscriptionSettings = async (
  communityId: string
): Promise<CommunitySubscriptionSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('community_subscription_settings')
      .select('*')
      .eq('community_id', communityId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned"
        console.error('Error fetching community subscription settings:', error);
      }
      return null;
    }

    const typedData = data as any;
    return {
      communityId: typedData.community_id,
      isSubscriptionEnabled: typedData.is_subscription_enabled,
      monthlyPrice: typedData.monthly_price,
      yearlyPrice: typedData.yearly_price,
      currency: typedData.currency || 'usd',
      features: typedData.features || [],
      description: typedData.description,
      stripeProductId: typedData.stripe_product_id,
      stripePriceIdMonthly: typedData.stripe_price_id_monthly,
      stripePriceIdYearly: typedData.stripe_price_id_yearly,
    };
  } catch (error) {
    console.error('Error in getCommunitySubscriptionSettings:', error);
    return null;
  }
};

/**
 * Update subscription settings for a community
 */
export const updateCommunitySubscriptionSettings = async (
  communityId: string,
  settings: Partial<CommunitySubscriptionSettings>
): Promise<CommunitySubscriptionSettings | null> => {
  try {
    // First check if settings exist
    const existingSettings = await getCommunitySubscriptionSettings(communityId);

    const stripeService = new StripeService();

    // Create or update Stripe product and prices
    let stripeProductId = settings.stripeProductId || existingSettings?.stripeProductId;
    let stripePriceIdMonthly =
      settings.stripePriceIdMonthly || existingSettings?.stripePriceIdMonthly;
    let stripePriceIdYearly = settings.stripePriceIdYearly || existingSettings?.stripePriceIdYearly;

    if (settings.isSubscriptionEnabled) {
      // Create or update Stripe product
      if (!stripeProductId) {
        const productName = `Community Subscription: ${communityId}`;
        const product = await stripeService.createProduct(productName, settings.description || '');
        stripeProductId = product.id;
      }

      // Create or update monthly price
      if (
        settings.monthlyPrice &&
        (!stripePriceIdMonthly || settings.monthlyPrice !== existingSettings?.monthlyPrice)
      ) {
        const monthlyPrice = await stripeService.createPrice({
          productId: stripeProductId,
          amount: settings.monthlyPrice * 100, // Convert to cents
          currency: settings.currency || 'usd',
          interval: 'month',
        });
        stripePriceIdMonthly = monthlyPrice.id;
      }

      // Create or update yearly price
      if (
        settings.yearlyPrice &&
        (!stripePriceIdYearly || settings.yearlyPrice !== existingSettings?.yearlyPrice)
      ) {
        const yearlyPrice = await stripeService.createPrice({
          productId: stripeProductId,
          amount: settings.yearlyPrice * 100, // Convert to cents
          currency: settings.currency || 'usd',
          interval: 'year',
        });
        stripePriceIdYearly = yearlyPrice.id;
      }
    }

    const dbSettings = {
      community_id: communityId,
      is_subscription_enabled:
        settings.isSubscriptionEnabled ?? existingSettings?.isSubscriptionEnabled ?? false,
      monthly_price: settings.monthlyPrice ?? existingSettings?.monthlyPrice,
      yearly_price: settings.yearlyPrice ?? existingSettings?.yearlyPrice,
      currency: settings.currency ?? existingSettings?.currency ?? 'usd',
      features: settings.features ?? existingSettings?.features ?? [],
      description: settings.description ?? existingSettings?.description,
      ...(stripeProductId && { stripe_product_id: stripeProductId }),
      stripe_price_id_monthly: stripePriceIdMonthly,
      stripe_price_id_yearly: stripePriceIdYearly,
    };

    let result;

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('community_subscription_settings')
        .update(dbSettings)
        .eq('community_id', communityId)
        .select()
        .single();

      if (error) {
        console.error('Error updating community subscription settings:', error);
        return null;
      }

      result = data;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('community_subscription_settings')
        .insert(dbSettings)
        .select()
        .single();

      if (error) {
        console.error('Error creating community subscription settings:', error);
        return null;
      }

      result = data;
    }

    const typedResult = result as any;
    return {
      communityId: typedResult.community_id,
      isSubscriptionEnabled: typedResult.is_subscription_enabled,
      monthlyPrice: typedResult.monthly_price,
      yearlyPrice: typedResult.yearly_price,
      currency: typedResult.currency,
      features: typedResult.features,
      description: typedResult.description,
      stripeProductId: typedResult.stripe_product_id,
      stripePriceIdMonthly: typedResult.stripe_price_id_monthly,
      stripePriceIdYearly: typedResult.stripe_price_id_yearly,
    };
  } catch (error) {
    console.error('Error in updateCommunitySubscriptionSettings:', error);
    return null;
  }
};

/**
 * Get subscribers for a community
 */
export const getCommunitySubscribers = async (
  communityId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ subscribers: CommunitySubscriber[]; total: number; hasMore: boolean }> => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('community_subscribers')
      .select('*', { count: 'exact' })
      .eq('community_id', communityId)
      .range(from, to);

    if (error) {
      console.error('Error fetching community subscribers:', error);
      return { subscribers: [], total: 0, hasMore: false };
    }

    const subscribers: CommunitySubscriber[] = data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      communityId: item.community_id,
      subscriptionId: item.subscription_id,
      status: item.status,
      currentPeriodStart: new Date(item.current_period_start),
      currentPeriodEnd: new Date(item.current_period_end),
      cancelAt: item.cancel_at ? new Date(item.cancel_at) : null,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));

    return {
      subscribers,
      total: count || 0,
      hasMore: count ? from + data.length < count : false,
    };

  } catch (error) {
    console.error('Error in getCommunitySubscribers:', error);
    return { subscribers: [], total: 0, hasMore: false };
  }

};

/**
 * Subscribe to a community
 */
export const subscribeToCommunity = async (
  communityId: string,
  userId: string,
  interval: 'month' | 'year'
): Promise<boolean> => {
  try {
    // Get subscription settings
    const settings = await getCommunitySubscriptionSettings(communityId);

    if (!settings || !settings.isSubscriptionEnabled) {
      console.error('Community does not have subscriptions enabled');
      return false;
    }

    const priceId =
      interval === 'month' ? settings.stripePriceIdMonthly : settings.stripePriceIdYearly;

    if (!priceId) {
      console.error(`No price ID found for ${interval}ly subscription`);
      return false;
    }

    // Create checkout session via canonical payment API
    const session = await createCheckoutSession({
      userId,
      amount: 0, // price handled by Stripe priceId via metadata or server logic
      description: `Community subscription (${interval})`,
      successUrl: `${window.location.origin}/communities/${communityId}?subscription=success`,
      cancelUrl: `${window.location.origin}/communities/${communityId}?subscription=canceled`,
      metadata: {
        communityId,
        userId,
        type: 'community_subscription',
        interval,
        priceId,
      },
    });

    if (!session || !session.checkoutUrl) {
      console.error('Failed to create checkout session');
      return false;
    }

    // Redirect to checkout
    window.location.href = session.checkoutUrl;
    return true;
  } catch (error) {
    console.error('Error in subscribeToCommunity:', error);
    return false;
  }
};

/**
 * Unsubscribe from a community
 */
export const unsubscribeFromCommunity = async (
  communityId: string,
  userId: string
): Promise<boolean> => {
  try {
    // Find the subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('community_subscribers')
      .select('subscription_id')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single();

    if (subscriptionError || !subscriptionData) {
      console.error('Error finding community subscription:', subscriptionError);
      return false;
    }

    // Cancel the subscription in Stripe
    const stripeService = new StripeService();
    const success = await stripeService.cancelSubscription(subscriptionData.subscription_id);

    if (!success) {
      console.error('Failed to cancel subscription in Stripe');
      return false;
    }

    // Update the subscription status in the database
    const { error: updateError } = await supabase
      .from('community_subscribers')
      .update({ status: 'canceled' })
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in unsubscribeFromCommunity:', error);
    return false;
  }
};

/**
 * Create a recurring event for community subscribers
 */
export const createCommunityEvent = async (
  communityId: string,
  eventData: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    isVirtual: boolean;
    meetingUrl?: string;
  }
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('community_events')
      .insert({
        community_id: communityId,
        title: eventData.title,
        description: eventData.description,
        start_date: eventData.startDate.toISOString(),
        end_date: eventData.endDate.toISOString(),
        location: eventData.location,
        is_virtual: eventData.isVirtual,
        meeting_url: eventData.meetingUrl,
        is_subscribers_only: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating community event:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createCommunityEvent:', error);
    return null;
  }
};

/**
 * Get events for a community
 */
export const getCommunityEvents = async (
  communityId: string,
  includeSubscribersOnly: boolean = false,
  userId?: string
): Promise<any[]> => {
  try {
    let query = supabase.from('community_events').select('*').eq('community_id', communityId);

    if (!includeSubscribersOnly) {
      query = query.eq('is_subscribers_only', false);
    } else if (userId) {
      // Check if user is a subscriber
      const { data: isSubscriber } = await supabase
        .from('community_subscribers')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!isSubscriber) {
        // User is not a subscriber, filter out subscribers-only events
        query = query.eq('is_subscribers_only', false);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching community events:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error in getCommunityEvents:', error);
    return [];
  }
};
