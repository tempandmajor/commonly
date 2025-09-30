import React, { useState, useEffect } from 'react';
import { useConnect } from '@/hooks/useConnect';
import { useAuth } from '@/providers/AuthProvider';
import {
  Store,
  AlertTriangle,
  CheckCircle,
  Package as PackageIcon,
  ShoppingBag as ShoppingBagIcon,
  Loader2,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MerchantActivationProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: () => void;
}

const MerchantActivation = ({ isOpen, onClose, onActivate }: MerchantActivationProps) => {
  const { user } = useAuth();
  const { hasStripeConnect, isLoading, checkStripeConnectAccount } = useConnect();

  useEffect(() => {
    if (isOpen && user) {
      checkStripeConnectAccount(user.id);
    }
  }, [isOpen, user, checkStripeConnectAccount]);

  const benefits = [
    {
      title: 'Sell Physical Products',
      description: 'Create and sell physical products to your audience',
      icon: PackageIcon,
    },
    {
      title: 'Print on Demand',
      description: 'Connect with Printful or Printify for print-on-demand products',
      icon: ShoppingBagIcon,
    },
    {
      title: 'Custom Store Page',
      description: 'Personalize your store with your branding and style',
      icon: Store,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center text-2xl'>
            <Store className='mr-2 h-5 w-5 text-amber-500' />
            Activate Your Merchant Store
          </DialogTitle>
          <DialogDescription>
            You've reached 1,000+ followers! You're now eligible to create your own merchant store.
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <div className='flex items-center justify-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-amber-100'>
              <Store className='h-10 w-10 text-amber-600' />
            </div>
          </div>

          <div className='mt-6 space-y-4'>
            <h3 className='text-lg font-medium'>As a merchant, you can:</h3>

            <div className='space-y-3'>
              {benefits.map((benefit, index) => (
                <div key={index} className='flex items-start rounded-lg border p-3'>
                  <benefit.icon className='mr-3 h-5 w-5 text-amber-500' />
                  <div>
                    <h4 className='font-medium'>{benefit.title}</h4>
                    <p className='text-sm text-muted-foreground'>{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className='rounded-lg bg-blue-50 p-4 text-blue-800 flex items-center'>
                <Loader2 className='mr-2 h-5 w-5 animate-spin text-blue-600' />
                <p>Checking your Stripe Connect status...</p>
              </div>
            ) : !hasStripeConnect ? (
              <div className='rounded-lg bg-amber-50 p-4 text-amber-800'>
                <div className='flex items-start'>
                  <AlertCircle className='mr-3 h-5 w-5 text-amber-600' />
                  <div>
                    <p className='font-medium'>Stripe Connect Required</p>
                    <p className='text-sm mt-1'>
                      To activate your merchant store, you'll need to set up a Stripe Connect
                      account first. This enables you to receive payments directly from customers.
                    </p>
                    <Button
                      className='mt-3 bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                      variant='outline'
                      onClick={() => {
                        onClose();
                        window.location.href = '/settings?tab=payments';
                      }}
                    >
                      <CreditCard className='mr-2 h-4 w-4' />
                      Set Up Stripe Connect
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className='rounded-lg bg-green-50 p-3 text-green-800'>
                <div className='flex items-start'>
                  <CheckCircle className='mr-3 h-5 w-5 text-green-600' />
                  <p className='text-sm'>
                    <strong>Ready to activate your store!</strong> Your Stripe Connect account is
                    set up and ready for receiving payments.
                  </p>
                </div>
              </div>
            )}

            <div className='rounded-lg bg-blue-50 p-3 text-blue-800'>
              <div className='flex items-start'>
                <AlertCircle className='mr-3 h-5 w-5 text-blue-600' />
                <p className='text-sm'>
                  <strong>Note:</strong> You'll need to set up your payment methods and shipping
                  details after activation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='flex flex-col sm:flex-row'>
          <Button variant='outline' onClick={onClose} className='mb-2 sm:mb-0'>
            Cancel
          </Button>
          <Button onClick={onActivate} className='gap-2' disabled={isLoading || !hasStripeConnect}>
            <Store className='h-4 w-4' />
            Activate Store
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MerchantActivation;
