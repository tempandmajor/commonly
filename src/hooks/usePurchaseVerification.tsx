import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { verifyOrder, getOrderBySessionId } from '@/services/orderVerification';
import { PurchaseVerificationResult, OrderDetails, PaymentDetails } from '@/lib/types/purchase';

export const usePurchaseVerification = (
  sessionId: string | null,
  orderId: string | null
): PurchaseVerificationResult => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    const verifyPurchase = async () => {
      if (!sessionId && !orderId) {
        setIsVerifying(false);
        return;
      }

      try {
        const result = await verifyOrder(sessionId || '');
        setVerificationSuccess(result.success);

        if (result.success) {
          toast.success('Purchase successfully verified!');

          const order = await getOrderBySessionId(sessionId || '');
          if (order) {
            const orderWithTotalAmount: OrderDetails = {
          ...order,
              totalAmount: order.totalPrice,
            };

            setOrderDetails(orderWithTotalAmount);

            if (order.productId) {
              // TODO: Implement getProductById from product service
              setProduct(null);
            }
          }
        } else {
          toast.error('Could not verify purchase: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        toast.error('Error verifying purchase');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPurchase();
  }, [sessionId, orderId]);

  return {
    isVerifying,
    verificationSuccess,
    orderDetails,
    product,
    paymentDetails,
    eventId,
  };
};
