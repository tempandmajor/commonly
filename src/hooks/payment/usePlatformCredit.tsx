import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { PaymentType } from '@/services/payment/types';
import { canUsePlatformCredit, getPlatformCreditBalance } from '@/services/platformCredit';
import { CreditPaymentOptions } from '@/services/payment/creditTypes';

interface UsePlatformCreditProps {
  amount: number;
  currency: string;
  paymentType: PaymentType;
  title: string;
  isPlatformFee: boolean;
  metadata?: Record<string, string> | undefined;
}

export const usePlatformCredit = ({
  amount,
  currency,
  paymentType,
  title,
  isPlatformFee,
  metadata,
}: UsePlatformCreditProps) => {
  const [usePlatformCredit, setUsePlatformCredit] = useState(true);
  const [platformCredit, setPlatformCredit] = useState(0);
  const [canUseCredit, setCanUseCredit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const loadCreditInfo = async () => {
      if (user && isPlatformFee) {
        setIsLoading(true);
        try {
          // Get platform credit using centralized function
          const creditBalance = await getPlatformCreditBalance(user.id);
          setPlatformCredit(creditBalance);

          const creditOptions: CreditPaymentOptions = {
            amount,
            currency: currency.toLowerCase(),
            paymentType,
            description: title,
            isPlatformFee,
            metadata,
            ...(user && { customerId: user.id }),
            ...(user && { userId: user.id }),
            status: 'pending',
            title, // Add title field to align with connected payment options
          };

          const eligible = canUsePlatformCredit(creditOptions);
          setCanUseCredit(eligible && creditBalance >= amount);
        } catch (error) {
          setCanUseCredit(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadCreditInfo();
  }, [user, isPlatformFee, amount, currency, paymentType, title, metadata]);

  return {
    usePlatformCredit,
    setUsePlatformCredit,
    platformCredit,
    canUseCredit,
    isLoading,
  };
};
