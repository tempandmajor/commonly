import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { checkout } from '@/services/payment/checkoutService';
import { useAuth } from '@/providers/AuthProvider';

interface SubscriptionPaymentFormProps {
  price: number;
  productId?: string | undefined;
  customerEmail?: string | undefined;
  onSuccess?: () => void | undefined;
  onError?: (error: Error) => void | undefined;
}

export const SubscriptionPaymentForm = ({
  price,
  productId,
  customerEmail,
  onSuccess,
  onError,
}: SubscriptionPaymentFormProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);

      const result = await checkout({
        amount: price,
        currency: 'usd',
        paymentType: 'subscription', // Added required paymentType
        description: `Monthly Subscription`,
        productId,
        customerEmail: customerEmail || user?.email,
        ...(user && { userId: user.id }),
        metadata: {
          type: 'subscription',
        },
      });

      if (result) {
        toast.success('Redirecting to checkout...');
        onSuccess?.();
      } else {
        throw new Error('Checkout failed');
      }
    } catch (error) {
      toast.error('Failed to process payment. Please try again.');
      onError?.(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='space-y-4 py-4'>
      <div className='rounded-lg border p-4 bg-secondary/30'>
        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>Amount:</span>
          <span className='font-semibold'>${price.toFixed(2)}/month</span>
        </div>
      </div>

      <Button onClick={handleCheckout} disabled={isProcessing} className='w-full'>
        <CreditCard className='mr-2 h-4 w-4' />
        {isProcessing ? 'Processing...' : `Pay $${price.toFixed(2)}`}
      </Button>
    </div>
  );
};
