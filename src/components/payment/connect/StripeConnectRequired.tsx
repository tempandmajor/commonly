import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StripeConnectRequiredProps {
  type: 'event' | 'venue' | 'caterer' | 'community' | 'store';
  isLoading?: boolean | undefined;
  returnPath?: string | undefined;
}

const StripeConnectRequired = ({
  type,
  isLoading = false,
  returnPath,
}: StripeConnectRequiredProps) => {
  const navigate = useNavigate();

  const typeText = {
    event: 'create an event',
    venue: 'add a venue location',
    caterer: 'complete your caterer profile',
    community: 'create a community',
    store: 'create a store',
  };

  const typeExplanation = {
    event: 'Events require payment processing for ticket sales and attendee management.',
    venue: 'Venue listings need payment capabilities for booking deposits and fees.',
    caterer: 'Catering services require secure payment processing for client bookings.',
    community: 'Communities need payment processing for memberships and premium features.',
    store: 'Stores require payment processing to sell products and manage transactions.',
  };

  const handleSetupStripeConnect = () => {
    // Add return path to the URL if provided
    const returnUrl = returnPath
      ? `?tab=payments&returnTo=${encodeURIComponent(returnPath)}`
      : '?tab=payments';
    navigate(`/settings${returnUrl}`);
  };

  if (isLoading) {
    return (
      <Alert className='mb-6 bg-blue-50 border-blue-200'>
        <AlertCircle className='h-4 w-4 text-blue-600' />
        <AlertTitle className='text-blue-800'>Checking payment setup...</AlertTitle>
        <AlertDescription className='text-blue-700'>
          Please wait while we check your payment configuration.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='max-w-2xl mx-auto'>
      <Alert className='mb-6 bg-amber-50 border-amber-200'>
        <AlertCircle className='h-4 w-4 text-amber-600' />
        <AlertTitle className='text-amber-800 text-lg'>Stripe Connect Setup Required</AlertTitle>
        <AlertDescription className='text-amber-700 space-y-4'>
          <div>
            <p className='mb-2'>
              You need to set up Stripe Connect before you can {typeText[type]}.
            </p>
            <p className='text-sm'>{typeExplanation[type]}</p>
          </div>

          <div className='bg-white/50 p-4 rounded-md border border-amber-200'>
            <h4 className='font-semibold text-amber-800 mb-2'>What happens next:</h4>
            <ol className='text-sm space-y-1 list-decimal list-inside'>
              <li>Click the button below to go to Settings</li>
              <li>Complete your Stripe Connect setup (takes 2-3 minutes)</li>
              <li>Return here to continue creating your {type}</li>
            </ol>
          </div>

          <Button
            variant='default'
            className='bg-amber-600 hover:bg-amber-700 text-white'
            onClick={handleSetupStripeConnect}
          >
            <CreditCard className='mr-2 h-4 w-4' />
            Set Up Stripe Connect
            <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default StripeConnectRequired;
