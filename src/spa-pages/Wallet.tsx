import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ExternalLink,
  BarChart3,
  CreditCard,
  Settings,
  DollarSign,
  Shield,
  ArrowRight,
  Receipt,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Info,
  Building,
  Wallet,
  FileText,
  PieChart,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/ui/loading';
import { supabase } from '@/integrations/supabase/client';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  pendingPayouts: number;
  nextPayoutDate: string | null;
  isStripeConnected: boolean;
  accountStatus: 'active' | 'restricted' | 'pending' | 'inactive';
}

interface StripeAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  external: boolean;
  badge?: string | undefined;
  color: string;
}

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { track } = useAnalytics('wallet', 'Wallet & Earnings');
  const [searchParams] = useSearchParams();
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load earnings summary and Stripe Connect status
  useEffect(() => {
    if (user?.id) {
      loadEarningsData();
      track('wallet_page_viewed');
    }
  }, [user?.id, track]);

  const loadEarningsData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Fetch user's earnings data
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('current_amount, status, created_at')
        .eq('creator_id', user.id);

      if (eventsError) throw eventsError;

      // Calculate earnings summary
      const events = eventsData || [];
      const totalEarnings = events.reduce((sum, event) => sum + (event.current_amount || 0), 0) / 100;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = events
        .filter(event => {
          const eventDate = new Date(event.created_at);
          return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
        })
        .reduce((sum, event) => sum + (event.current_amount || 0), 0) / 100;

      // Check Stripe Connect status
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('stripe_account_id, stripe_account_status')
        .eq('user_id', user.id)
        .single();

      const summary: EarningsSummary = {
        totalEarnings,
        thisMonth,
        pendingPayouts: totalEarnings * 0.1, // Simplified calculation
        nextPayoutDate: getNextPayoutDate(),
        isStripeConnected: !!profileData?.stripe_account_id,
        accountStatus: profileData?.stripe_account_status || 'inactive',
      };

      setEarningsSummary(summary);

    } catch (error) {
      console.error('Failed to load earnings data:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setIsLoading(false);
    }

  }, [user?.id]);

  const getNextPayoutDate = (): string => {
    const today = new Date();
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
    return nextFriday.toLocaleDateString();
  };

  const redirectToStripe = useCallback(async (action: string) => {
    try {
      track('stripe_redirect_initiated', { action });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to access Stripe dashboard');
        return;
      }

      // Call your edge function to create Stripe dashboard link
      const { data, error } = await supabase.functions.invoke('create-stripe-dashboard-link', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { return_url: window.location.origin + '/wallet?from=stripe' },
      });

      if (error) throw error;

      const dashboardUrl = data?.url;
      if (dashboardUrl) {
        track('stripe_redirect_success', { action });
        window.open(dashboardUrl, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No dashboard URL returned');
      }
    } catch (error) {
      console.error('Failed to redirect to Stripe:', error);
      track('stripe_redirect_failed', { action, error: (error as Error).message });
      toast.error('Failed to open Stripe dashboard. Please try again.');
    }
  }, [track]);

  const initiateStripeConnect = useCallback(async () => {
    try {
      track('stripe_connect_initiated');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to connect with Stripe');
        return;
      }

      // Call your edge function to create Stripe Connect onboarding link
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-link', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          return_url: window.location.origin + '/connect/complete',
          refresh_url: window.location.origin + '/connect/refresh',
        },
      });

      if (error) throw error;

      const connectUrl = data?.url;
      if (connectUrl) {
        track('stripe_connect_redirect');
        window.location.href = connectUrl;
      } else {
        throw new Error('No connect URL returned');
      }
    } catch (error) {
      console.error('Failed to initiate Stripe Connect:', error);
      track('stripe_connect_failed', { error: (error as Error).message });
      toast.error('Failed to start Stripe Connect. Please try again.');
    }
  }, [track]);

  const stripeActions: StripeAction[] = [
    {
      id: 'earnings',
      title: 'View Detailed Earnings',
      description: 'See complete earnings breakdown, analytics, and reports',
      icon: BarChart3,
      action: () => redirectToStripe('earnings'),
      external: true,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
    },
    {
      id: 'payouts',
      title: 'Manage Payouts',
      description: 'Set up bank accounts and manage payout schedules',
      icon: DollarSign,
      action: () => redirectToStripe('payouts'),
      external: true,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      id: 'payment-methods',
      title: 'Payment Methods',
      description: 'Add and manage payment methods for your account',
      icon: CreditCard,
      action: () => redirectToStripe('payment-methods'),
      external: true,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      description: 'View complete transaction history and receipts',
      icon: Receipt,
      action: () => redirectToStripe('transactions'),
      external: true,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
    },
    {
      id: 'tax-documents',
      title: 'Tax Documents',
      description: 'Download 1099s and other tax-related documents',
      icon: FileText,
      action: () => redirectToStripe('tax-documents'),
      external: true,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
    },
    {
      id: 'account-settings',
      title: 'Account Settings',
      description: 'Update business information and account details',
      icon: Settings,
      action: () => redirectToStripe('account-settings'),
      external: true,
      color: 'bg-gradient-to-br from-gray-500 to-gray-600',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'restricted':
        return <Badge className="bg-red-100 text-red-800"><Info className="h-3 w-3 mr-1" />Restricted</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  // Show success message when returning from Stripe
  useEffect(() => {
    const fromStripe = searchParams.get('from');
    if (fromStripe === 'stripe') {
      toast.success('Welcome back! Your financial data has been updated.');
      // Remove the parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('from');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate]);

  if (isLoading) {
    return (
      <>
        <SimpleHeader />
        <div className="container mx-auto px-4 py-8">
          <LoadingSkeleton skeletonType="card" className="mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <LoadingSkeleton skeletonType="card" />
            <LoadingSkeleton skeletonType="card" />
            <LoadingSkeleton skeletonType="card" />
          </div>
          <LoadingSkeleton skeletonType="list" skeletonCount={5} className="mt-8" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SimpleHeader />
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                <Wallet className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Financial Dashboard
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Manage your earnings, payouts, and financial settings through Stripe's secure platform
            </p>
          </div>

          {/* Stripe Connect Status */}
          {earningsSummary && (
            <div className="mb-12">
              {!earningsSummary.isStripeConnected ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between w-full">
                    <div>
                      <strong>Connect with Stripe to start earning:</strong> Set up your account to receive payments and access financial tools.
                    </div>
                    <Button onClick={initiateStripeConnect} className="ml-4">
                      Connect with Stripe
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <strong>Stripe Connected:</strong> Account status - {getStatusBadge(earningsSummary.accountStatus)}
                    </div>
                    <Button variant="outline" onClick={() => redirectToStripe('dashboard')} className="ml-4">
                      Open Stripe Dashboard
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Earnings Overview */}
          {earningsSummary && earningsSummary.isStripeConnected && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(earningsSummary.totalEarnings)}</div>
                  <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(earningsSummary.thisMonth)}</div>
                  <p className="text-xs text-muted-foreground">Current month earnings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(earningsSummary.pendingPayouts)}</div>
                  <p className="text-xs text-muted-foreground">Available soon</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{earningsSummary.nextPayoutDate || 'N/A'}</div>
                  <p className="text-xs text-muted-foreground">Expected date</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stripe Actions Grid */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">Financial Management</h2>
              <p className="text-muted-foreground">
                All financial operations are securely managed through Stripe's platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stripeActions.map((action) => (
                <Card key={action.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn("p-3 rounded-lg text-white", action.color)}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      {action.external && (
                        <Badge variant="secondary" className="text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Stripe
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                      {action.description}
                    </p>

                    <Button
                      onClick={action.action}
                      variant="outline"
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                      disabled={!earningsSummary.isStripeConnected && action.id !== 'connect'}
                    >
                      <span className="flex items-center justify-between w-full">
                        {action.external ? 'Open in Stripe' : 'Access'}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Security & Trust Section */}
          <Card className="border-2 border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Trust
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Bank-Level Security</h4>
                      <p className="text-sm text-muted-foreground">All financial data is encrypted and secured by Stripe</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">PCI Compliance</h4>
                      <p className="text-sm text-muted-foreground">Certified for handling payment information</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Fraud Protection</h4>
                      <p className="text-sm text-muted-foreground">Advanced machine learning protects your account</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">24/7 Monitoring</h4>
                      <p className="text-sm text-muted-foreground">Continuous monitoring for suspicious activity</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="font-medium">Why Stripe?</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use Stripe to ensure your financial data is handled with the highest security standards.
                  Stripe processes billions of dollars annually for businesses worldwide and is trusted by companies like Amazon, Google, and Microsoft.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default WalletPage;