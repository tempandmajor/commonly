import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PRO_SUBSCRIPTION_NAME } from '@/services/subscriptionService';

const ProFAQ = () => {
  return (
    <section className='py-16 bg-secondary/30'>
      <div className='container px-4'>
        <h2 className='text-3xl font-bold text-center mb-12'>Frequently Asked Questions</h2>

        <div className='max-w-3xl mx-auto space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Can I cancel my subscription anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Yes, you can cancel your {PRO_SUBSCRIPTION_NAME} subscription at any time. Your
                benefits will remain active until the end of your current billing period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How is the recording quality compared to free accounts?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Free accounts can record in standard quality (720p for video, 128kbps for audio).
                Pro accounts unlock HD (1080p) and Ultra HD (4K) video recording, plus higher audio
                quality at up to 320kbps.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Can I invite guests to my podcast?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Yes, with {PRO_SUBSCRIPTION_NAME}, you can invite multiple guests to join your
                podcast recordings. They don't need to be Pro subscribers to join as guests.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Will my existing free recordings be upgraded?</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Existing recordings won't be upgraded in quality, but all new recordings made after
                upgrading to Pro will be available in your selected quality up to 4K.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProFAQ;
