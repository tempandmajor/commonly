import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { PRO_SUBSCRIPTION_PRICE, PRO_SUBSCRIPTION_NAME } from '@/services/subscriptionService';

interface ProPricingProps {
  isPro: boolean;
  isProcessing: boolean;
  onSubscribe: () => void;
}

const ProPricing = ({ isPro, isProcessing, onSubscribe }: ProPricingProps) => {
  return (
    <section className='py-16'>
      <div className='container px-4'>
        <div className='max-w-lg mx-auto'>
          <Card className='border-2 border-purple-400'>
            <CardHeader className='text-center'>
              <CardTitle className='text-2xl'>{PRO_SUBSCRIPTION_NAME}</CardTitle>
              <div className='mt-4'>
                <span className='text-4xl font-bold'>${PRO_SUBSCRIPTION_PRICE}</span>
                <span className='text-muted-foreground ml-1'>/month</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className='space-y-3'>
                <li className='flex'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2' />
                  <span>HD and 4K video recording</span>
                </li>
                <li className='flex'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2' />
                  <span>High-quality audio recording</span>
                </li>
                <li className='flex'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2' />
                  <span>Unlimited storage</span>
                </li>
                <li className='flex'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2' />
                  <span>Multi-guest recording</span>
                </li>
                <li className='flex'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2' />
                  <span>Premium analytics</span>
                </li>
                <li className='flex'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2' />
                  <span>Priority support</span>
                </li>
                <li className='flex'>
                  <CheckCircle2 className='h-5 w-5 text-green-500 mr-2' />
                  <span>Cancel anytime</span>
                </li>
              </ul>
            </CardContent>

            <CardFooter>
              {isPro ? (
                <Button className='w-full bg-gradient-to-r from-purple-600 to-indigo-600' disabled>
                  You're a Pro Member
                </Button>
              ) : (
                <Button
                  className='w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  onClick={onSubscribe}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Subscribe Now'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProPricing;
