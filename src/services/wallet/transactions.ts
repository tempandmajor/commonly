import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const getWalletTransactions = async (userId: string, limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    toast.error('Failed to load transaction history');
    return [];
  }
};

export const createWalletTransaction = async (
  userId: string,
  amount: number,
  type: string,
  description?: string
) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount_in_cents: amount,
        transaction_type: type,
        description: description || '',
        status: 'completed',
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    toast.error('Failed to create transaction');
    return null;
  }
};
