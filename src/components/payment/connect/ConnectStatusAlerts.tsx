import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectStatusAlertsProps {
  connectError: string | null;
  hasStripeAccount: boolean | null;
  handleConnectStripe: () => void;
  isConnectingStripe: boolean;
}

const ConnectStatusAlerts = ({
  connectError,
  hasStripeAccount,
  handleConnectStripe,
  isConnectingStripe,
}: ConnectStatusAlertsProps) => {
  return (
    <>
      {/* Connection Error Alert */}
      {connectError && (
        <Alert className='mb-6 bg-destructive/10 border-destructive/40'>
          <AlertTriangle className='h-4 w-4 text-destructive' />
          <AlertTitle className='text-destructive'>Connection Error</AlertTitle>
          <AlertDescription className='text-destructive/80'>{connectError}</AlertDescription>
        </Alert>
      )}

      {/* Stripe Account Requirement */}
      {hasStripeAccount === false && (
        <Alert className='mb-6 bg-yellow-50 border-yellow-200'>
          <AlertTriangle className='h-4 w-4 text-yellow-600' />
          <AlertTitle className='text-yellow-800'>Stripe Connection Required</AlertTitle>
          <AlertDescription className='text-yellow-700'>
            You need to connect a Stripe account before creating an event. This allows you to
            receive payments from backers.
            <Button
              variant='outline'
              className='mt-3 bg-yellow-100 border-yellow-300 hover:bg-yellow-200'
              onClick={handleConnectStripe}
              disabled={isConnectingStripe}
            >
              {isConnectingStripe ? 'Connecting...' : 'Connect Stripe'}
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default ConnectStatusAlerts;
