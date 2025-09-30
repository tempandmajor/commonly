import { supabase } from '@/integrations/supabase/client';

export const handleReferralBonus = async (userId: string, referrerId: string) => {
  try {
    // Create referral record with correct field names
    const { error: referralError } = await supabase.from('referral_codes').insert({
      user_id: referrerId, // Use user_id instead of referrer_id
      code: `REF_${Date.now()}`, // Generate a code since it's required
      usage_count: 1,
      max_uses: 1,
    });

    if (referralError) {
      return;
    }

    // Create credit transaction with correct transaction type
    const { error: transactionError } = await supabase.from('credit_transactions').insert({
      user_id: referrerId,
      amount: 1000,
      transaction_type: 'referral', // Use allowed transaction type
      reference_id: userId,
      status: 'completed',
      description: 'Referral bonus',
    });

    if (transactionError) {
    }
  } catch (_error) {
    // Error handling silently ignored
  }
};

export const handleReferral = async (data: unknown) => {
  try {
    const { userId, referrerId } = data;
    if (userId && referrerId) {
      await handleReferralBonus(userId, referrerId);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};
