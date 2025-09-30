import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RefreshRedirect = () => {
  return (
    <Card className='mx-auto max-w-2xl'>
      <CardHeader className='text-center'>
        <div className='flex justify-center mb-6'>
          <div className='h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center'>
            <Loader2 className='h-10 w-10 text-black animate-spin' />
          </div>
        </div>
        <CardTitle className='text-2xl font-bold'>Refreshing Your Onboarding Process</CardTitle>
        <CardDescription>
          Please wait while we redirect you to continue your Stripe Connect setup...
        </CardDescription>
      </CardHeader>
      <CardContent className='text-center'>
        <p className='text-muted-foreground'>
          You'll be redirected automatically. If nothing happens, check your pop-up blocker or
          browser settings.
        </p>
        <div className='flex justify-center mt-6'>
          <div className='h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin'></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RefreshRedirect;
