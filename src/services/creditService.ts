import { supabase } from '@/integrations/supabase/client';

// Define and export PromotionCredit type
export interface PromotionCredit {
  id: string;
  userId: string;
  amount: number;
  remainingAmount: number;
  description: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'used';
  promotionId?: string | undefined;
  createdAt: string;
}

export const hasEnoughCredits = async (userId: string, amount: number): Promise<boolean> => {
  try {
    // Get user's wallet balance
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('available_balance_in_cents')
      .eq('user_id', userId)
      .single();

    if (error || !wallet) return false;

    const availableBalance = wallet.available_balance_in_cents / 100; // Convert cents to dollars
    return availableBalance >= amount;
  } catch (error) {
    return false;
  }
};

export const applyCredit = async (
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>
): Promise<boolean> => {
  try {
    // Deduct from wallet
    const amountInCents = Math.round(amount * 100);

    // Get current balance first
    const { data: currentWallet } = await supabase
      .from('wallets')
      .select('available_balance_in_cents')
      .eq('user_id', userId)
      .single();

    const currentBalance = currentWallet?.available_balance_in_cents || 0;

    const { error: walletError } = await supabase
      .from('wallets')
      .update({
        available_balance_in_cents: Math.max(0, currentBalance - amountInCents),
      })
      .eq('user_id', userId);

    if (walletError) throw walletError;

    // Create credit transaction record
    const { error: transactionError } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -amountInCents, // Negative for deduction
      transaction_type: 'debit',
      description,
      status: 'completed',
      ...(metadata && { reference_id: metadata.promotionId || null }),
    });

    if (transactionError) throw transactionError;

    return true;
  } catch (error) {
    return false;
  }
};

export const getPlatformCreditBalance = async (userId: string): Promise<number> => {
  try {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('available_balance_in_cents')
      .eq('user_id', userId)
      .single();

    if (error || !wallet) return 0;

    return wallet.available_balance_in_cents / 100; // Convert cents to dollars
  } catch (error) {
    return 0;
  }
};

export const getUserPromotionalCredits = async (userId: string): Promise<PromotionCredit[]> => {
  // This would normally query a promotional_credits table
  // For now, return empty array since table doesn't exist
  return [];
};

export const getAvailablePromotionalCredit = async (userId: string): Promise<number> => {
  // This would normally query a promotional_credits table
  // For now, return 0 since table doesn't exist
  return 0;
};

