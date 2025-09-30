import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Share2,
  Copy,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  ExternalLink,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ReferralLink {
  id: string;
  event_id: string;
  referral_code: string;
  clicks: number;
  conversions: number;
  total_commission_earned: number;
  is_active: boolean;
  created_at: string;
  event: {
    title: string;
    banner_image: string;
    price: number;
    referral_commission_amount: number;
    referral_commission_type: string;
  };
}

interface ReferralTransaction {
  id: string;
  commission_amount: number;
  commission_status: string;
  created_at: string;
  order: {
    total_amount: number;
    quantity: number;
  };
  event: {
    title: string;
  };
}

const ReferralDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const [transactions, setTransactions] = useState<ReferralTransaction[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    totalClicks: 0,
    totalConversions: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);

      // Fetch referral links
      const { data: links, error: linksError } = await supabase
        .from('referral_links')
        .select(
          `
          *,
          events:event_id (
            title,
            banner_image,
            price,
            referral_commission_amount,
            referral_commission_type
          )
        `
        )
        .eq('referrer_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      // Fetch transactions
      const { data: txns, error: txnsError } = await supabase
        .from('referral_transactions')
        .select(
          `
          *,
          orders:order_id (
            total_amount,
            quantity
          ),
          referral_links:referral_link_id (
            events:event_id (
              title
            )
          )
        `
        )
        .in('referral_link_id', links?.map(l => l.id) || [])
        .order('created_at', { ascending: false });

      if (txnsError) throw txnsError;

      setReferralLinks(links || []);
      setTransactions(txns || []);

      // Calculate stats
      const totalEarnings = (txns || []).reduce(
        (sum, t) => (t.commission_status === 'paid' ? sum + t.commission_amount : sum),
        0
      );
      const pendingEarnings = (txns || []).reduce(
        (sum, t) =>
          t.commission_status === 'pending' || t.commission_status === 'confirmed'
            ? sum + t.commission_amount
            : sum,
        0
      );
      const totalClicks = (links || []).reduce((sum, l) => sum + l.clicks, 0);
      const totalConversions = (links || []).reduce((sum, l) => sum + l.conversions, 0);

      setStats({
        totalEarnings,
        pendingEarnings,
        totalClicks,
        totalConversions,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      });
    } catch (error) {
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const createReferralLink = async (eventId: string) => {
    try {
      const { data, error } = await supabase.rpc('create_referral_link', {
        p_event_id: eventId,
        ...(user && { p_user_id: user.id }),
      });
      if (error) throw error;

      toast.success('Referral link created successfully!');
      fetchReferralData();

    } catch (error) {
      toast.error('Failed to create referral link');
    }

  };

  const copyReferralLink = (referralCode: string, eventTitle: string) => {
    const referralUrl = `${window.location.origin}/events/${referralCode}?ref=${referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    toast.success(`Referral link copied for ${eventTitle}!`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className='bg-green-100 text-green-800'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Paid
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge className='bg-blue-100 text-blue-800'>
            <Clock className='h-3 w-3 mr-1' />
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className='bg-yellow-100 text-yellow-800'>
            <Clock className='h-3 w-3 mr-1' />
            Pending
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className='bg-red-100 text-red-800'>
            <AlertCircle className='h-3 w-3 mr-1' />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant='secondary'>{status}</Badge>;
    }
  };

  const exportData = () => {
    const csvData = transactions.map(t => ({
      Date: new Date(t.created_at).toLocaleDateString(),
      Event: t.referral_links?.events?.title || 'Unknown',
      'Commission Amount': `$${t.commission_amount.toFixed(2)}`,
      Status: t.commission_status,
      'Order Total': `$${t.order?.total_amount?.toFixed(2) || '0.00'}`,
      Quantity: t.order?.quantity || 0,
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
          ...csvData.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'referral-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Referral Dashboard</h1>
          <p className='text-muted-foreground'>
            Manage your referral links and track your earnings
          </p>
        </div>
        <Button onClick={exportData} variant='outline' className='gap-2'>
          <Download className='h-4 w-4' />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Earnings</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${stats.totalEarnings.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground'>
              +${stats.pendingEarnings.toFixed(2)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Clicks</CardTitle>
            <Eye className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalClicks}</div>
            <p className='text-xs text-muted-foreground'>Across all referral links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Conversions</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalConversions}</div>
            <p className='text-xs text-muted-foreground'>Successful referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Conversion Rate</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.conversionRate.toFixed(1)}%</div>
            <p className='text-xs text-muted-foreground'>Clicks to purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue='links' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='links'>Referral Links</TabsTrigger>
          <TabsTrigger value='transactions'>Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value='links' className='space-y-4'>
          {referralLinks.length === 0 ? (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-12'>
                <Share2 className='h-12 w-12 text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>No Referral Links Yet</h3>
                <p className='text-muted-foreground text-center mb-4'>
                  Start earning commissions by creating referral links for events with referral
                  programs enabled.
                </p>
                <Button
                  onClick={e => {
                    e.preventDefault();
                    navigate('/explore');
                  }}
                >
                  Browse Events
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4'>
              {referralLinks.map(link => (
                <Card key={link.id}>
                  <CardContent className='p-6'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start space-x-4'>
                        <img
                          src={link.event.banner_image}
                          alt={link.event.title}
                          className='w-16 h-16 object-cover rounded-lg'
                        />
                        <div className='flex-1'>
                          <h3 className='font-semibold text-lg'>{link.event.title}</h3>
                          <div className='flex items-center gap-4 mt-2 text-sm text-muted-foreground'>
                            <span className='flex items-center gap-1'>
                              <Eye className='h-4 w-4' />
                              {link.clicks} clicks
                            </span>
                            <span className='flex items-center gap-1'>
                              <Users className='h-4 w-4' />
                              {link.conversions} conversions
                            </span>
                            <span className='flex items-center gap-1'>
                              <DollarSign className='h-4 w-4' />$
                              {link.total_commission_earned.toFixed(2)} earned
                            </span>
                          </div>
                          <div className='mt-2'>
                            <Badge variant={link.is_active ? 'default' : 'secondary'}>
                              {link.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <span className='ml-2 text-sm text-muted-foreground'>
                              Commission:{' '}
                              {link.event.referral_commission_type === 'fixed'
                                ? `$${link.event.referral_commission_amount}`
                                : `${link.event.referral_commission_amount}%`}{' '}
                              per ticket
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => copyReferralLink(link.referral_code, link.event.title)}
                          className='gap-2'
                        >
                          <Copy className='h-4 w-4' />
                          Copy Link
                        </Button>
                        <Button variant='outline' size='sm' asChild>
                          <a
                            href={`/events/${link.event_id}?ref=${link.referral_code}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='gap-2'
                          >
                            <ExternalLink className='h-4 w-4' />
                            View Event
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='transactions' className='space-y-4'>
          {transactions.length === 0 ? (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-12'>
                <DollarSign className='h-12 w-12 text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>No Transactions Yet</h3>
                <p className='text-muted-foreground text-center'>
                  Your referral commissions will appear here once people start purchasing tickets
                  through your links.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Track your referral commissions and payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {transactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className='flex items-center justify-between p-4 border rounded-lg'
                    >
                      <div className='flex items-center space-x-4'>
                        <div className='flex-1'>
                          <h4 className='font-medium'>
                            {transaction.referral_links?.events?.title}
                          </h4>
                          <p className='text-sm text-muted-foreground'>
                            {new Date(transaction.created_at).toLocaleDateString()} • Order: $
                            {transaction.order?.total_amount?.toFixed(2)} (
                            {transaction.order?.quantity} tickets)
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-4'>
                        <div className='text-right'>
                          <div className='font-semibold'>
                            ${transaction.commission_amount.toFixed(2)}
                          </div>
                          {getStatusBadge(transaction.commission_status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Alert>
        <Share2 className='h-4 w-4' />
        <AlertDescription>
          <strong>How to maximize your earnings:</strong> Share your referral links on social media,
          in relevant communities, or with friends who might be interested in the events. The more
          targeted your sharing, the higher your conversion rate will be.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ReferralDashboard;

