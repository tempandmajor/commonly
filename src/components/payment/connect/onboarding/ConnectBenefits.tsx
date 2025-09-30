import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';

interface ConnectBenefitsProps {
  onConnect: () => void;
  connecting: boolean;
}

const ConnectBenefits = ({ onConnect, connecting }: ConnectBenefitsProps) => {
  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <h4 className='font-medium'>Benefits of Stripe Connect</h4>
        <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
          <li>Receive payments directly to your bank account</li>
          <li>Sell tickets for events and manage bookings</li>
          <li>Create subscription offerings for your followers</li>
          <li>Access detailed financial reporting</li>
        </ul>
      </div>

      <div>
        <Button onClick={onConnect} disabled={connecting} className='w-full sm:w-auto'>
          {connecting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Connecting...
            </>
          ) : (
            <>
              Connect with Stripe
              <ExternalLink className='ml-2 h-4 w-4' />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConnectBenefits;
