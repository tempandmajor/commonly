import React, { useState } from 'react';
import { User } from '@/lib/types/user';
import { Card, CardContent } from '@/components/ui/card';
import { Star, CalendarDays } from 'lucide-react';
import SubscriptionPricing from '../subscription/SubscriptionPricing';
import SubscriptionBenefits from '../subscription/SubscriptionBenefits';
import SubscriptionEventDetails from '../subscription/SubscriptionEventDetails';
import SubscriptionButton from '@/components/payment/SubscriptionButton';

interface SubscriptionTabProps {
  user: User;
  isOwnProfile: boolean;
  isSubscribed: boolean;
  onSubscribe: () => void;
}

const SubscriptionTab = ({
  user,
  isOwnProfile,
  isSubscribed,
  onSubscribe,
}: SubscriptionTabProps) => {
  const [subscriptionInterval, setSubscriptionInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [monthlyPrice, setMonthlyPrice] = useState('19.99');
  const [yearlyPrice, setYearlyPrice] = useState('199.99');
  const [newPerk, setNewPerk] = useState('');
  const [perks, setPerks] = useState([
    'Early access to new event announcements',
    'Exclusive content and behind-the-scenes',
    'Direct Q&A sessions with the creator',
    'Networking opportunities with other subscribers',
  ]);

  const subscriptionEvent = {
    title: 'Monthly Creator Hangout',
    description:
      'Join me every month for exclusive content, Q&A sessions, and networking with other subscribers.',
    schedule: 'Every last Friday of the month',
    time: '7:00 PM - 9:00 PM EST',
    location: 'Virtual (Zoom link will be sent to subscribers)',
  };

  const handleAddPerk = () => {
    if (newPerk.trim()) {
      setPerks([...perks, newPerk.trim()]);
      setNewPerk('');
    }
  };

  const handleRemovePerk = (index: number) => {
    setPerks(perks.filter((_, i) => i !== index));
  };

  const handleSubscribeSuccess = () => {
    onSubscribe();
  };

  const handleSubscribeError = (error: Error) => {};

  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex flex-col items-center text-center md:flex-row md:items-start'>
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary md:mb-0 md:mr-6'>
            <Star className='h-8 w-8 text-primary-foreground' />
          </div>

          <div className='flex-1'>
            <h3 className='text-xl font-bold'>Event Subscription</h3>
            <p className='mb-2 text-muted-foreground'>
              Get access to exclusive recurring events hosted by {user.name}.
            </p>

            <SubscriptionEventDetails {...subscriptionEvent} />

            {!isOwnProfile && (
              <>
                <div className='mb-6'>
                  <SubscriptionPricing
                    subscriptionInterval={subscriptionInterval}
                    monthlyPrice={monthlyPrice}
                    yearlyPrice={yearlyPrice}
                    onIntervalChange={setSubscriptionInterval}
                    onMonthlyPriceChange={setMonthlyPrice}
                    onYearlyPriceChange={setYearlyPrice}
                  />
                </div>

                <div className='mb-6'>
                  <h4 className='font-medium mb-2'>Subscription Benefits:</h4>
                  <SubscriptionBenefits
                    perks={perks}
                    newPerk={newPerk}
                    onNewPerkChange={setNewPerk}
                    onAddPerk={handleAddPerk}
                    onRemovePerk={handleRemovePerk}
                  />
                </div>

                <SubscriptionButton
                  planTitle={subscriptionEvent.title}
                  planDescription={subscriptionEvent.description}
                  price={parseFloat(
                    subscriptionInterval === 'monthly' ? monthlyPrice : yearlyPrice
                  )}
                  variant='outline'
                  className='w-full'
                  onSubscribeSuccess={handleSubscribeSuccess}
                  onSubscribeError={handleSubscribeError}
                >
                  <CalendarDays className='mr-2 h-4 w-4' />
                  Subscribe ($
                  {parseFloat(
                    subscriptionInterval === 'monthly' ? monthlyPrice : yearlyPrice
                  ).toFixed(2)}
                  /{subscriptionInterval})
                </SubscriptionButton>
              </>
            )}

            {isSubscribed && (
              <p className='mt-4 text-center md:text-left text-sm text-muted-foreground'>
                Subscribed to {subscriptionInterval} plan. Next billing:{' '}
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionTab;
