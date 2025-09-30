import { checkout, NavigateFunction } from './payment/checkoutService';

// Add these constants that are used in Pro components
export const PRO_SUBSCRIPTION_NAME = 'Pro';
export const PRO_SUBSCRIPTION_PRICE = 29.99;

// Podcast-specific subscription plans
export const PODCAST_FREE_SUBSCRIPTION = {
  name: 'Podcast Free',
  price: 0,
  features: [
    '4 Hours Audio Recording per month',
    'Standard Quality Audio (up to 192kbps)',
    'HD Video Recording (up to 720p)',
    'Solo Recording',
    'Basic Upload',
  ],
  limits: {
    recordingHours: 4,
    collaborators: 1,
    fileSize: 500, // 500MB
    videoQuality: '720p HD',
    audioQuality: '192kbps Standard',
  },
};

export const PODCAST_PRO_SUBSCRIPTION = {
  name: 'Podcast Pro',
  price: 29.99,
  features: [
    'Unlimited Recording Hours',
    '4K Video Recording',
    'High-Quality Audio (up to 320kbps Lossless)',
    'Multi-Guest Recording (up to 10 participants)',
    'AI Transcription & Chapters',
    'Advanced Analytics',
    'Priority Support',
    'Noise Reduction & Echo Cancellation',
    'Separate Track Recording',
    'Unlimited Storage',
  ],
  limits: {
    recordingHours: 'Unlimited',
    collaborators: 10,
    fileSize: 'Unlimited',
    videoQuality: '4K',
    audioQuality: '320kbps Lossless',
  },
};

export interface SubscriptionOptions {
  amount: number;
  description: string;
  productId?: string | undefined;
  customerEmail?: string | undefined;
  userId?: string | undefined;
  tier: string;
}

export const subscribeToTier = async (
  options: SubscriptionOptions,
  navigate?: NavigateFunction
): Promise<{ success: boolean; redirectUrl?: string }> => {
  try {
    return await checkout(
      {
        amount: options.amount,
        currency: 'usd',
        description: options.description,
        paymentType: 'subscription',
        productId: options.productId,
        customerEmail: options.customerEmail,
        userId: options.userId,
        metadata: {
          status: 'pending',
          tier: options.tier,
          type: 'subscription',
        },
      },
      navigate
    );
  } catch (error) {
    return { success: false };
  }
};

// Add an alias for subscribeToTier so it can be used as subscribeToPro
export const subscribeToPro = async (userId: string) => {
  try {
    // Process subscription upgrade
    // This will:
    // 1. Create Stripe checkout session
    // 2. Handle payment processing
    // 3. Update user subscription status

    const checkoutUrl = await checkout({
      amount: PODCAST_PRO_SUBSCRIPTION.price,
      currency: 'USD',
      paymentType: 'subscription',
      description: `${PODCAST_PRO_SUBSCRIPTION.name} Monthly Subscription`,
      userId,
      successUrl: '/pro/success',
      cancelUrl: '/pro',
      metadata: {
        subscriptionType: 'podcast_pro',
        planId: 'pro',
      },
    });

    return { success: true, checkoutUrl };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
