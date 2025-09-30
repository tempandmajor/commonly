import React from 'react';
import { useStripeAccountStatus } from '@/hooks/useStripeAccountStatus';
import ConnectLoading from './ConnectLoading';
import StripeConnectOnboarding from '../StripeConnectOnboarding';

interface StripeConnectWrapperProps {
  children: React.ReactNode;
}

const StripeConnectWrapper: React.FC<StripeConnectWrapperProps> = ({ children }) => {
  const { status, isLoading } = useStripeAccountStatus();

  if (isLoading) {
    return <ConnectLoading />;
  }

  if (!status.isConnected) {
    return <StripeConnectOnboarding />;
  }

  return <>{children}</>;
};

export default StripeConnectWrapper;
