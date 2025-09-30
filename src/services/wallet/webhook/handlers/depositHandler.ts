import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/react';

/**
 * Process a successful deposit webhook event
 * @param data The deposit event data
 * @returns Result object with success status
 */
export const handleDeposit = async (data: unknown): Promise<{ success: boolean; error?: any }> => {
  try {
    return await handleSuccessfulDeposit(data);
  } catch (error) {
    Sentry.captureException(error, {
      extra: { data },
      tags: { source: 'deposit_handler' },
    });
    return { success: false, error };
  }
};

/**
 * Handle the actual deposit operation
 */
export const handleSuccessfulDeposit = async (
  data: unknown
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { userId, amount, transactionId } = data;

    if (!userId || !amount || !transactionId) {
      return { success: false, error: 'Missing required data' };
    }

    // Get the user's wallet balance
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets' as const)
      .select('available')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const currentBalance = wallet?.available || 0;

    // Calculate the new balance
    const newBalance = currentBalance + amount;

    // Update the wallet with the new balance
    const { error: updateError } = await supabase
      .from('wallets' as const)
      .update({ available: newBalance, last_updated: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Log the transaction
    const { error: logError } = await supabase.from('wallet_transactions' as const).insert({
      user_id: userId,
      amount,
      transaction_type: 'deposit',
      reference_id: transactionId,
      status: 'completed',
      created_at: new Date().toISOString(),
    });

    if (logError) throw logError;

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};
