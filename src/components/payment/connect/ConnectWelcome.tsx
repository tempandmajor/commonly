import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CreditCard, RefreshCw } from 'lucide-react';

interface ConnectWelcomeProps {
  creatingAccount: boolean;
  handleCreateAccount: () => void;
}

const ConnectWelcome = ({ creatingAccount, handleCreateAccount }: ConnectWelcomeProps) => {
  return (
    <Card>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl'>Connect with Stripe</CardTitle>
        <CardDescription>
          Set up a Stripe Connect account to receive payments directly from customers
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Start accepting payments</AlertTitle>
          <AlertDescription>
            Stripe Connect allows you to receive payments directly to your bank account. Our
            platform will handle the payment processing and take a small fee.
          </AlertDescription>
        </Alert>

        <div className='space-y-2'>
          <h3 className='font-medium'>Benefits of Stripe Connect:</h3>
          <ul className='ml-6 space-y-1 list-disc text-muted-foreground text-sm'>
            <li>Receive payments directly to your bank account</li>
            <li>Get paid faster with automatic transfers</li>
            <li>Access detailed financial reporting</li>
            <li>Manage your payouts and earnings</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleCreateAccount} disabled={creatingAccount} className='w-full'>
          {creatingAccount ? (
            <>
              <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
              Creating Account...
            </>
          ) : (
            <>
              <CreditCard className='mr-2 h-4 w-4' />
              Connect with Stripe
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConnectWelcome;
