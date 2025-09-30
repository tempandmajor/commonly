import React, { useEffect, useState } from 'react';
import WalletContent from './WalletContent';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  amount_in_cents: number;
  description: string;
  transaction_type: string;
  created_at: string;
  status: string;
}

const WalletContainer: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        // Fetch wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallet_balances')
          .select('balance_in_cents')
          .eq('user_id', user.id)
          .single();

        if (walletError && walletError.code !== 'PGRST116') {
          // PGRST116 is not found
          toast.error('Failed to load wallet balance');
        } else {
          // If wallet balance exists, set it; otherwise, default to 0
          setBalance((walletData?.balance_in_cents || 0) / 100); // Convert cents to dollars
        }

        // Fetch recent transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (transactionsError) {
          toast.error('Failed to load transaction history');
        } else {
          setTransactions(transactionsData || []);
        }
      } catch (error) {
        toast.error('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, [user?.id]);

  return (
    <Card className='p-6'>
      <WalletContent balance={balance} transactions={transactions} isLoading={isLoading} />
    </Card>
  );
};

export { WalletContainer };
export default WalletContainer;
