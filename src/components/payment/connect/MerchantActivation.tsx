import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Loader2, Link } from 'lucide-react';
import { toast } from 'sonner';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { createAccountLink } from '@/services/stripe/connect';

interface MerchantActivationProps {
  userId: string | undefined;
  onboardingLink: string | null;
  returnPath: string;
}

const MerchantActivation: React.FC<MerchantActivationProps> = ({
  userId,
  onboardingLink,
  returnPath,
}) => {
  const { hasStripeConnect, isLoading, isStripeConnectEnabled, stripeAccountId } =
    useStripeConnect();

  const handleConnectStripe = async () => {
    if (!stripeAccountId || !userId) return;

    try {
      const link = await createAccountLink(stripeAccountId);
      if (link) {
        window.location.href = link;
      } else {
        toast.error('Failed to create Stripe Connect link');
      }
    } catch (error) {
      toast.error('Failed to connect to Stripe');
    }
  };

  const isAccountEnabled = isStripeConnectEnabled;

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>Connect to Stripe</CardTitle>
        <CardDescription>
          {isAccountEnabled
            ? 'Your Stripe account is connected and active.'
            : 'Connect your Stripe account to receive payments.'}
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        {isLoading ? (
          <div className='flex items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin' />
          </div>
        ) : isAccountEnabled ? (
          <div className='rounded-md border border-green-500/50 bg-green-500/10 p-4'>
            <div className='flex items-center space-x-2'>
              <CheckCircle className='h-4 w-4 text-green-500' />
              <h4 className='text-sm font-medium'>Stripe account connected</h4>
            </div>
            <p className='text-sm text-muted-foreground mt-1'>
              Your Stripe account is fully connected and ready to process payments.
            </p>
          </div>
        ) : (
          <div className='space-y-2'>
            <p className='text-sm text-muted-foreground'>
              To start receiving payments, connect your Stripe account. You'll be redirected to
              Stripe to complete the onboarding process.
            </p>
            <Button onClick={handleConnectStripe} disabled={isLoading || !stripeAccountId}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Connecting...
                </>
              ) : (
                <>
                  Connect to Stripe
                  <Link className='h-4 w-4 ml-2' />
                </>
              )}
            </Button>
          </div>
        )}
        {!isAccountEnabled && onboardingLink && (
          <div className='rounded-md border border-amber-500/50 bg-amber-500/10 p-4'>
            <div className='flex items-center space-x-2'>
              <AlertTriangle className='h-4 w-4 text-amber-500' />
              <h4 className='text-sm font-medium'>Complete your Stripe setup</h4>
            </div>
            <p className='text-sm text-muted-foreground mt-1'>
              Your Stripe account setup is incomplete. Please complete the onboarding process.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MerchantActivation;
