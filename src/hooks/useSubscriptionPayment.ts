import { useState } from 'react';
import { toast } from 'sonner';
import { checkout } from '@/services/payment';
import { useNavigate } from 'react-router-dom';

interface UseSubscriptionPaymentProps {
  price: number;
  productId?: string | undefined;
  customerEmail?: string | undefined;
  onSuccess?: () => void | undefined;
  onError?: (error: Error) => void | undefined;
}

export const useSubscriptionPayment = ({
  price,
  productId,
  customerEmail,
  onSuccess,
  onError,
}: UseSubscriptionPaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);

      const result = await checkout(
        {
          amount: price,
          currency: 'usd',
          paymentType: 'subscription',
          description: `Monthly Subscription`,
          productId, // This is now allowed through our updated types
          metadata: {
            type: 'subscription',
          },
          customerId: customerEmail || 'guest',
          status: 'pending',
        },
        navigate
      );

      if (result.success) {
        onSuccess?.();
      } else {
        throw new Error('Payment processing failed');
      }
    } catch (error) {
      toast.error('Failed to process payment. Please try again.');
      onError?.(error instanceof Error ? error : new Error('Checkout failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    handleCheckout,
  };
};
