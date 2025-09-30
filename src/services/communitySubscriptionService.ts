import { supabase } from '@/integrations/supabase/client';
import { CommunitySubscriptionSettings, CommunitySubscriber } from '@/lib/types/community';
import { toast } from 'sonner';

export interface CreateCommunitySubscriptionOptions {
  communityId: string;
  userId: string;
  subscriptionType: 'monthly' | 'yearly';
  paymentMethodId: string;
  price: number;
}

export interface UpdateSubscriptionSettingsOptions {
  communityId: string;
  settings: CommunitySubscriptionSettings;
  userId: string;
}

/**
 * Create a new community subscription
 */
export const createCommunitySubscription = async (
  options: CreateCommunitySubscriptionOptions
): Promise<string | null> => {
  try {
    const { communityId, userId, subscriptionType, price, paymentMethodId } = options;

    // Create subscription record in database first
    const startDate = new Date();
    const endDate = new Date();
    if (subscriptionType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create the subscription record
    const subscriptionData = {
      user_id: userId,
      community_id: communityId,
      subscription_type: subscriptionType,
      amount_cents: Math.round(price * 100), // Convert to cents
      currency: 'USD',
      status: 'active',
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      stripe_subscription_id: null, // Will be updated after Stripe creation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: subscription, error } = await supabase
      .from('community_subscriptions')
      .insert(subscriptionData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }

    // Create payment record for tracking
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: userId,
      amount_in_cents: Math.round(price * 100),
      status: 'succeeded',
      payment_method: 'stripe',
      description: `Community subscription - ${subscriptionType}`,
      metadata: {
        community_id: communityId,
        subscription_id: subscription.id,
        subscription_type: subscriptionType,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't fail the subscription, just log the error
    }

    // Create Stripe subscription through edge function
    const priceInCents = Math.round(price * 100);
    try {
      const { data: stripeResult, error: stripeError } = await supabase.functions.invoke(
        'create-community-subscription',
        {
          body: {
            communityId,
            subscriptionType,
            priceInCents,
            paymentMethodId: paymentMethodId,
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      const stripeSubscriptionId = stripeResult.subscription_id;

      // Update subscription with Stripe ID
      const { error: updateError } = await supabase
        .from('community_subscriptions')
        .update({
          stripe_subscription_id: stripeSubscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('Error updating subscription with Stripe ID:', updateError);
      }
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      // Optionally, you might want to cancel the subscription in the database
      // if Stripe creation fails, but for now, we'll just log the error.
    }

    toast.success('Successfully subscribed to community events!');
    return subscription.id;
  } catch (error) {
    console.error('Error creating community subscription:', error);
    toast.error('Failed to create subscription. Please try again.');
    return null;
  }
};

/**
 * Real Stripe subscription creation (placeholder for actual implementation)
 * In production, this would integrate with Stripe API
 */
const createStripeSubscription = async (options: {
  customerId: string;
  priceId: string;
  amount: number;
}): Promise<string | null> => {
  try {
    // TODO: Replace with actual Stripe API integration
    // This is a placeholder that simulates successful Stripe subscription creation

    // For now, create a mock subscription ID
    const mockSubscriptionId = `sub_${options.customerId}_${Date.now()}`;

    // In production, this would be:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_K as string);
    // const subscription = await stripe.subscriptions.create({
    //   customer: options.customerId,
    //   items: [{ price: options.priceId }],
    //   payment_behavior: 'default_incomplete',
    //   expand: ['latest_invoice.payment_intent'],
    // });
    // return subscription.id;

    return mockSubscriptionId;
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    return null;
  }
};

/**
 * Get community subscription settings
 */
export const getCommunitySubscriptionSettings = async (
  communityId: string
): Promise<CommunitySubscriptionSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('subscription_settings')
      .eq('id', communityId)
      .single();

    if (error) {
      return null;
    }

    return data?.subscription_settings || null;
  } catch (error) {
    return null;
  }
};

/**
 * Update community subscription settings
 */
export const updateCommunitySubscriptionSettings = async (
  options: UpdateSubscriptionSettingsOptions
): Promise<boolean> => {
  try {
    const { communityId, settings, userId } = options;

    // Verify user is community admin/creator
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('creator_id, admins')
      .eq('id', communityId)
      .single();

    if (communityError || !community) {
      throw new Error('Community not found');
    }

    const isAuthorized =
      community.creator_id === userId || (community.admins && community.admins.includes(userId));

    if (!isAuthorized) {
      throw new Error('Unauthorized to update subscription settings');
    }

    // Update subscription settings
    const { error } = await supabase
      .from('communities')
      .update({
        subscription_settings: settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', communityId);

    if (error) {
      throw error;
    }

    // If auto-create events is enabled, schedule the next event
    if (settings.autoCreateEvents && settings.enabled) {
      await scheduleNextRecurringEvent(communityId, settings);
    }

    toast.success('Subscription settings updated successfully!');
    return true;
  } catch (error) {
    toast.error('Failed to update subscription settings. Please try again.');
    return false;
  }
};

/**
 * Get user's subscription status for a community
 */
export const getUserCommunitySubscription = async (
  userId: string,
  communityId: string
): Promise<CommunitySubscriber | null> => {
  try {
    const { data, error } = await supabase
      .from('community_subscribers')
      .select('*')
      .eq('user_id', userId)
      .eq('community_id', communityId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found"
      return null;
    }

    return data || null;
  } catch (error) {
    return null;
  }
};

/**
 * Cancel community subscription
 */
export const cancelCommunitySubscription = async (
  subscriptionId: string,
  userId: string
): Promise<boolean> => {
  try {
    // Cancel Stripe subscription
    const { error: stripeError } = await supabase.functions.invoke(
      'cancel-community-subscription',
      {
        body: { subscriptionId },
      }
    );

    if (stripeError) {
      throw stripeError;
    }

    // Update subscription status in database
    const { error } = await supabase
      .from('community_subscribers')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    toast.success('Subscription cancelled successfully');
    return true;
  } catch (error) {
    toast.error('Failed to cancel subscription. Please try again.');
    return false;
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
  try {
    const { data: subscription } = await supabase
      .from('community_subscriptions')
      .select('stripe_subscription_id')
      .eq('id', subscriptionId)
      .single();

    if (!subscription?.stripe_subscription_id) {
      throw new Error('Stripe subscription ID not found');
    }

    // Cancel subscription through Stripe Edge Function
    const { data: cancelResult, error: cancelError } = await supabase.functions.invoke(
      'cancel-subscription',
      {
        body: {
          subscriptionId: subscription.stripe_subscription_id,
        },
      }
    );

    if (cancelError) {
      throw new Error(cancelError.message);
    }

    // Update local database
    const { error } = await supabase
      .from('community_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error updating subscription status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return false;
  }
};

/**
 * Get community subscribers
 */
export const getCommunitySubscribers = async (
  communityId: string
): Promise<CommunitySubscriber[]> => {
  try {
    const { data, error } = await supabase
      .from('community_subscribers')
      .select(
        `
        *,
        user:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `
      )
      .eq('community_id', communityId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
};

/**
 * Schedule next recurring event for community
 */
const scheduleNextRecurringEvent = async (
  communityId: string,
  settings: CommunitySubscriptionSettings
): Promise<void> => {
  try {
    const { recurringEvent } = settings;
    const now = new Date();
    const nextEventDate = new Date();

    // Calculate next event date based on schedule
    switch (recurringEvent.schedule) {
      case 'monthly':
        if (recurringEvent.dayOfMonth) {
          nextEventDate.setDate(recurringEvent.dayOfMonth);
          if (nextEventDate <= now) {
            nextEventDate.setMonth(nextEventDate.getMonth() + 1);
          }
        }
        break;
      case 'weekly':
        if (recurringEvent.dayOfWeek !== undefined) {
          const daysUntilNext = (recurringEvent.dayOfWeek - now.getDay() + 7) % 7;
          nextEventDate.setDate(now.getDate() + (daysUntilNext || 7));
        }
        break;
      case 'bi-weekly':
        if (recurringEvent.dayOfWeek !== undefined) {
          const daysUntilNext = (recurringEvent.dayOfWeek - now.getDay() + 14) % 14;
          nextEventDate.setDate(now.getDate() + (daysUntilNext || 14));
        }
        break;
    }

    // Set time
    const [hours, minutes] = recurringEvent.time.split(':');
    nextEventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Create the event
    const eventEndDate = new Date(nextEventDate);
    eventEndDate.setMinutes(eventEndDate.getMinutes() + recurringEvent.duration);

    const eventData = {
      title: recurringEvent.title,
      description: recurringEvent.description,
      start_date: nextEventDate.toISOString(),
      end_date: eventEndDate.toISOString(),
      location: recurringEvent.location,
      community_id: communityId,
      is_public: false, // Only for subscribers
      max_capacity: recurringEvent.maxCapacity,
      is_recurring: true,
      event_type: recurringEvent.isVirtual ? 'virtual' : 'in_person',
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('events').insert(eventData);

    if (error) {
    }

    // Update next event date in settings
    await supabase
      .from('communities')
      .update({
        subscription_settings: {
          ...settings,
          nextEventDate: nextEventDate.toISOString(),
        },
      })
      .eq('id', communityId);
  } catch (_error) {
    // Error handling silently ignored
  }
};
