import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink } from 'lucide-react';

interface ConnectAccountFooterProps {
  isEnabled: boolean;
  generatingLink: boolean;
  handleDashboard: () => void;
  handleOnboard: () => void;
  refreshStatus: () => void;
}

const ConnectAccountFooter = ({
  isEnabled,
  generatingLink,
  handleDashboard,
  handleOnboard,
  refreshStatus,
}: ConnectAccountFooterProps) => {
  return (
    <div className='flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2'>
      <Button
        variant={isEnabled ? 'default' : 'outline'}
        disabled={generatingLink}
        onClick={isEnabled ? handleDashboard : handleOnboard}
        className='w-full'
      >
        {generatingLink ? (
          <>
            <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
            {isEnabled ? 'Accessing Dashboard...' : 'Generating Link...'}
          </>
        ) : (
          <>
            <ExternalLink className='mr-2 h-4 w-4' />
            {isEnabled ? 'Access Stripe Dashboard' : 'Complete Onboarding'}
          </>
        )}
      </Button>

      <Button variant='outline' onClick={refreshStatus} className='w-full sm:w-auto'>
        <RefreshCw className='mr-2 h-4 w-4' />
        Refresh Status
      </Button>
    </div>
  );
};

export default ConnectAccountFooter;
