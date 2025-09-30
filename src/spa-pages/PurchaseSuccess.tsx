import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Receipt, Download } from 'lucide-react';
import { safeToast } from '@/services/api/utils/safeToast';
import { trackEvent } from '@/services/analyticsService';
import { usePurchaseVerification } from '@/hooks/usePurchaseVerification';
import { OrderFulfillmentBadge } from '@/components/order/OrderFulfillmentBadge';
import type { FulfillmentStatus } from '@/lib/types/order';
import { receiptService } from '@/services/receiptService';
// Route protection is handled at router level; no RouteWrapper needed

const PurchaseSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const amount = searchParams.get('amount');
  const { orderDetails } = usePurchaseVerification(sessionId, null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  const fulfillment =
    (orderDetails as unknown as {
      fulfillment_status?: FulfillmentStatus | null;
      tracking_number?: string | null;
      carrier?: string | null;
      tracking_url?: string | null;
      fulfillment_error?: string | null;
    }) || {};

  const tooltip = (() => {
    if (!fulfillment.fulfillment_status) return undefined;
    if (fulfillment.fulfillment_status === 'shipped') {
      const lines = [
        fulfillment.carrier ? `Carrier: ${fulfillment.carrier}` : undefined,
        fulfillment.tracking_number ? `Tracking #: ${fulfillment.tracking_number}` : undefined,
        fulfillment.tracking_url ? `Tracking ...(${fulfillment.tracking_url}` : undefined,
      ].filter(Boolean);
      return lines.length > 0 ? lines.join('\n') : undefined;
    }
    if (fulfillment.fulfillment_status === 'submission_failed') {
      return fulfillment.fulfillment_error || 'Submission failed. Please contact support.';
    }
    return undefined;
  })();

  const handleDownloadReceipt = async () => {
    if (!orderId) {
      safeToast.error('Order ID not found. Cannot generate receipt.');
      return;
    }

    try {
      setIsDownloadingReceipt(true);

      // Get or create receipt for this order
      const receipt = await receiptService.getOrCreateReceipt(orderId);

      // Download the receipt
      const { downloadUrl } = await receiptService.downloadReceipt(receipt.id);

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `receipt-${receipt.receiptNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      safeToast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      safeToast.error('Failed to download receipt. Please try again.');
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  useEffect(() => {
    safeToast.success('Purchase completed successfully!');
    try {
      const label = JSON.stringify({
        session_id: sessionId,
        transaction_id: transactionId,
        amount,
      });
      trackEvent('checkout', 'paid', label, 1);
    } catch (_) {
      /* non-blocking */
    }
  }, []);

  return (
    <>
      <div className='flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
              <CheckCircle className='w-8 h-8 text-black' />
            </div>
            <div className='flex items-center justify-center gap-2'>
              <CardTitle className='text-2xl text-black'>Purchase Successful!</CardTitle>
              {(orderDetails as unknown as { fulfillment_status?: FulfillmentStatus | null })
                ?.fulfillment_status && (
                <OrderFulfillmentBadge
                  status={
                    (orderDetails as unknown as { fulfillment_status: FulfillmentStatus })
                      .fulfillment_status
                  }
                  tooltip={tooltip}
                />
              )}
            </div>
          </CardHeader>

          <CardContent className='space-y-6'>
            <div className='text-center'>
              <p className='text-muted-foreground mb-4'>
                Your purchase has been completed successfully.
              </p>

              {transactionId && (
                <div className='bg-muted p-3 rounded-md mb-4'>
                  <p className='text-sm font-mono'>Transaction ID: {transactionId}</p>
                </div>
              )}

              {amount && <p className='text-lg font-semibold'>Amount: ${amount}</p>}
            </div>

            <div className='space-y-3'>
              <Button
                onClick={handleDownloadReceipt}
                variant='outline'
                className='w-full'
                disabled={isDownloadingReceipt || !orderId}
              >
                {isDownloadingReceipt ? (
                  <>
                    <Download className='w-4 h-4 mr-2 animate-spin' />
                    Generating Receipt...
                  </>
                ) : (
                  <>
                    <Receipt className='w-4 h-4 mr-2' />
                    Download Receipt
                  </>
                )}
              </Button>

              <Button onClick={() => navigate('/')} className='w-full'>
                <Home className='w-4 h-4 mr-2' />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PurchaseSuccess;
