import { useState } from 'react';
import { getStripeOnboardingLink } from '@/services/stripe';
import { toast } from 'sonner';

export const useStripeOnboarding = () => {
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleConnectStripe = async (userId: string) => {
    if (!userId) {
      toast.error('Please log in to connect Stripe');
      return;
    }

    setIsConnectingStripe(true);
    setConnectError(null);

    try {
      const stripeLink = await getStripeOnboardingLink(userId);

      if (stripeLink) {
        window.open(stripeLink, '_blank');
        toast.info('Please complete the Stripe onboarding process in the new tab.');
      } else {
        setConnectError('Failed to generate Stripe onboarding link');
        toast.error('Failed to generate Stripe onboarding link');
      }
    } catch (error) {
      setConnectError(
        `Failed to connect Stripe: ${error instanceof Error ? error.message : String(error) as string}`
      );
      toast.error('Failed to connect Stripe account. Please try again.');
    } finally {
      setIsConnectingStripe(false);
    }
  };

  return {
    isConnectingStripe,
    connectError,
    handleConnectStripe,
  };
};
