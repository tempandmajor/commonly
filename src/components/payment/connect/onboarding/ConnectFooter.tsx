import { CardFooter } from '@/components/ui/card';

const ConnectFooter = () => {
  return (
    <CardFooter className='border-t pt-4 text-xs text-muted-foreground'>
      <p>
        By connecting a Stripe account, you agree to Stripe's{' '}
        <a
          href='https://stripe.com/terms'
          target='_blank'
          rel='noopener noreferrer'
          className='underline hover:text-foreground'
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          href='https://stripe.com/privacy'
          target='_blank'
          rel='noopener noreferrer'
          className='underline hover:text-foreground'
        >
          Privacy Policy
        </a>
        .
      </p>
    </CardFooter>
  );
};

export default ConnectFooter;
