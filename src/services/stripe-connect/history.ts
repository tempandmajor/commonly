import { supabase } from '@/integrations/supabase/client';

/**
 * Get payment history for a connected account
 */
export const getConnectedPaymentHistory = async (creatorId: string) => {
  try {
    const { data, error } = await supabase.from('payments').select('*').eq('user_id', creatorId);

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Get transfer history for a connected account
 */
export const getTransferHistory = async (creatorId: string) => {
  try {
    // Since transfers table doesn't exist, use transactions as fallback
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', creatorId)
      .eq('transaction_type', 'transfer');

    if (error) throw error;

    return data || [];
  } catch (error) {
    throw error;
  }
};
