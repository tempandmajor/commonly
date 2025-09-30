import React, { useEffect, useState } from 'react';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import StripeConnectRequired from '@/components/payment/connect/StripeConnectRequired';
import { Loader2 } from 'lucide-react';

interface StripeConnectGuardProps {
  children: React.ReactNode;
  type: 'event' | 'community' | 'store';
  returnPath?: string | undefined;
}

const StripeConnectGuard: React.FC<StripeConnectGuardProps> = ({ children, type, returnPath }) => {
  const { hasStripeConnect, isLoading, error } = useStripeConnect();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setHasTimedOut(true);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Show loading state while checking Stripe Connect status (with timeout)
  if (isLoading && !hasTimedOut) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <span className='ml-2'>Checking payment setup...</span>
      </div>
    );
  }

  // Handle errors, timeouts, or no Stripe Connect
  if (error || hasTimedOut || !hasStripeConnect) {
    if (error) {
    }
    return <StripeConnectRequired type={type} {...(returnPath && { returnPath })} />;
  }

  // User has Stripe Connect - allow access
  return <>{children}</>;
};

export default StripeConnectGuard;
