import { CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ConnectStatus } from '@/components/payment/connect/types';

interface AccountStatusDisplayProps {
  accountStatus: ConnectStatus;
}

const AccountStatusDisplay = ({ accountStatus }: AccountStatusDisplayProps) => {
  return (
    <div className='space-y-4'>
      <div className='grid gap-2'>
        <div className='flex items-center justify-between py-2 border-b'>
          <span className='font-medium'>Account Details</span>
          <span>
            {accountStatus.details_submitted ? (
              <CheckCircle className='h-5 w-5 text-green-500' />
            ) : (
              <AlertCircle className='h-5 w-5 text-amber-500' />
            )}
          </span>
        </div>
        <div className='flex items-center justify-between py-2 border-b'>
          <span className='font-medium'>Payment Processing</span>
          <span>
            {accountStatus.charges_enabled ? (
              <CheckCircle className='h-5 w-5 text-green-500' />
            ) : (
              <AlertCircle className='h-5 w-5 text-amber-500' />
            )}
          </span>
        </div>
        <div className='flex items-center justify-between py-2 border-b'>
          <span className='font-medium'>Payouts</span>
          <span>
            {accountStatus.payouts_enabled ? (
              <CheckCircle className='h-5 w-5 text-green-500' />
            ) : (
              <AlertCircle className='h-5 w-5 text-amber-500' />
            )}
          </span>
        </div>
      </div>

      {!accountStatus.isEnabled && (
        <Alert className='bg-amber-50 border-amber-200'>
          <AlertCircle className='h-4 w-4 text-amber-600' />
          <AlertTitle className='text-amber-800'>Complete your setup</AlertTitle>
          <AlertDescription className='text-amber-700'>
            Your Stripe Connect account is not fully set up. Please complete the onboarding process
            to receive payments.
          </AlertDescription>
        </Alert>
      )}

      {accountStatus.isEnabled && (
        <Alert className='bg-green-50 border-green-200'>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <AlertTitle className='text-green-800'>Ready to receive payments</AlertTitle>
          <AlertDescription className='text-green-700'>
            Your Stripe Connect account is fully set up and ready to receive payments.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AccountStatusDisplay;
