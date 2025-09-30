import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { Button } from '@/components/ui/button';
import { PlusCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentsTabContentProps {
  returnTo?: string | undefined| null;
}

const PaymentsTabContent = ({ returnTo }: PaymentsTabContentProps) => {
  const { settings, isLoading, updatePaymentPreference } = usePaymentSettings();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-[200px] w-full' />
        <Skeleton className='h-[150px] w-full' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Auto-Pay</CardTitle>
          <CardDescription>
            Configure how you want to pay for events and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Switch
              id='auto-pay'
              checked={settings.paymentPreferences?.autoRecharge || false}
              onCheckedChange={checked => updatePaymentPreference('autoRecharge', checked)}
            />
            <Label htmlFor='auto-pay'>
              Automatically use platform credit for purchases when available
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods for purchases</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button variant='outline' className='w-full justify-start'>
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Payment Method
          </Button>

          {settings.paymentPreferences?.defaultMethod && (
            <div className='p-4 border rounded-md mt-4'>
              <div className='flex items-center'>
                <CreditCard className='mr-2 h-4 w-4' />
                <div>
                  <p className='font-medium'>Card ending in 1234</p>
                  <p className='text-sm text-muted-foreground'>Default payment method</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentsTabContent;
