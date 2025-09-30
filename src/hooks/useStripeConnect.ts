import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getConnectAccountStatus,
  createConnectDashboardLink,
  createConnectOnboardingLink,
} from '@/services/supabase/edge-functions';

export function useStripeConnect() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getConnectAccountStatus();
      setStatus(s);
      return s;
    } catch (e) {
      const errorMsg = 'Failed to fetch Stripe Connect status';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const openDashboard = useCallback(async () => {
    try {
      const resp: any = await createConnectDashboardLink();
      const url = resp?.url || resp?.data?.url;
      if (!url) throw new Error('No dashboard URL');
      window.open(url, '_blank');
    } catch (_e) {
      toast.error('Failed to open Stripe Dashboard');
    }
  }, []);

  const startOnboarding = useCallback(async () => {
    try {
      const resp: any = await createConnectOnboardingLink();
      const url = resp?.url || resp?.data?.url;
      if (!url) throw new Error('No onboarding URL');
      window.location.href = url;
    } catch (_e) {
      toast.error('Failed to start Stripe Connect onboarding');
    }
  }, []);

  // Derived state for compatibility
  const hasStripeConnect = status?.charges_enabled === true || status?.payouts_enabled === true;
  const isLoading = loading;

  return {
    loading,
    status,
    refreshStatus,
    openDashboard,
    startOnboarding,
    hasStripeConnect,
    isLoading,
    error,
  };
}
