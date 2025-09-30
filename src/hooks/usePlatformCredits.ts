import { toast } from 'sonner';
import { useDataFetch } from './useDataFetch';
import { handleError } from '@/utils/errorUtils';
import { supabase } from '@/integrations/supabase/client';

interface CreditTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent' | 'bonus' | 'refund';
  description: string;
  date: string;
}

interface CreditData {
  balance: number;
  transactions: CreditTransaction[];
}

const fetchPlatformCredits = async (userId?: string): Promise<CreditData | null> => {
  if (!userId) {
    return null;
  }

  try {
    // Get user's credit balance
    const { data: balance, error: balanceError } = await supabase
      .from('credit_balances')
      .select('amount')
      .eq('user_id', userId)
      .single();

    if (balanceError) {
      // If no balance record exists, create one with zero balance
      if (balanceError.code === 'PGRST116') {
        // No rows returned
        const { data: newBalance, error: createError } = await supabase
          .from('credit_balances')
          .insert({
            user_id: userId,
            amount: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('amount')
          .single();

        if (createError) {
          return { balance: 0, transactions: [] };
        }

        return { balance: newBalance?.amount || 0, transactions: [] };
      }

      return { balance: 0, transactions: [] };
    }

    // Get user's credit transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (transactionsError) {
      return { balance: balance?.amount || 0, transactions: [] };
    }

    // Map the transactions to match our interface
    const mappedTransactions = (transactions || []).map(tx => ({
      id: tx.id,
      amount: tx.amount,
      type: tx.type as 'earned' | 'spent' | 'bonus' | 'refund',
      description: tx.description,
      date: tx.created_at,
    }));

    return {
      balance: balance?.amount || 0,
      transactions: mappedTransactions,
    };

  } catch (error) {
    return { balance: 0, transactions: [] };
  }
};

export const usePlatformCredits = (userId?: string) => {
  const { data, isLoading, setData } = useDataFetch(() => fetchPlatformCredits(userId), [userId], {
    errorMessage: 'Failed to load platform credits',
    fetchOnMount: !!userId,
  });

  const spendCredits = async (amount: number, description: string) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!data || amount > data.balance) {
        throw new Error('Insufficient credits');
      }

      // Add transaction record for spent credits
      const { error: transactionError } = await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: -amount,
        type: 'spent',
        description,
        created_at: new Date().toISOString(),
      });

      if (transactionError) {
        throw new Error('Failed to spend credits');
      }

      // Update user's balance
      const { error: balanceError } = await supabase
        .from('credit_balances')
        .update({
          amount: data.balance - amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (balanceError) {
        throw new Error('Failed to update balance');
      }

      // Update local state
      const newTransaction: CreditTransaction = {
        id: Date.now().toString(),
        amount: -amount,
        type: 'spent',
        description,
        date: new Date().toISOString(),
      };

      setData({
        balance: data.balance - amount,
        transactions: [newTransaction, ...data.transactions],
      });

      toast.success(`${amount} credits spent successfully`);
      return true;
    } catch (error: unknown) {
      handleError(
        error,
        { userId, amount, description },
        error.message || 'Failed to spend credits'
      );
      return false;
    }
  };

  return {
    credits: data?.balance || 0,
    isLoading,
    transactions: data?.transactions || [],
    spendCredits,
  };

};

