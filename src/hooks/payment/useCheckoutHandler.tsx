import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { checkout } from '@/services/payment/checkoutService';
import type { PaymentType } from '@/services/payment/types';

interface UseCheckoutHandlerProps {
  amount: number;
  currency: string;
  paymentType: PaymentType;
  title: string;
  isPlatformFee: boolean;
  metadata?: Record<string, string> | undefined;
  usePlatformCredit: boolean;
  canUseCredit: boolean;
  onSuccess?: () => void | undefined;
  onError?: (error: Error) => void | undefined;
  isAllOrNothing?: boolean | undefined;
  eventId?: string | undefined;
  pledgeDeadline?: string | undefined;
  availableTickets?: number | undefined;
}

export const useCheckoutHandler = ({
  amount,
  currency,
  paymentType,
  title,
  isPlatformFee,
  metadata,
  usePlatformCredit,
  canUseCredit,
  onSuccess,
  onError,
  isAllOrNothing = false,
  eventId,
  pledgeDeadline,
  availableTickets,
}: UseCheckoutHandlerProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (isProcessing) return;
    if (!user && isPlatformFee) {
      toast.error('You must be logged in to complete this action');
      return;
    }

    try {
      setIsProcessing(true);

      // Handle platform credit or proceed with checkout
      const shouldUsePlatformCredit = isPlatformFee && canUseCredit && usePlatformCredit;

      // Enhanced metadata with proper type checks
      const enhancedMetadata: Record<string, string> = {
          ...metadata,
        paymentType,
        title,
      };

      if (availableTickets !== undefined) {
        enhancedMetadata.availableTickets = String(availableTickets) as string;
      }

      if (eventId) {
        enhancedMetadata.eventId = eventId;
      }

      if (pledgeDeadline) {
        enhancedMetadata.pledgeDeadline = pledgeDeadline;
      }

      const result = await checkout(
        {
          amount,
          currency,
          paymentType,
          description: title,
          ...(user && {
            userId: user.id,
            isPlatformFee,
            metadata: enhancedMetadata,
            usePlatformCredit: shouldUsePlatformCredit,
            isAllOrNothing,
            eventId,
            title,
            availableTickets,
          }),
        },
        navigate
      );

      if (result.success) {
        // Note: We might not reach this code if the user is redirected
        onSuccess?.();
        return true;
      } else {
        const error = new Error('Payment failed');
        onError?.(error);
        return false;
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown payment error');
      onError?.(errorObj);
      toast.error(errorObj.message);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    handleCheckout,
  };
};
