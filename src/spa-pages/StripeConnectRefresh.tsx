import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';

const StripeConnectRefresh = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics('stripe_connect_refresh', 'Stripe Connect Refresh');
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accountId = searchParams.get('account_id');
    if (accountId) {
      trackEvent('stripe_connect_refresh_page_view', { account_id: accountId });
    }
  }, [searchParams, trackEvent]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const accountId = searchParams.get('account_id');

      if (!accountId) {
        throw new Error('No account ID provided');
      }

      // Simulate refresh process
      await new Promise(resolve => setTimeout(resolve, 2000));

      trackEvent('stripe_connect_refresh_success', { account_id: accountId });
      setSuccess(true);
      toast.success('Account information refreshed successfully');

      // Redirect after success
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError((err as Error).message);
      trackEvent('stripe_connect_refresh_error', {
        error: (err as Error).message,
      });
      toast.error('Failed to refresh account information');
    } finally {
      setRefreshing(false);
    }
  };

  const handleReturnToDashboard = () => {
    trackEvent('stripe_connect_return_to_dashboard');
    navigate('/dashboard');
  };

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <RefreshCw className='h-5 w-5' />
            Refresh Stripe Account
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {!success && !error && (
            <>
              <p className='text-muted-foreground'>
                Click the button below to refresh your Stripe account information and sync any
                recent changes.
              </p>
              <Button onClick={handleRefresh} disabled={refreshing} className='w-full'>
                {refreshing ? (
                  <>
                    <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                    Refreshing...
                  </>
                ) : (
                  'Refresh Account'
                )}
              </Button>
            </>
          )}

          {success && (
            <div className='text-center'>
              <CheckCircle className='h-12 w-12 text-black mx-auto mb-4' />
              <p className='text-muted-foreground mb-4'>
                Your account information has been successfully refreshed.
              </p>
              <Button onClick={handleReturnToDashboard} className='w-full'>
                Return to Dashboard
              </Button>
            </div>
          )}

          {error && (
            <div className='text-center'>
              <XCircle className='h-12 w-12 text-gray-600 mx-auto mb-4' />
              <p className='text-muted-foreground mb-4'>{error}</p>
              <div className='space-y-2'>
                <Button onClick={handleRefresh} variant='outline' className='w-full'>
                  Try Again
                </Button>
                <Button onClick={handleReturnToDashboard} className='w-full'>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeConnectRefresh;
