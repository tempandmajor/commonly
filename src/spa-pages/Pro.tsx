import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/providers/AuthProvider';
import {
  subscribeToPro,
  PRO_SUBSCRIPTION_PRICE,
  PRO_SUBSCRIPTION_NAME,
} from '@/services/subscriptionService';
import { usePageTracking } from '@/hooks/usePageTracking';
import { trackEvent } from '@/services/analyticsService';
import ProFeatures from '@/components/pro/ProFeatures';
import ProPricing from '@/components/pro/ProPricing';
import ProFAQ from '@/components/pro/ProFAQ';

const Pro = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const location = useLocation();
  usePageTracking(location.pathname, 'Pro Subscription');

  // For now, assume users are not pro until we have the proper subscription system
  const isPro = false;

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please log in to subscribe');
      navigate('/login', { state: { from: { pathname: '/pro' } } });
      return;
    }

    try {
      setIsProcessing(true);

      // Track subscription attempt
      trackEvent('subscription', 'attempt_subscribe', PRO_SUBSCRIPTION_NAME);

      const success = await subscribeToPro({
        amount: PRO_SUBSCRIPTION_PRICE,
        description: `${PRO_SUBSCRIPTION_NAME} Subscription`,
        userId: user.id,
        customerEmail: user.email,
        tier: PRO_SUBSCRIPTION_NAME,
      });

      if (success) {
        // Track successful subscription redirection
        trackEvent(
          'subscription',
          'subscribe_redirect',
          PRO_SUBSCRIPTION_NAME,
          PRO_SUBSCRIPTION_PRICE
        );
      } else {
        throw new Error('Failed to initiate subscription');
      }
    } catch (error) {
      toast.error('Failed to process subscription. Please try again.');

      // Track failed subscription
      trackEvent('subscription', 'subscribe_error', PRO_SUBSCRIPTION_NAME);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col'>
      <SimpleHeader />

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='bg-gradient-to-b from-black to-gray-900 text-white py-20'>
          <div className='container px-4 text-center'>
            <h1 className='text-4xl md:text-5xl font-bold mb-6'>
              Upgrade to {PRO_SUBSCRIPTION_NAME}
            </h1>
            <p className='text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-300'>
              Unlock professional podcasting tools, HD and 4K recording, and more with our premium
              subscription.
            </p>

            {isPro ? (
              <Button size='lg' variant='outline' className='bg-white text-black hover:bg-gray-100'>
                You're a Pro Member!
              </Button>
            ) : (
              <Button
                size='lg'
                className='bg-white text-black hover:bg-gray-100'
                onClick={handleSubscribe}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Subscribe for $${PRO_SUBSCRIPTION_PRICE}/month`}
              </Button>
            )}
          </div>
        </section>

        <ProFeatures />
        <ProPricing isPro={isPro} isProcessing={isProcessing} onSubscribe={handleSubscribe} />
        <ProFAQ />
      </main>

      <Footer />
    </div>
  );
};

export default Pro;
