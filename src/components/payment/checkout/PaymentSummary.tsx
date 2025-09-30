import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CheckoutData {
  amount: number;
  type: 'ticket' | 'subscription' | 'product';
  description?: string | undefined;
  eventId?: string | undefined;
  productId?: string | undefined;
}

interface PaymentSummaryProps {
  checkoutData: CheckoutData;
}

const PaymentSummary = ({ checkoutData }: PaymentSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Order Summary</span>
          <Badge variant='secondary'>{checkoutData.type}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {checkoutData.description && (
            <p className='text-sm text-muted-foreground'>{checkoutData.description}</p>
          )}
          <div className='flex justify-between items-center text-lg font-semibold'>
            <span>Total:</span>
            <span>${checkoutData.amount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSummary;
