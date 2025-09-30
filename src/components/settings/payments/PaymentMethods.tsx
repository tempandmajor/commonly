import React, { useState } from 'react';
import { CreditCard, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { StripeService } from '@/services/stripe';
import { toast } from 'sonner';
import type { WalletPreferences } from '@/services/user/core/types';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

// Updated interface to match what's expected in PaymentsTab
interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[];
  loading: boolean;
  wallet: WalletPreferences;
  onWalletChange: (wallet: WalletPreferences) => void;
  onSaveWallet: () => void;
}

const PaymentMethods = ({
  paymentMethods,
  loading,
  wallet,
  onWalletChange,
  onSaveWallet,
}: PaymentMethodsProps) => {
  const {
    hasStripeConnect,
    isLoading: stripeLoading,
    stripeAccountId,
    refreshStripeStatus,
  } = useStripeConnect();
  const [setupLoading, setSetupLoading] = useState(false);

  const handleSetupStripeConnect = async () => {
    setSetupLoading(true);
    try {
      const result = await StripeService.createConnectOnboardingLink();
      if (result.url) {
        toast.success('Redirecting to Stripe Connect setup...');
        window.location.href = result.url;
      } else {
        throw new Error('No onboarding URL received');
      }
    } catch (error) {
      toast.error('Failed to start Stripe Connect setup. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      const result = await StripeService.createConnectDashboardLink();
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      toast.error('Failed to open Stripe dashboard.');
    }
  };

  return (
    <div className='space-y-6'>
      {/* Stripe Connect Section */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>
            Connect your Stripe account to receive payments for events, products, and services
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {stripeLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-6 w-6 animate-spin mr-2' />
              <span>Checking Stripe Connect status...</span>
            </div>
          ) : hasStripeConnect ? (
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription className='flex items-center justify-between'>
                <span>Stripe Connect is set up and ready to receive payments</span>
                <div className='flex items-center gap-2'>
                  <Badge variant='default' className='bg-green-100 text-green-800'>
                    Connected
                  </Badge>
                  <Button variant='outline' size='sm' onClick={handleOpenStripeDashboard}>
                    <ExternalLink className='w-3 h-3 mr-1' />
                    Dashboard
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium'>Stripe Connect Required</p>
                    <p className='text-sm text-muted-foreground mt-1'>
                      Set up Stripe Connect to create events, sell products, and receive payments
                    </p>
                  </div>
                  <Button
                    onClick={handleSetupStripeConnect}
                    disabled={setupLoading}
                    className='ml-4'
                  >
                    {setupLoading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <ExternalLink className='mr-2 h-4 w-4' />
                        Set Up Stripe Connect
                      </>
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Section */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods and preferences</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-4'>
            <h3 className='text-lg font-medium'>Saved Payment Methods</h3>
            {paymentMethods.length > 0 ? (
              <div className='space-y-2'>
                {paymentMethods.map(method => (
                  <div
                    key={method.id}
                    className='rounded-md border p-4 flex justify-between items-center'
                  >
                    <div className='flex items-center'>
                      <div className='bg-slate-100 p-2 rounded-md mr-4'>
                        <CreditCard className='h-5 w-5' />
                      </div>
                      <div>
                        <p className='font-medium'>
                          {method.type.charAt(0).toUpperCase() + method.type.slice(1)} ending in{' '}
                          {method.last4}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          Expires {method.expMonth}/{method.expYear}
                        </p>
                      </div>
                    </div>
                    {method.isDefault && <Badge>Default</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <div className='rounded-md border border-dashed p-6 text-center'>
                <p className='text-muted-foreground'>No payment methods added yet</p>
              </div>
            )}

            <Button variant='outline' className='w-full sm:w-auto'>
              <CreditCard className='mr-2 h-4 w-4' />
              Add Payment Method
            </Button>
          </div>

          <div className='space-y-4 border-t pt-6'>
            <h3 className='text-lg font-medium'>Wallet Preferences</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='show-balance'>Show Wallet Balance</Label>
                  <p className='text-sm text-muted-foreground'>
                    Display your wallet balance in the app
                  </p>
                </div>
                <Switch
                  id='show-balance'
                  checked={Boolean(wallet.showBalance)}
                  onCheckedChange={checked =>
                    onWalletChange({
          ...wallet,
                      showBalance: checked,
                    })
                  }
                />
              </div>

              <div className='space-y-2'>
                <h4 className='text-sm font-medium'>Notifications</h4>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='notif-transactions'>Transaction Alerts</Label>
                    <p className='text-sm text-muted-foreground'>
                      Get notified for successful or failed transactions
                    </p>
                  </div>
                  <Switch
                    id='notif-transactions'
                    checked={Boolean(wallet.notifications?.transactions)}
                    onCheckedChange={checked =>
                      onWalletChange({
          ...wallet,
                        notifications: { ...wallet.notifications, transactions: checked },
                      })
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='notif-low-balance'>Low Balance</Label>
                    <p className='text-sm text-muted-foreground'>
                      Warn me when wallet balance is low
                    </p>
                  </div>
                  <Switch
                    id='notif-low-balance'
                    checked={Boolean(wallet.notifications?.lowBalance)}
                    onCheckedChange={checked =>
                      onWalletChange({
          ...wallet,
                        notifications: { ...wallet.notifications, lowBalance: checked },
                      })
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='notif-weekly'>Weekly Summary</Label>
                    <p className='text-sm text-muted-foreground'>
                      Receive a weekly wallet activity summary
                    </p>
                  </div>
                  <Switch
                    id='notif-weekly'
                    checked={Boolean(wallet.notifications?.weeklySummary)}
                    onCheckedChange={checked =>
                      onWalletChange({
          ...wallet,
                        notifications: { ...wallet.notifications, weeklySummary: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onSaveWallet} disabled={loading}>
            {loading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentMethods;
