import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const getUserReferralCode = async (userId: string) => {
  try {
    // First check if user has a referral code
    const { data: referralData, error: referralError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (referralError && referralError.code !== 'PGRST116') {
      throw referralError;
    }

    if (referralData) {
      return referralData.code;
    }

    // Generate new referral code if none exists
    const newCode = generateReferralCode();

    const { error: insertError } = await supabase.from('referral_codes').insert({
      user_id: userId,
      code: newCode,
      max_uses: 10,
      usage_count: 0,
    });

    if (insertError) throw insertError;

    return newCode;
  } catch (error) {
    toast.error('Failed to load referral code');
    return null;
  }
};

const generateReferralCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const applyReferralCode = async (userId: string, code: string): Promise<boolean> => {
  try {
    // Find the referral code
    const { data: referralData, error: findError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (findError) {
      toast.error('Invalid referral code');
      return false;
    }

    if (!referralData) {
      toast.error('Referral code not found');
      return false;
    }

    if (referralData.user_id === userId) {
      toast.error('You cannot use your own referral code');
      return false;
    }

    if (referralData.usage_count >= referralData.max_uses) {
      toast.error('This referral code has reached its usage limit');
      return false;
    }

    // Update usage count
    const { error: updateError } = await supabase
      .from('referral_codes')
      .update({
        usage_count: referralData.usage_count + 1,
      })
      .eq('id', referralData.id);

    if (updateError) throw updateError;

    toast.success('Referral code applied successfully!');
    return true;
  } catch (error) {
    toast.error('Failed to apply referral code');
    return false;
  }
};

// Add missing exports
export const getReferralStats = async (userId: string) => {
  try {
    const { data, error } = await supabase.from('referral_codes').select('*').eq('user_id', userId);

    if (error) throw error;

    return {
      totalReferrals: data?.length || 0,
      activeReferrals: data?.filter(r => r.usage_count < r.max_uses).length || 0,
    };

  } catch (error) {
    return { totalReferrals: 0, activeReferrals: 0 };
  }

};

export const getReferralTransactions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'referral_bonus')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    return [];
  }
};

