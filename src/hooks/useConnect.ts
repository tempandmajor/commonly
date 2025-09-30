import { useState } from 'react';
import { getStripeConnectAccountId } from '@/services/stripe/connect';

export const useConnect = () => {
  const [hasStripeConnect, setHasStripeConnect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkStripeConnectAccount = async (userId?: string) => {
    setIsLoading(true);
    try {
      if (!userId) {
        setHasStripeConnect(false);
        setIsLoading(false);
        return;
      }

      const connectAccountId = await getStripeConnectAccountId(userId);
      setHasStripeConnect(!!connectAccountId);
    } catch (error) {
      setHasStripeConnect(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hasStripeConnect,
    isLoading,
    checkStripeConnectAccount,
  };
};
