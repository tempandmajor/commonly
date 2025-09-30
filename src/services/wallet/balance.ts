import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const getWalletBalance = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance_in_cents: 0,
          available_balance_in_cents: 0,
          pending_balance_in_cents: 0,
        })
        .select()
        .single();

      if (createError) throw createError;
      return newWallet;
    }

    return data;
  } catch (error) {
    toast.error('Failed to load wallet balance');
    return null;
  }
};

// Add the missing export
export const useFormattedWalletBalance = (balance: unknown) => {
  if (!balance) return '$0.00';

  const amount = balance.available || 0;
  return `$${amount / 100}.toFixed(2)}`;
};
