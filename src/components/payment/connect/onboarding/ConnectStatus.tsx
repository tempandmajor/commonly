import { Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectStatusProps {
  accountId: string;
  created: Date | null;
  needsAction: boolean;
  isEnabled: boolean;
  onCompleteOnboarding: () => void;
  onReturn?: () => void | undefined;
  returnTo?: string | undefined;
}

const ConnectStatus = ({
  accountId,
  created,
  needsAction,
  isEnabled,
  onCompleteOnboarding,
  onReturn,
  returnTo,
}: ConnectStatusProps) => {
  return (
    <div className='space-y-4'>
      <div className='bg-muted p-4 rounded-md'>
        <div className='flex items-center gap-2'>
          <span className='font-medium'>Stripe Account ID:</span>
          <code className='bg-background text-foreground px-2 py-1 rounded text-sm'>
            {accountId}
          </code>
        </div>

        {created && (
          <div className='text-sm text-muted-foreground mt-2'>
            Connected on: {created.toLocaleDateString()}
          </div>
        )}
      </div>

      {needsAction && (
        <div className='bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-800'>
          <h4 className='font-medium mb-1'>Action Required</h4>
          <p className='text-sm mb-3'>
            Please complete your Stripe account setup to start receiving payments.
          </p>
          <Button
            variant='outline'
            className='bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-900 flex items-center gap-2'
            onClick={onCompleteOnboarding}
          >
            Complete Onboarding
            <ExternalLink className='h-4 w-4' />
          </Button>
        </div>
      )}

      {isEnabled && (
        <div className='bg-green-50 border border-green-200 p-4 rounded-md text-green-800'>
          <div className='flex items-center gap-2'>
            <Check className='h-5 w-5 text-green-600' />
            <span className='font-medium'>
              Your account is fully set up and ready to receive payments
            </span>
          </div>
          {returnTo && (
            <div className='mt-3'>
              <Button
                variant='outline'
                className='bg-green-100 border-green-300 hover:bg-green-200 text-green-900'
                onClick={onReturn}
              >
                Continue to{' '}
                {returnTo === '/create-event'
                  ? 'Event Creation'
                  : decodeURIComponent(returnTo).split('/').pop()?.replace('-', ' ')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectStatus;
