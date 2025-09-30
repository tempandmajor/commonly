import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/utils/errorUtils';

export const withdrawFunds = async (
  userId: string,
  amount: number,
  paymentMethodId?: string,
  description?: string
): Promise<boolean> => {
  try {
    // Call Supabase edge function for withdrawal
    const { data, error } = await supabase.functions.invoke('initiateWithdrawal', {
      body: {
        userId,
        amount,
        paymentMethodId,
        description: description || 'Wallet withdrawal',
      },
    });

    if (error) throw error;

    const result = data as { success: boolean; message?: string; error?: string };

    if (!result.success) {
      throw new Error(result.error || 'Withdrawal failed');
    }

    toast.success(result.message || 'Withdrawal initiated successfully');
    return true;
  } catch (error: unknown) {
    handleError(
      error,
      { userId, amount, paymentMethodId },
      error.message || 'Failed to process withdrawal'
    );
    return false;
  }
};

export const transferToUser = async (
  fromUserId: string,
  toUserId: string,
  amount: number,
  description?: string
): Promise<boolean> => {
  try {
    // Call Supabase edge function for transfer
    const { data, error } = await supabase.functions.invoke('transferFunds', {
      body: {
        fromUserId,
        toUserId,
        amount,
        description: description || 'Wallet transfer',
      },
    });

    if (error) throw error;

    const result = data as { success: boolean; message?: string; error?: string };

    if (!result.success) {
      throw new Error(result.error || 'Transfer failed');
    }

    toast.success(result.message || 'Transfer successful');
    return true;
  } catch (error: unknown) {
    handleError(
      error,
      { fromUserId, toUserId, amount },
      error.message || 'Failed to process transfer'
    );
    return false;
  }
};

// Export functions from the correct files
export * from './transactions';
export * from './balance';
// Export the getWalletBalance and getWalletTransactions from walletService
export { getWalletBalance, getWalletTransactions } from './walletService';
