import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

const PaymentMethodsTab: React.FC = () => {
  const { paymentMethods, loading, error, isProcessing, addCard, removeMethod, setDefaultMethod } =
    useWallet();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Loading your payment methods...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription className='text-red-600'>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Manage your payment methods for wallet transactions</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Button onClick={addCard} disabled={isProcessing} className='w-full'>
          <Plus className='mr-2 h-4 w-4' />
          Add New Payment Method
        </Button>

        {paymentMethods.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>No payment methods added yet</div>
        ) : (
          <div className='space-y-3'>
            {paymentMethods.map(method => (
              <div
                key={method.id}
                className='flex items-center justify-between p-4 border rounded-lg'
              >
                <div className='flex items-center space-x-3'>
                  <CreditCard className='h-5 w-5' />
                  <div>
                    <p className='font-medium'>
                      {method.card?.brand?.toUpperCase()} ****{method.card?.last4}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Expires {method.card?.exp_month}/{method.card?.exp_year}
                    </p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <Badge variant='outline'>Active</Badge>
                  <Button variant='outline' size='sm' onClick={() => setDefaultMethod(method.id)}>
                    Set Default
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => removeMethod(method.id)}
                    disabled={isProcessing}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsTab;
