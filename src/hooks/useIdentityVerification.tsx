import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  createIdentityVerificationSession,
  checkIdentityVerificationStatus,
} from '@/services/stripe/identity-verification';

export const useIdentityVerification = () => {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<
    'pending' | 'verified' | 'failed' | 'none' | 'loading'
  >('loading');
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Check verification status on load
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id) {
        setVerificationStatus('none');
        return;
      }

      const result = await checkIdentityVerificationStatus(user.id);
      setVerificationStatus(result.status);
      setLastUpdated(result.lastUpdated);
    };

    checkStatus();
  }, [user]);

  // Start verification process
  const startVerification = async (returnUrl: string): Promise<string | null> => {
    if (!user?.id) {
      return null;
    }

    setIsCreatingSession(true);
    try {
      const url = await createIdentityVerificationSession(user.id, returnUrl);
      if (url) {
        setVerificationStatus('pending');
      }
      return url;
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Manually refresh status
  const refreshStatus = async (): Promise<void> => {
    if (!user?.id) {
      return;
    }

    const result = await checkIdentityVerificationStatus(user.id);
    setVerificationStatus(result.status);
    setLastUpdated(result.lastUpdated);
  };

  return {
    verificationStatus,
    lastUpdated,
    isCreatingSession,
    startVerification,
    refreshStatus,
    isVerified: verificationStatus === 'verified',
  };
};
