import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Loader2 } from 'lucide-react';
import { createConnectOnboardingLink } from '@/services/supabase/edge-functions';
import { toast } from 'sonner';

const StripeConnectOnboarding: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartOnboarding = async () => {
    setIsLoading(true);
    try {
      const result = await createConnectOnboardingLink();
      if (result.url) {
        toast.success('Redirecting to Stripe Connect setup...');
        window.location.href = result.url;
      } else {
        throw new Error('No onboarding URL received');
      }
    } catch (error) {
      toast.error('Failed to start onboarding process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto mt-8'>
      <Card>
        <CardHeader>
          <CardTitle>Connect with Stripe</CardTitle>
          <CardDescription>
            To sell products and receive payments, you need to connect your Stripe account. This is
            required to create events, products, and communities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleStartOnboarding} className='w-full' disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Setting up...
              </>
            ) : (
              <>
                <ExternalLink className='mr-2 h-4 w-4' />
                Connect Stripe Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeConnectOnboarding;
