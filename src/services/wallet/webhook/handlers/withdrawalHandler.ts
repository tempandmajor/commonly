import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/react';

/**
 * Process a withdrawal webhook event
 * @param data The withdrawal event data
 * @returns Result object with success status
 */
export const handleWithdrawal = async (
  data: unknown
): Promise<{ success: boolean; error?: any }> => {
  try {
    return await handleWithdrawalRequest(data);
  } catch (error) {
    Sentry.captureException(error, {
      extra: { data },
      tags: { source: 'withdrawal_handler' },
    });
    return { success: false, error };
  }
};

/**
 * Handle the actual withdrawal request processing
 */
export const handleWithdrawalRequest = async (
  data: unknown
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { userId, withdrawalId, amount, status } = data;

    if (!userId || !withdrawalId || !amount) {
      return { success: false, error: 'Missing required withdrawal data' };
    }

    // Update the withdrawal status
    const { error: updateError } = await supabase
      .from('withdrawals' as const)
      .update({
        status: status || 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId);

    if (updateError) throw updateError;

    // If the withdrawal is completed or failed, update the user's wallet
    if (status === 'completed' || status === 'failed') {
      // Get current wallet data
      const { data: wallet, error: fetchError } = await supabase
        .from('wallets' as const)
        .select('available_balance_in_cents, pending_balance_in_cents')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (wallet) {
        if (status === 'completed') {
          // For completed withdrawals, adjust pending amount
          // (balance should already be reduced when withdrawal was initiated)
          const currentPending = wallet.pending_balance_in_cents || 0;

          if (currentPending < amount) {
            throw new Error(
              `Insufficient pending balance for withdrawal: ${currentPending} < ${amount}`
            );
          }

          const { error: updateWalletError } = await supabase
            .from('wallets' as const)
            .update({
              pending_balance_in_cents: currentPending - amount,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (updateWalletError) throw updateWalletError;
        } else if (status === 'failed') {
          const pendingAmount = wallet.pending_balance_in_cents || 0;
          let availableAmount = wallet.available_balance_in_cents || 0;

          // If failed, return the amount to available balance
          availableAmount += amount;

          const { error: walletError } = await supabase
            .from('wallets' as const)
            .update({
              available_balance_in_cents: availableAmount,
              pending_balance_in_cents: Math.max(0, pendingAmount - amount),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (walletError) throw walletError;
        }
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};
