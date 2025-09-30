import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';

const StripeConnectComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics('stripe_connect_complete', 'Stripe Connect Complete');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleConnectResult = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const _error = searchParams.get('error');

        trackEvent('stripe_connect_complete_page_view', {
          session_id: sessionId,
          has_error: !!error,
        });

        if (error) {
          setError(error);
          trackEvent('stripe_connect_error', { error });
          toast.error('Stripe Connect setup failed');
        } else if (sessionId) {
          // Simulate verification
          await new Promise(resolve => setTimeout(resolve, 2000));
          setSuccess(true);
          trackEvent('stripe_connect_success', { session_id: sessionId });
          toast.success('Stripe Connect setup completed successfully!');
        } else {
          setError('Invalid session');
          trackEvent('stripe_connect_invalid_session');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        trackEvent('stripe_connect_unexpected_error', {
          error: (err as Error).message,
        });
      } finally {
        setLoading(false);
      }
    };

    handleConnectResult();
  }, [searchParams, trackEvent]);

  const handleContinue = () => {
    trackEvent('stripe_connect_continue_clicked');
    navigate('/dashboard');
  };

  const handleRetry = () => {
    trackEvent('stripe_connect_retry_clicked');
    navigate('/settings');
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center text-center'>
              <Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
              <h2 className='text-xl font-semibold mb-2'>Processing Connection</h2>
              <p className='text-muted-foreground'>
                Please wait while we verify your Stripe account connection...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {success ? (
              <>
                <CheckCircle className='h-5 w-5 text-green-500' />
                Connection Successful
              </>
            ) : (
              <>
                <XCircle className='h-5 w-5 text-red-500' />
                Connection Failed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className='text-center'>
              <p className='text-muted-foreground mb-4'>
                Your Stripe account has been successfully connected. You can now start receiving
                payments.
              </p>
              <Button onClick={handleContinue} className='w-full'>
                Continue to Dashboard
              </Button>
            </div>
          ) : (
            <div className='text-center'>
              <p className='text-muted-foreground mb-4'>
                {error || 'There was an issue connecting your Stripe account. Please try again.'}
              </p>
              <Button onClick={handleRetry} className='w-full'>
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeConnectComplete;
