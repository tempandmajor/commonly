import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { toast } from 'sonner';

const EmailConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const redirect_to = searchParams.get('redirect_to');

        if (!token_hash || !type) {
          setStatus('error');
          setMessage('Invalid confirmation link. Please check your email and try again.');
          return;
        }

        // Verify the email confirmation token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          setStatus('error');
          setMessage(error.message || 'Failed to confirm email. The link may have expired.');
          return;
        }

        if (data.user) {
          setStatus('success');
          setMessage('Email confirmed successfully! You can now sign in to your account.');
          toast.success('Email confirmed successfully!');

          // Redirect after a short delay
          setTimeout(() => {
            if (redirect_to) {
              // Use navigate for internal URLs, window.location only for external URLs
              if (redirect_to.startsWith('/') || redirect_to.startsWith(window.location.origin)) {
                const path = redirect_to.startsWith(window.location.origin)
                  ? redirect_to.substring(window.location.origin.length)
                  : redirect_to;
                navigate(path);
              } else {
                // Only use window.location for external URLs that aren't part of our app
                window.location.href = redirect_to;
              }
            } else {
              navigate('/login');
            }
          }, 2000);
        }
      } catch (error: any) {
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate('/login');
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden'>
      {/* Background decorative elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-1/2 -right-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 blur-3xl' />
        <div className='absolute -bottom-1/2 -left-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-secondary/5 to-secondary/10 blur-3xl' />
      </div>

      <div className='relative z-10 w-full max-w-md space-y-6'>
        {/* Header with back button */}
        <div className='flex items-center justify-center'>
          <Link
            to='/login'
            className='absolute left-0 flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            Back to Login
          </Link>
          <div className='mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg'>
            <Mail className='h-6 w-6 text-primary-foreground' />
          </div>
        </div>

        <AuthCard title='Email Confirmation' description='Verifying your email address'>
          <div className='flex flex-col items-center space-y-4'>
            {status === 'loading' && (
              <>
                <div className='relative'>
                  <div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center'>
                    <Loader2 className='h-8 w-8 animate-spin text-primary' />
                  </div>
                </div>
                <div className='text-center'>
                  <p className='text-lg font-medium mb-1'>Confirming your email...</p>
                  <p className='text-muted-foreground'>Please wait while we verify your email address</p>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <div className='relative'>
                  <div className='w-16 h-16 rounded-full bg-secondary flex items-center justify-center animate-in zoom-in-50 duration-500'>
                    <CheckCircle className='h-8 w-8 text-primary' />
                  </div>
                  <div className='absolute inset-0 rounded-full bg-secondary animate-ping opacity-75' />
                </div>
                <div className='text-center'>
                  <p className='text-lg font-semibold text-foreground mb-2'>Email Confirmed!</p>
                  <p className='text-muted-foreground mb-2'>{message}</p>
                  <div className='flex items-center justify-center space-x-2 text-sm text-muted-foreground'>
                    <div className='w-2 h-2 bg-primary rounded-full animate-pulse' />
                    <span>Redirecting you now...</span>
                  </div>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className='relative'>
                  <div className='w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center animate-in zoom-in-50 duration-500'>
                    <XCircle className='h-8 w-8 text-destructive' />
                  </div>
                </div>
                <div className='text-center space-y-4'>
                  <div>
                    <p className='text-lg font-semibold text-destructive mb-2'>Confirmation Failed</p>
                    <p className='text-muted-foreground mb-4'>{message}</p>
                  </div>

                  <div className='rounded-lg border border-border bg-secondary p-4'>
                    <p className='text-sm text-muted-foreground'>
                      The confirmation link may have expired or already been used. You can try requesting a new confirmation email from the login page.
                    </p>
                  </div>

                  <Button onClick={handleRetry} className='w-full' variant='default'>
                    Go to Login
                  </Button>
                </div>
              </>
            )}
          </div>
        </AuthCard>

        {/* Footer */}
        <div className='text-center'>
          <p className='text-sm text-muted-foreground'>
            Need help?{' '}
            <Link to='/contact' className='text-primary hover:underline font-medium transition-colors'>
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirm;