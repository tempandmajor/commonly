import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  ExternalLink,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Banknote,
  BarChart3,
  Calendar,
  Users,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchCreatorEarnings, getPayoutSchedule } from '@/services/earnings/earningsTracker';

interface EarningsData {
  totalEarnings: number;
  availableForPayout: number;
  pendingPayouts: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  platformFees: number;
  stripeConnectStatus: 'not_connected' | 'pending' | 'connected' | 'restricted';
  stripeAccountId?: string | undefined;
  nextPayoutDate?: string | undefined;
}

interface EarningsBreakdown {
  eventTickets: number;
  products: number;
  communities: number;
  sponsorships: number;
  other: number;
}

const CreatorEarnings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    availableForPayout: 0,
    pendingPayouts: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    platformFees: 0,
    stripeConnectStatus: 'not_connected',
  });
  const [breakdown, setBreakdown] = useState<EarningsBreakdown>({
    eventTickets: 0,
    products: 0,
    communities: 0,
    sponsorships: 0,
    other: 0,
  });
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    if (user) {
      loadEarningsData();
    }
  }, [user]);

  const loadEarningsData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('Loading earnings data for creator:', user.id);

      // Check Stripe Connect status with error handling
      let userData: { stripe_account_id?: string | null } | null = null;
      try {
        const { data } = await supabase
          .from('users')
          .select('stripe_account_id')
          .eq('id', user.id)
          .single();
        userData = data;
        console.log(
          'Stripe Connect status:',
          userData?.stripe_account_id ? 'Connected' : 'Not connected'
        );
      } catch (userError) {
        // Non-critical error, continue without Stripe status
        console.warn('Could not fetch user Stripe status:', userError);
      }

      // Get earnings data with fallback
      let earningsData: any;
      let payoutSchedule: any;

      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 90); // Last 90 days

        console.log('Fetching earnings data for date range:', { startDate, endDate });
        earningsData = await fetchCreatorEarnings(user.id, { startDate, endDate });
        payoutSchedule = await getPayoutSchedule(user.id);

        console.log('Earnings data fetched successfully:', {
          totalEarnings: earningsData.totalEarnings,
          breakdown: earningsData.breakdown,
          sources: earningsData.sources?.length || 0,
        });
      } catch (earningsError) {
        console.warn('Could not fetch earnings data, using defaults:', earningsError);
        // Provide default data structure
        earningsData = {
          totalEarnings: 0,
          availableForPayout: 0,
          pendingPayouts: 0,
          monthlyTrend: { currentMonth: 0, lastMonth: 0 },
          totalPlatformFees: 0,
          breakdown: {
            eventTickets: 0,
            productSales: 0,
            communitySubscriptions: 0,
            sponsorships: 0,
            other: 0,
          },
        };
        payoutSchedule = {
          nextPayoutDate: new Date(),
        };
      }

      setEarnings({
        totalEarnings: earningsData.totalEarnings || 0,
        availableForPayout: earningsData.availableForPayout || 0,
        pendingPayouts: earningsData.pendingPayouts || 0,
        thisMonthEarnings: earningsData.monthlyTrend?.currentMonth || 0,
        lastMonthEarnings: earningsData.monthlyTrend?.lastMonth || 0,
        platformFees: earningsData.totalPlatformFees || 0,
        stripeConnectStatus: userData?.stripe_account_id ? 'connected' : 'not_connected',
        nextPayoutDate:
          userData?.stripe_account_id && payoutSchedule?.nextPayoutDate
            ? (payoutSchedule.nextPayoutDate instanceof Date
                ? payoutSchedule.nextPayoutDate
                : new Date(payoutSchedule.nextPayoutDate)
              ).toLocaleDateString()
            : undefined,
      });

      setBreakdown({

        eventTickets: earningsData.breakdown?.eventTickets || 0,
        products: earningsData.breakdown?.productSales || 0,
        communities: earningsData.breakdown?.communitySubscriptions || 0,
        sponsorships: earningsData.breakdown?.sponsorships || 0,
        other: earningsData.breakdown?.other || 0,
      });

    } catch (error) {
      console.error('Error loading earnings data:', error);
      toast.error('Failed to load earnings data. Please try again later.');

      // Set default values instead of showing error to user
      setEarnings({
        totalEarnings: 0,
        availableForPayout: 0,
        pendingPayouts: 0,
        thisMonthEarnings: 0,
        lastMonthEarnings: 0,
        platformFees: 0,
        stripeConnectStatus: 'not_connected',
        });

      setBreakdown({
        eventTickets: 0,
        products: 0,
        communities: 0,
        sponsorships: 0,
        other: 0,
      });
    } finally {
      setLoading(false);
    }

  };

  const getNextPayoutDate = () => {
    const today = new Date();
    const nextPayout = new Date(today);
    nextPayout.setDate(today.getDate() + 7); // Assuming weekly payouts
    return nextPayout.toLocaleDateString();
  };

  const handleStripeConnect = async () => {
    setConnectingStripe(true);
    try {
      const { createConnectOnboardingLink } = await import('@/services/supabase/edge-functions');
      const resp: any = await createConnectOnboardingLink();
      const url = resp?.url || resp?.data?.url;
      if (url) {
        toast.success('Redirecting to Stripe Connect setup...');
        window.location.href = url;
      } else {
        throw new Error('No onboarding URL returned');
      }
    } catch (error) {
      console.error('Stripe Connect error:', error);
      toast.error('Failed to start Stripe Connect setup. Please try again.');
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      const { createConnectDashboardLink } = await import('@/services/supabase/edge-functions');
      const resp: any = await createConnectDashboardLink();
      const url = resp?.url || resp?.data?.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('No dashboard URL returned');
      }
    } catch (error) {
      console.error('Stripe Dashboard error:', error);
      toast.error('Failed to open Stripe Dashboard. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'restricted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className='h-4 w-4' />;
      case 'pending':
        return <Clock className='h-4 w-4' />;
      case 'restricted':
        return <AlertCircle className='h-4 w-4' />;
      default:
        return <AlertCircle className='h-4 w-4' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'pending':
        return 'Setup Required';
      case 'restricted':
        return 'Restricted';
      default:
        return 'Not Connected';
    }
  };

  const monthlyChange = earnings.thisMonthEarnings - earnings.lastMonthEarnings;
  const monthlyChangePercent =
    earnings.lastMonthEarnings > 0 ? (monthlyChange / earnings.lastMonthEarnings) * 100 : 0;

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse'>
          <div className='h-6 bg-gray-200 rounded w-1/4 mb-4'></div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {[1, 2, 3].map(i => (
              <div key={i} className='h-32 bg-gray-200 rounded-lg'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-[#2B2B2B]'>Creator Earnings</h2>
        <Badge className={`${getStatusColor(earnings.stripeConnectStatus)} border-0`}>
          {getStatusIcon(earnings.stripeConnectStatus)}
          <span className='ml-1'>{getStatusText(earnings.stripeConnectStatus)}</span>
        </Badge>
      </div>

      {/* Main Earnings Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>Total Earnings</CardTitle>
            <DollarSign className='h-4 w-4 text-gray-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-[#2B2B2B]'>
              ${earnings.totalEarnings.toFixed(2)}
            </div>
            <p className='text-xs text-gray-600 mt-1'>
              Platform fees: ${earnings.platformFees.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>
              Available for Payout
            </CardTitle>
            <Banknote className='h-4 w-4 text-gray-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              ${earnings.availableForPayout.toFixed(2)}
            </div>
            {earnings.nextPayoutDate && (
              <p className='text-xs text-gray-600 mt-1'>Next payout: {earnings.nextPayoutDate}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>This Month</CardTitle>
            <TrendingUp className='h-4 w-4 text-gray-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-[#2B2B2B]'>
              ${earnings.thisMonthEarnings.toFixed(2)}
            </div>
            <div className='flex items-center mt-1'>
              {monthlyChange >= 0 ? (
                <TrendingUp className='h-3 w-3 text-green-600 mr-1' />
              ) : (
                <TrendingUp className='h-3 w-3 text-red-600 mr-1 rotate-180' />
              )}
              <span className={`text-xs ${monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monthlyChangePercent > 0 ? '+' : ''}
                {monthlyChangePercent.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Connect Section */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Payment & Banking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.stripeConnectStatus === 'not_connected' ? (
            <div className='text-center py-8'>
              <AlertCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-[#2B2B2B] mb-2'>
                Connect your bank account
              </h3>
              <p className='text-gray-600 mb-6 max-w-md mx-auto'>
                To receive payouts and manage your earnings, you need to connect your bank account
                through Stripe.
              </p>
              <Button
                onClick={handleStripeConnect}
                disabled={connectingStripe}
                className='bg-[#2B2B2B] hover:bg-gray-800'
              >
                {connectingStripe ? (
                  <>Setting up...</>
                ) : (
                  <>
                    <ExternalLink className='mr-2 h-4 w-4' />
                    Connect Bank Account
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium text-[#2B2B2B]'>Bank account connected</p>
                  <p className='text-sm text-gray-600'>
                    Manage your payouts, banking details, and tax information in your Stripe
                    Dashboard.
                  </p>
                </div>
                <Button
                  variant='outline'
                  onClick={handleOpenStripeDashboard}
                  className='flex items-center gap-2'
                >
                  <ExternalLink className='h-4 w-4' />
                  Open Stripe Dashboard
                </Button>
              </div>

              {earnings.pendingPayouts > 0 && (
                <div className='bg-blue-50 p-4 rounded-lg'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Clock className='h-4 w-4 text-blue-600' />
                    <span className='font-medium text-blue-900'>Pending Payouts</span>
                  </div>
                  <p className='text-blue-800'>
                    ${earnings.pendingPayouts.toFixed(2)} is being processed and will be available
                    soon.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Earnings Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {earnings.totalEarnings === 0 && Object.values(breakdown).every(v => v === 0) ? (
              <div className='text-center py-8 text-gray-600'>
                <BarChart3 className='h-10 w-10 mx-auto mb-3 text-gray-400' />
                <p className='font-medium text-[#2B2B2B] mb-1'>No earnings yet</p>
                <p>
                  Once you start selling tickets, products, or subscriptions, your earnings will
                  appear here.
                </p>
              </div>
            ) : (
              <>
                {Object.entries(breakdown).map(([source, amount]) => {
                  const percentage =
                    earnings.totalEarnings > 0 ? (amount / earnings.totalEarnings) * 100 : 0;
                  const sourceLabels = {
                    eventTickets: 'Event Tickets',
                    products: 'Product Sales',
                    communities: 'Community Subscriptions',
                    sponsorships: 'Sponsorships',
                    other: 'Other',
                  };

                  if (amount === 0) return null;

                  return (
                    <div key={source} className='space-y-2'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium text-[#2B2B2B]'>
                          {sourceLabels[source as keyof typeof sourceLabels]}
                        </span>
                        <span className='text-sm text-gray-600'>
                          ${amount.toFixed(2)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className='h-2' />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

};

export default CreatorEarnings;
