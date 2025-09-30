import { useAuth } from '@/providers/AuthProvider';
import { getConnectAccountStatus } from '@/services/supabase/edge-functions';
import { useDataFetch } from './useDataFetch';

interface StripeAccountStatus {
  isConnected: boolean;
  accountId?: string | undefined;
  detailsSubmitted?: boolean | undefined;
  chargesEnabled?: boolean | undefined;
  payoutsEnabled?: boolean | undefined;
}

export const useStripeAccountStatus = () => {
  const { user } = useAuth();

  const fetchStatus = async (): Promise<StripeAccountStatus> => {
    if (!user) {
      return { isConnected: false };
    }

    return await getConnectAccountStatus();
  };

  const { data, isLoading, error } = useDataFetch(fetchStatus, [user?.id], {
    errorMessage: 'Failed to fetch account status',
    fetchOnMount: !!user,
    initialData: { isConnected: false },
  });

  return {
    status: data || { isConnected: false },
    isLoading,
    error,
  };
};
