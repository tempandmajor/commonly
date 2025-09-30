/**
 * Earnings Tracking Service
 *
 * Aggregates revenue from multiple sources (events, products, communities, etc.)
 * and provides comprehensive earnings analytics for creators.
 */

import { supabase } from '@/integrations/supabase/client';

export interface EarningsSource {
  id: string;
  type: 'event_tickets' | 'product_sales' | 'community_subscriptions' | 'sponsorships' | 'other';
  description: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  date: Date;
  status: 'completed' | 'pending' | 'processing';
  reference?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface EarningsAggregation {
  totalEarnings: number;
  availableForPayout: number;
  pendingPayouts: number;
  monthlyTrend: {
    currentMonth: number;
    lastMonth: number;
  };
  totalPlatformFees: number;
  breakdown: {
    eventTickets: number;
    productSales: number;
    communitySubscriptions: number;
    sponsorships: number;
    other: number;
  };
  sources: EarningsSource[];
}

export interface PayoutSchedule {
  nextPayoutDate: Date;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  minimumAmount: number;
  estimatedAmount: number;
}

/**
 * Fetch comprehensive earnings data for a creator
 */
export async function fetchCreatorEarnings(
  creatorId: string,
  dateRange: {
    startDate: Date;
    endDate: Date;
  }
): Promise<EarningsAggregation> {
  try {
    // Fetch earnings from multiple sources
    const [eventEarnings, productEarnings, communityEarnings, walletTransactions] =
      await Promise.all([
        fetchEventEarnings(creatorId, dateRange),
        fetchProductEarnings(creatorId, dateRange),
        fetchCommunityEarnings(creatorId, dateRange),
        fetchWalletTransactions(creatorId, dateRange),
      ]);

    // Calculate monthly trends
    const currentMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(currentMonth.getMonth() - 1);

    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

    const [currentMonthEarnings, lastMonthEarnings] = await Promise.all([
      calculateEarningsForPeriod(creatorId, { startDate: currentMonthStart, endDate: new Date() }),
      calculateEarningsForPeriod(creatorId, { startDate: lastMonthStart, endDate: lastMonthEnd }),
    ]);

    // Aggregate all earnings
    const totalEarnings = eventEarnings.total + productEarnings.total + communityEarnings.total;
    const totalPlatformFees =
      eventEarnings.platformFees + productEarnings.platformFees + communityEarnings.platformFees;
    const netEarnings = totalEarnings - totalPlatformFees;

    // Calculate available/pending payouts from wallet transactions
    const availableForPayout = await calculateAvailableBalance(creatorId);
    const pendingPayouts = await calculatePendingPayouts(creatorId);

    // Combine all sources
    const allSources = [
          ...eventEarnings.sources,
          ...productEarnings.sources,
          ...communityEarnings.sources,
    ];

    return {
      totalEarnings: netEarnings,
      availableForPayout,
      pendingPayouts,
      monthlyTrend: {
        currentMonth: currentMonthEarnings,
        lastMonth: lastMonthEarnings,
      },
      totalPlatformFees,
      breakdown: {
        eventTickets: eventEarnings.total - eventEarnings.platformFees,
        productSales: productEarnings.total - productEarnings.platformFees,
        communitySubscriptions: communityEarnings.total - communityEarnings.platformFees,
        sponsorships: 0, // TODO: Implement when sponsorships are added
        other: 0,
      },
      sources: allSources,
    };
  } catch (error) {
    console.error('Error fetching creator earnings:', error);
    throw new Error('Failed to fetch earnings data');
  }
}

/**
 * Fetch earnings from event ticket sales
 */
async function fetchEventEarnings(
  creatorId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<{ total: number; platformFees: number; sources: EarningsSource[] }> {
  try {
    // Get events created by this user
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, price')
      .eq('creator_id', creatorId)
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (eventsError) throw eventsError;

    if (!events || events.length === 0) {
      return { total: 0, platformFees: 0, sources: [] };
    }

    const eventIds = (events as any).map((e: any) => e.id);

    // Get ticket sales from event registrations
    const { data: registrations, error: registrationsError } = await supabase
      .from('event_registrations')
      .select('event_id, created_at, payment_status')
      .in('event_id', eventIds)
      .eq('payment_status', 'completed')
      .gte('registration_date', dateRange.startDate.toISOString())
      .lte('registration_date', dateRange.endDate.toISOString());

    if (registrationsError) throw registrationsError;

    // Also check for ticket purchases in payments table
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount_in_cents, created_at, description, metadata')
      .eq('user_id', creatorId)
      .eq('status', 'completed')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (paymentsError) throw paymentsError;

    const sources: EarningsSource[] = [];
    let total = 0;

    // Process event registrations
    if (registrations) {
      const registrationsByEvent = (registrations as any).reduce(
        (acc: any, reg: any) => {
          acc[reg.event_id] = (acc[reg.event_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      Object.entries(registrationsByEvent).forEach(([eventId, count]) => {
        const event = (events as any).find((e: any) => e.id === eventId);
        if (event && event.price) {
          const amount = event!.price * count;
          const platformFee = amount * 0.029 + 0.3; // Stripe fees

          sources.push({
            id: `event_${eventId}`,
            type: 'event_tickets',
            description: `${event!.title} - ${count} ticket(s)`,
            amount,
            platformFee,
            netAmount: amount - platformFee,
            date: new Date(),
            status: 'completed',
            reference: eventId,
          });

          total += amount;
        }
      });
    }

    // Process direct payments for events
    if (payments) {
      payments.forEach(payment => {
        const amount = payment.amount_in_cents / 100;
        const platformFee = amount * 0.029 + 0.3;

        sources.push({
          id: payment.created_at || '',
          type: 'event_tickets',
          description: payment.description || 'Event ticket payment',
          amount,
          platformFee,
          netAmount: amount - platformFee,
          date: new Date(payment.created_at || ''),
          status: 'completed',
        });

        total += amount;
      });
    }

    const platformFees = sources.reduce((sum, source) => sum + source.platformFee, 0);
    return { total, platformFees, sources };
  } catch (error) {
    console.error('Error fetching event earnings:', error);
    return { total: 0, platformFees: 0, sources: [] };
  }
}

/**
 * Fetch earnings from product sales
 */
async function fetchProductEarnings(
  creatorId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<{ total: number; platformFees: number; sources: EarningsSource[] }> {
  try {
    // Get orders for products created by this user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(
        `
        id,
        total_price,
        quantity,
        created_at,
        status,
        products!inner(id, name, creator_id)
      `
      )
      .eq('products.creator_id', creatorId)
      .eq('status', 'confirmed')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (ordersError) throw ordersError;

    const sources: EarningsSource[] = [];
    let total = 0;

    if (orders) {
      orders.forEach(order => {
        const amount = Number(order.total_price) as number;
        const platformFee = amount * 0.029 + 0.3; // Stripe fees

        sources.push({
          id: order.id,
          type: 'product_sales',
          description: `${order.products?.name} - ${order.quantity} unit(s)`,
          amount,
          platformFee,
          netAmount: amount - platformFee,
          date: new Date(order.created_at || ''),
          status: 'completed',
          reference: order.id,
        });

        total += amount;
      });
    }

    const platformFees = sources.reduce((sum, source) => sum + source.platformFee, 0);
    return { total, platformFees, sources };
  } catch (error) {
    console.error('Error fetching product earnings:', error);
    return { total: 0, platformFees: 0, sources: [] };
  }
}

/**
 * Fetch earnings from community subscriptions
 */
async function fetchCommunityEarnings(
  creatorId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<{ total: number; platformFees: number; sources: EarningsSource[] }> {
  try {
    // Get wallet transactions related to community subscriptions
    const { data: transactions, error } = await supabase
      .from('wallet_transactions')
      .select('amount_cents, created_at, description, reference_type, reference_id')
      .eq('user_id', creatorId)
      .eq('type', 'credit')
      .eq('reference_type', 'community_subscription')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (error) throw error;

    const sources: EarningsSource[] = [];
    let total = 0;

    if (transactions) {
      transactions.forEach(tx => {
        const amount = tx.amount_cents / 100;
        const platformFee = amount * 0.1; // 10% platform fee for subscriptions

        sources.push({
          id: tx.reference_id || '',
          type: 'community_subscriptions',
          description: tx.description || 'Community subscription payment',
          amount,
          platformFee,
          netAmount: amount - platformFee,
          date: new Date(tx.created_at || ''),
          status: 'completed',
          reference: tx.reference_id || undefined,
        });

        total += amount;
      });
    }

    const platformFees = sources.reduce((sum, source) => sum + source.platformFee, 0);
    return { total, platformFees, sources };
  } catch (error) {
    console.error('Error fetching community earnings:', error);
    return { total: 0, platformFees: 0, sources: [] };
  }
}

/**
 * Fetch wallet transactions for calculation
 */
async function fetchWalletTransactions(
  creatorId: string,
  dateRange: { startDate: Date; endDate: Date }
) {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', creatorId)
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    return [];
  }
}

/**
 * Calculate earnings for a specific period
 */
async function calculateEarningsForPeriod(
  creatorId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<number> {
  try {
    const earnings = await fetchCreatorEarnings(creatorId, dateRange);
    return earnings.totalEarnings;
  } catch (error) {
    console.error('Error calculating period earnings:', error);
    return 0;
  }
}

/**
 * Calculate available balance for payout
 */
async function calculateAvailableBalance(creatorId: string): Promise<number> {
  try {
    // Get user's wallet balance
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('available_balance_in_cents')
      .eq('user_id', creatorId)
      .single();

    if (error) throw error;
    return wallet ? (wallet.available_balance_in_cents || 0) / 100 : 0;
  } catch (error) {
    console.error('Error calculating available balance:', error);
    return 0;
  }
}

/**
 * Calculate pending payouts
 */
async function calculatePendingPayouts(creatorId: string): Promise<number> {
  try {
    // Get user's pending balance
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('pending_balance_in_cents')
      .eq('user_id', creatorId)
      .single();

    if (error) throw error;
    return wallet ? (wallet.pending_balance_in_cents || 0) / 100 : 0;
  } catch (error) {
    console.error('Error calculating pending payouts:', error);
    return 0;
  }
}

/**
 * Get payout schedule information
 */
export async function getPayoutSchedule(creatorId: string): Promise<PayoutSchedule> {
  try {
    const availableBalance = await calculateAvailableBalance(creatorId);

    // Default payout schedule - weekly on Fridays
    const today = new Date();
    const nextPayout = new Date();
    const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
    nextPayout.setDate(today.getDate() + daysUntilFriday);

    return {
      nextPayoutDate: nextPayout,
      frequency: 'weekly',
      minimumAmount: 25, // $25 minimum payout
      estimatedAmount: availableBalance,
    };
  } catch (error) {
    console.error('Error getting payout schedule:', error);
    return {
      nextPayoutDate: new Date(),
      frequency: 'weekly',
      minimumAmount: 25,
      estimatedAmount: 0,
    };
  }
}

/**
 * Generate earnings report for a specific period
 */
export async function generateEarningsReport(
  creatorId: string,
  dateRange: { startDate: Date; endDate: Date },
  format: 'json' | 'csv' = 'json'
): Promise<string | EarningsAggregation> {
  const earnings = await fetchCreatorEarnings(creatorId, dateRange);

  if (format === 'csv') {
    const csvRows = [
      ['Date', 'Type', 'Description', 'Amount', 'Platform Fee', 'Net Amount', 'Status'].join(','),
          ...earnings.sources.map(source =>
        [
          source.date.toISOString().split('T')[0],
          source.type.replace('_', ' '),
          source.description,
          source.amount.toFixed(2),
          source.platformFee.toFixed(2),
          source.netAmount.toFixed(2),
          source.status,
        ].join(',')
      ),
    ];
    return csvRows.join('\n');
  }

  return earnings;
}

/**
 * Check if creator is eligible for Creator Program benefits
 */
export async function checkCreatorProgramStatus(creatorId: string): Promise<{
  isEligible: boolean;
  currentTier: 'standard' | 'creator_program';
  benefits: string[];
  nextTierRequirements?: string[];
}> {
  // Mock Creator Program status check
  // In reality, this would check:
  // - Total earnings history
  // - Number of successful events/products
  // - Community engagement metrics
  // - Review/rating scores

  return {
    isEligible: false,
    currentTier: 'standard',
    benefits: ['Standard platform features', 'Basic analytics', 'Community support'],
    nextTierRequirements: [
      'Generate $1,000+ in earnings',
      'Host 5+ successful events',
      'Maintain 4.5+ star rating',
      'Complete verification process',
    ],
  };
}

export default {
  fetchCreatorEarnings,
  getPayoutSchedule,
  generateEarningsReport,
  checkCreatorProgramStatus,
};
