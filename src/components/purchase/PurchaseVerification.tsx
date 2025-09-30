import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PurchaseVerificationProps {
  isVerifying: boolean;
}

export const PurchaseVerification = ({ isVerifying }: PurchaseVerificationProps) => {
  if (!isVerifying) return null;

  return (
    <Card>
      <CardHeader className='text-center pb-6'>
        <div className='flex flex-col items-center'>
          <LoadingSpinner className='h-12 w-12 mb-4' />
          <CardTitle>Verifying purchase...</CardTitle>
          <CardDescription>Please wait while we confirm your purchase details</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
};
