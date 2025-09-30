import { supabase } from '@/integrations/supabase/client';
import { PLATFORM_FEE_PERCENT, CREATOR_PROGRAM_FEE_PERCENT } from '@/services/fees/feeCalculator';

export const getUserEarnings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'earning');

    if (error) throw error;

    const totalEarnings =
      data?.reduce((sum, transaction) => {
        return sum + (transaction.amount_in_cents || 0);
      }, 0) || 0;

    return {
      totalEarnings: totalEarnings / 100, // Convert cents to dollars
      transactions: data || [],
    };
  } catch (error) {
    return {
      totalEarnings: 0,
      transactions: [],
    };
  }
};

/**
 * Calculate earnings with Creator Program support
 * @param amount - Gross amount
 * @param isCreatorProgram - Whether user is in Creator Program
 * @returns Earnings breakdown with dynamic fee calculation
 */
export const calculateEarnings = (amount: number, isCreatorProgram: boolean = false) => {
  const feePercentage = isCreatorProgram
    ? CREATOR_PROGRAM_FEE_PERCENT / 100
    : PLATFORM_FEE_PERCENT / 100;
  const fee = amount * feePercentage;
  const earnings = amount - fee;

  return {
    grossAmount: amount,
    fee,
    netEarnings: earnings,
    feePercentage: feePercentage * 100,
    isCreatorProgram,
  };
};

export const getYearlyEarnings = async (userId: string, year?: number) => {
  const targetYear = year || new Date().getFullYear();
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'earning')
      .gte('created_at', `${targetYear}-01-01`)
      .lt('created_at', `${targetYear + 1}-01-01`);

    if (error) throw error;

    const totalEarnings =
      data?.reduce((sum, transaction) => {
        return sum + (transaction.amount_in_cents || 0);
      }, 0) || 0;

    return totalEarnings / 100;
  } catch (error) {
    return 0;
  }
};

export interface EarningStats {
  totalEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  transactionCount: number;
  earnings: number; // Add missing earnings property
  attendees: number; // Add missing attendees property
  eventsCreated: number; // Add missing eventsCreated property
  referralEarnings: number; // Add missing referralEarnings property
  sponsorshipEarnings: number; // Add missing sponsorshipEarnings property
}

export const getEarningStats = async (userId: string): Promise<EarningStats> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'earning');

    if (error) throw error;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalEarnings =
      data?.reduce((sum, transaction) => {
        return sum + (transaction.amount_in_cents || 0);
      }, 0) || 0;

    const monthlyEarnings =
      data
        ?.filter(transaction => {
          const transactionDate = new Date(transaction.created_at);
          return (
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, transaction) => {
          return sum + (transaction.amount_in_cents || 0);
        }, 0) || 0;

    const yearlyEarnings =
      data
        ?.filter(transaction => {
          const transactionDate = new Date(transaction.created_at);
          return transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, transaction) => {
          return sum + (transaction.amount_in_cents || 0);
        }, 0) || 0;

    // Get count of events created by this user
    const { count: eventsCreated, error: eventsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId);

    if (eventsError) {
    }

    // Get total count of attendees for all events created by this user
    const { data: attendeeData, error: attendeesError } = await supabase
      .from('events')
      .select(
        `
        id, 
        event_attendees(count)
      `
      )
      .eq('creator_id', userId);

    if (attendeesError) {
    }

    const attendees =
      attendeeData?.reduce((sum, event) => {
        return sum + (event.event_attendees?.[0]?.count || 0);
      }, 0) || 0;

    // Get referral earnings
    const { data: referralData, error: referralError } = await supabase
      .from('earnings_transactions')
      .select('amount_in_cents')
      .eq('user_id', userId)
      .eq('transaction_type', 'referral');

    if (referralError) {
    }

    const referralEarnings =
      referralData?.reduce((sum, transaction) => {
        return sum + (transaction.amount_in_cents || 0);
      }, 0) || 0;

    // Get sponsorship earnings
    const { data: sponsorshipData, error: sponsorshipError } = await supabase
      .from('earnings_transactions')
      .select('amount_in_cents')
      .eq('user_id', userId)
      .eq('transaction_type', 'sponsorship');

    if (sponsorshipError) {
    }

    const sponsorshipEarnings =
      sponsorshipData?.reduce((sum, transaction) => {
        return sum + (transaction.amount_in_cents || 0);
      }, 0) || 0;

    return {
      totalEarnings: totalEarnings / 100,
      monthlyEarnings: monthlyEarnings / 100,
      yearlyEarnings: yearlyEarnings / 100,
      ...(data && { transactionCount: data.length || 0 }),
      earnings: totalEarnings / 100,
      attendees,
      eventsCreated: eventsCreated || 0,
      referralEarnings: referralEarnings / 100,
      sponsorshipEarnings: sponsorshipEarnings / 100,

    };

  } catch (error) {
    return {
      totalEarnings: 0,
      monthlyEarnings: 0,
      yearlyEarnings: 0,
      transactionCount: 0,
      earnings: 0,
      attendees: 0,
      eventsCreated: 0,
      referralEarnings: 0,
      sponsorshipEarnings: 0,
    };
  }

};

