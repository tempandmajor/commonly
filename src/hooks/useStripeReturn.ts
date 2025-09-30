import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StripeReturnData {
  stripeConnectedId?: string | undefined;
  accountStatus?: string | undefined;
  isEnabled?: boolean | undefined;
  needsAction?: boolean | undefined;
}

interface UseStripeReturnProps {
  user: { id: string } | null;
  refreshStatus: () => void;
}

export const useStripeReturn = (user: { id: string } | null, refreshStatus: () => void) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const accountId = params.get('accountId');
    const uid = params.get('uid');

    if (status && accountId && uid && user) {
      handleStripeReturn(status, accountId, uid);
    }
  }, [location.search, user]);

  const handleStripeReturn = async (status: string, accountId: string, uid: string) => {
    try {
      if (status === 'success') {
        await processSuccessfulConnection(accountId, uid);
      } else {
        handleFailedConnection(status);
      }
    } catch (error) {
      console.error('Error processing Stripe connection:', error);
      toast.error('Failed to process Stripe connection');
      navigate('/create-event', { replace: true });
    }
  };

  const processSuccessfulConnection = async (accountId: string, uid: string) => {
    try {
      // Call the Stripe return handler service
      const response = await fetch(
        `https://handlereturn-skgc2apcpq-uc.a.run.app?status=success&accountId=${accountId}&uid=${uid}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data: StripeReturnData = await response.json();

      if (user) {
        await updateUserStripeAccount(data, accountId, uid);
      }

      toast.success('Stripe account connected successfully!');
      refreshStatus();
      navigate('/create-event', { replace: true });
    } catch (error) {
      console.error('Error processing successful connection:', error);
      toast.error('Failed to connect Stripe account. Please try again.');
      navigate('/create-event', { replace: true });
    }
  };

  const updateUserStripeAccount = async (data: StripeReturnData, accountId: string, uid: string) => {
    try {
      // Get current user preferences to merge with new data
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', uid)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('Error fetching current user preferences:', fetchError);
      }

      const currentPreferences = (currentUser?.preferences as Record<string, unknown>) || {};

      // Update user with Stripe account information
      const updateData = {
        stripe_account_id: data.stripeConnectedId || accountId,
        preferences: {
          ...currentPreferences,
          accountStatus: data.accountStatus || 'Active',
          isConnected: true,
          isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
          stripeAccountEnabled: true,
          needsAction: data.accountStatus === 'Incomplete',
          lastStripeUpdate: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', uid);

      if (error) {
        console.error('Error updating user Stripe account:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating user account:', error);
      toast.error('Failed to update account status');
      throw error;
    }
  };

  const handleFailedConnection = (status: string) => {
    const errorMessages: Record<string, string> = {
      'cancelled': 'Stripe setup was cancelled',
      'error': 'An error occurred during Stripe setup',
      'failed': 'Stripe account setup failed',
    };

    const message = errorMessages[status] || `Stripe setup incomplete: ${status}`;
    toast.error(message);
    navigate('/create-event', { replace: true });
  };

  return {
    handleStripeReturn,
  };
};