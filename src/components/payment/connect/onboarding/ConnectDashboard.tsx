import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import {
  createConnectDashboardLink,
  createConnectOnboardingLink,
} from '@/services/supabase/edge-functions';
import { toast } from 'sonner';

const ConnectDashboard = () => {
  const openDashboard = async () => {
    try {
      const res: any = await createConnectDashboardLink();
      const url = res?.url || res;
      if (url) {
        window.open(url as string, '_blank');
        return;
      }
      // Fallback to onboarding if no dashboard link
      const onboard: any = await createConnectOnboardingLink();
      const onboardUrl = onboard?.url || onboard;
      if (onboardUrl) {
        window.open(onboardUrl as string, '_blank');
        return;
      }
      toast.error('Could not open Stripe dashboard. Please try again later.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to open Stripe dashboard');
    }
  };

  return (
    <div>
      <h4 className='font-medium mb-2'>Stripe Dashboard</h4>
      <p className='text-sm text-muted-foreground mb-3'>
        View your earnings, payouts, and manage your account settings.
      </p>
      <Button variant='outline' className='flex items-center gap-2' onClick={openDashboard}>
        Open Stripe Dashboard
        <ExternalLink className='h-4 w-4' />
      </Button>
    </div>
  );
};

export default ConnectDashboard;
