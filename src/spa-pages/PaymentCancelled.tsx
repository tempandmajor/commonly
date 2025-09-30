import { ArrowLeft, HeartHandshake } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect } from 'react';
import { trackEvent } from '@/services/analyticsService';
// Route protection is handled at router level; no RouteWrapper needed

const PaymentCancelled = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event_id');
  const productId = searchParams.get('product_id');
  const isAllOrNothing = searchParams.get('is_all_or_nothing') === 'true';
  const sessionId = searchParams.get('session_id');
  const reason = searchParams.get('reason') || 'user_cancelled';

  useEffect(() => {
    try {
      const label = JSON.stringify({
        session_id: sessionId,
        event_id: eventId,
        product_id: productId,
        reason,
        is_all_or_nothing: isAllOrNothing,
      });
      trackEvent('checkout', 'failed', label, 1);
    } catch (_) {
      /* non-blocking */
    }
  }, [sessionId, eventId, productId, reason, isAllOrNothing]);

  return (
    <>
      <div className='container px-4 py-12 md:px-6'>
        <div className='mx-auto max-w-md'>
          <Card>
            <CardHeader className='text-center pb-6'>
              <div className='flex flex-col items-center'>
                <div className='h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4'>
                  {isAllOrNothing ? (
                    <HeartHandshake className='h-6 w-6 text-amber-600' />
                  ) : (
                    <ArrowLeft className='h-6 w-6 text-amber-600' />
                  )}
                </div>
                <CardTitle>{isAllOrNothing ? 'Pledge Cancelled' : 'Payment Cancelled'}</CardTitle>
                <CardDescription className='mt-2'>
                  {isAllOrNothing
                    ? 'Your pledge was cancelled and you have not been charged.'
                    : 'Your payment was cancelled and you have not been charged.'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className='pb-6'>
              <p className='text-center text-muted-foreground'>
                {isAllOrNothing
                  ? 'If you would like to support this event, you can try pledging again. Your pledge will only be charged if the funding goal is met.'
                  : 'If you encountered any issues during checkout, please feel free to try again or contact our support team for assistance.'}
              </p>

              {isAllOrNothing && eventId && (
                <div className='mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4'>
                  <p className='text-sm text-amber-700'>
                    Remember: All-or-nothing events only charge supporters if the funding goal is
                    reached by the campaign deadline. Your support helps bring this event to life!
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <div className='w-full space-y-2'>
                <Button asChild className='w-full'>
                  <Link to='/'>Return to Home</Link>
                </Button>

                {productId && (
                  <Button variant='outline' asChild className='w-full'>
                    <Link to={`/products/${productId}`}>Back to Product</Link>
                  </Button>
                )}

                {eventId && (
                  <Button
                    variant='outline'
                    asChild
                    className={`w-full ${isAllOrNothing ? 'border-green-200 text-green-700 hover:bg-green-50' : ''}`}
                  >
                    <Link to={`/events/${eventId}`}>
                      {isAllOrNothing ? 'Back to Event' : 'Back to Event'}
                    </Link>
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PaymentCancelled;
