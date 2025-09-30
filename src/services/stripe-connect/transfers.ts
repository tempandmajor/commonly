import { supabase } from '@/integrations/supabase/client';

export const createStripeTransfer = async (
  amount: number,
  destinationAccountId: string,
  metadata?: Record<string, string>
): Promise<boolean> => {
  try {
    // Create a transaction record for the transfer
    const { error } = await supabase.from('transactions').insert({
      amount_in_cents: amount,
      transaction_type: 'transfer',
      status: 'completed',
      description: 'Stripe Connect transfer',
      metadata: {
        destinationAccountId,
          ...metadata,
      },
    });

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

export const reverseStripeTransfer = async (transferId: string): Promise<boolean> => {
  try {
    // Update the transaction status to reversed
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'reversed',
        metadata: { reversed: true },
      })
      .eq('id', transferId);

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};
