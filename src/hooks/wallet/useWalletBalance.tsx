import { useState } from 'react';
import { WalletBalance } from '@/services/wallet/types';
import { getWalletBalance } from '@/services/wallet/walletService';
import { useFormattedWalletBalance } from '@/services/wallet/balance';
import { toast } from 'sonner';

export const useWalletBalance = (userId: string | undefined) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [balance, setBalance] = useState<WalletBalance | null>(null);

  const formattedBalance = useFormattedWalletBalance(balance);

  const loadBalance = async () => {
    if (!userId) return;

    try {
      const walletBalance = await getWalletBalance(userId);

      // Create a full WalletBalance object with default values for required fields
      const fullBalance: WalletBalance = {
        userId,
        available: walletBalance.available || 0,
        pending: walletBalance.pending || 0,
        platformCredit: 0, // Default value
        referralEarnings: 0, // Default value
        currency: 'USD', // Default value
        lastUpdated: new Date(),
      };

      setBalance(fullBalance);
    } catch (error) {
      toast.error('Failed to load wallet balance');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    setLoading,
    balance,
    setBalance,
    formattedBalance,
    loadBalance,
  };
};
