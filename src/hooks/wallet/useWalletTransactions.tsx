import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import type { Transaction } from '@/lib/types';

interface UseWalletTransactionsResult {
  transactions: Transaction[];
  lastIndex: number;
  hasMore: boolean;
}

export const useWalletTransactions = (pageSize: number = 20): UseWalletTransactionsResult => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastIndex, setLastIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(0, pageSize - 1);

        if (error) throw error;

        // Transform the data to match our Transaction type
        const transformedData: Transaction[] = (data || []).map(item => ({
          id: item.id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          user_id: item.user_id,
          transaction_type: item.transaction_type,
          amount_in_cents: item.amount_in_cents,
          status: item.status,
          description: item.description,
          metadata:
            typeof item.metadata === 'object' ? (item.metadata as Record<string, unknown>) : {},
        }));

        setTransactions(transformedData);
        setLastIndex(pageSize);
        setHasMore((data || []).length === pageSize);
      } catch (_error) {
        // Error handling silently ignored
      }
    };

    fetchTransactions();
  }, [user, pageSize]);

  return {
    transactions,
    lastIndex,
    hasMore,
  };
};
