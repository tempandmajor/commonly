import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { ReferralStats } from '@/services/wallet/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useReferrals = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    earnings: 0,
    conversionRate: 0,
    totalEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Gets or creates a user's referral code from the referral_codes table
   * @param userId - The ID of the user to get the referral code for
   * @returns The user's referral code as a string
   */
  const getUserReferralCode = async (userId: string): Promise<string> => {
    try {
      // Check if user already has a referral code
      const { data: existingCode, error: fetchError } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Not a 'no rows found' error
        throw fetchError;
      }

      if (existingCode?.code) {
        return existingCode.code;
      }

      // Create a new referral code if one doesn't exist
      const newCode = `REF-${userId.substring(0, 8).toUpperCase()}`;

      const { data: insertedCode, error: insertError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: newCode,
          created_at: new Date().toISOString(),
        })
        .select('code')
        .single();

      if (insertError) throw insertError;

      return insertedCode?.code || newCode;
    } catch (error) {
      toast.error('Failed to retrieve referral code');
      return `REF-${userId.substring(0, 6).toUpperCase()}`; // Fallback
    }
  };

  /**
   * Gets referral statistics for a user from the referrals and transactions tables
   * @param userId - The ID of the user to get referral stats for
   * @returns ReferralStats object with current referral metrics
   */
  const getReferralStats = async (userId: string): Promise<ReferralStats> => {
    try {
      // Get all referrals created by this user
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('id, status, referred_user_id, created_at')
        .eq('referrer_id', userId);

      if (referralsError) throw referralsError;

      // Count total, active and pending referrals
      const totalReferrals = referrals?.length || 0;
      const activeReferrals = referrals?.filter(r => r.status === 'completed')?.length || 0;
      const pendingReferrals = referrals?.filter(r => r.status === 'pending')?.length || 0;

      // Get earnings from referral-related transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'referral_bonus');

      if (transactionsError) throw transactionsError;

      const earnings = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

      // Calculate conversion rate
      const conversionRate = totalReferrals > 0 ? activeReferrals / totalReferrals : 0;

      return {
        totalReferrals,
        activeReferrals,
        pendingReferrals,
        earnings,
        conversionRate,
        totalEarnings: earnings, // Same as earnings for now
      };
    } catch (error) {
      toast.error('Failed to retrieve referral statistics');

      // Return empty stats as fallback
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        pendingReferrals: 0,
        earnings: 0,
        conversionRate: 0,
        totalEarnings: 0,
      };
    }
  };

  const loadReferralData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const [code, referralStats] = await Promise.all([
        getUserReferralCode(user.id),
        getReferralStats(user.id),
      ]);

      setReferralCode(code);
      setStats(referralStats);
    } catch (_error) {
      // Error handling silently ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, [user]);

  return {
    referralCode,
    stats,
    isLoading,
    loadReferralData,
  };
};
