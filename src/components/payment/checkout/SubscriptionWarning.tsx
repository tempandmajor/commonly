import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface SubscriptionWarningProps {
  paymentType?: string | undefined;
}

const SubscriptionWarning = ({ paymentType }: SubscriptionWarningProps) => {
  return (
    <Card className='border-orange-200 bg-orange-50'>
      <CardContent className='p-4'>
        <div className='flex items-center gap-2'>
          <AlertTriangle className='h-4 w-4 text-orange-600' />
          <span className='font-medium text-orange-900'>Subscription Notice</span>
        </div>
        <p className='text-sm text-orange-800 mt-1'>
          You already have an active subscription. This purchase will modify your current
          subscription.
        </p>
      </CardContent>
    </Card>
  );
};

export default SubscriptionWarning;
