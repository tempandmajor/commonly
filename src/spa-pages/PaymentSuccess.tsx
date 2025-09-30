import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Receipt } from 'lucide-react';
import { safeToast } from '@/services/api/utils/safeToast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { trackEvent } from '@/services/analyticsService';
import { usePurchaseVerification } from '@/hooks/usePurchaseVerification';
import { OrderFulfillmentBadge } from '@/components/order/OrderFulfillmentBadge';
import type { FulfillmentStatus } from '@/lib/types/order';
// Route protection is handled at router level; no RouteWrapper needed

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { track } = useAnalytics('/payment/success', 'Payment Success');
  const sessionId = searchParams.get('session_id');
  const eventId = searchParams.get('event_id');
  const productId = searchParams.get('product_id');
  const { orderDetails } = usePurchaseVerification(sessionId, null);

  useEffect(() => {
    // Show success message when component mounts
    safeToast.success('Payment successful! Thank you for your purchase.');

    // Track the successful payment
    track('payment_success', {
      session_id: sessionId,
      event_id: eventId,
      product_id: productId,
      purchase_type: eventId ? 'event' : productId ? 'product' : 'unknown',
    });

    // Also send global funnel event
    try {
      const label = JSON.stringify({
        session_id: sessionId,
        event_id: eventId,
        product_id: productId,
      });
      trackEvent('checkout', 'paid', label, 1);
    } catch (_) {
      /* non-blocking */
    }
  }, [sessionId, eventId, productId, track]);

  const handleViewEvent = () => {
    if (eventId) {
      navigate(`/events/${eventId}`);
    } else {
      navigate('/events');
    }
  };

  const handleViewProduct = () => {
    if (productId) {
      navigate(`/products/${productId}`);
    } else {
      navigate('/products');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleDownloadReceipt = async () => {
    try {
      // Generate receipt data
      const receiptData = {
        sessionId: sessionId || 'N/A',
        eventId: eventId || null,
        productId: productId || null,
        date: new Date().toISOString(),
        purchaseType: eventId ? 'Event Ticket' : productId ? 'Product' : 'Purchase',
      };

      // Create a simple receipt text
      const receiptText = `
PURCHASE RECEIPT
================
Date: ${new Date().toLocaleDateString()}
Session ID: ${receiptData.sessionId}
Type: ${receiptData.purchaseType}
${eventId ? `Event ID: ${eventId}` : ''}
${productId ? `Product ID: ${productId}` : ''}

Thank you for your purchase!
      `.trim();

      // Create and download the receipt file
      const blob = new Blob([receiptText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${sessionId || Date.now()}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);

      safeToast.success('Receipt downloaded successfully!');
      track('receipt_download', { session_id: sessionId });
    } catch (error) {
      safeToast.error('Failed to download receipt. Please contact support.');
    }
  };

  const isEventPurchase = !!eventId;
  const isProductPurchase = !!productId;

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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
              {fulfillment.fulfillment_status && (
                <OrderFulfillmentBadge status={fulfillment.fulfillment_status} tooltip={tooltip} />
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Your payment has been processed successfully.
                {isEventPurchase && " You're all set for the event!"}
                {isProductPurchase && ' Your product purchase is confirmed.'}
              </p>

              {sessionId && (
                <div className="bg-muted p-3 rounded-lg border">
                  <p className="text-sm font-mono text-foreground">Transaction ID: {sessionId.slice(-8)}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {isEventPurchase && (
                <Button onClick={handleViewEvent} className="w-full" size="lg">
                  View Event Details
                </Button>
              )}

              {isProductPurchase && (
                <Button onClick={handleViewProduct} className="w-full" size="lg">
                  View Product
                </Button>
              )}

              <Button
                onClick={handleDownloadReceipt}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>

              <Button onClick={handleGoHome} variant="ghost" className="w-full" size="lg">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Need help?{' '}
                <a href="/contact" className="text-primary hover:underline font-medium">
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PaymentSuccess;
