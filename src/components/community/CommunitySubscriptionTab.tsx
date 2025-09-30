import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  Star,
  CreditCard,
  CalendarDays,
  MapPin,
  Video,
  AlertCircle,
  Loader2,
  Share2,
  Copy,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import type {
  Community,
  CommunitySubscriptionSettings as CommunitySubscriptionSettingsType,
  CommunitySubscriber,
} from '@/lib/types/community';

import {
  getCommunitySubscriptionSettings,
  getUserCommunitySubscription,
  createCommunitySubscription,
  cancelCommunitySubscription,
} from '@/services/communitySubscriptionService';
import { SubscriptionPaymentForm } from '@/components/payment/subscription/SubscriptionPaymentForm';
import SocialSharePopover from '@/components/share/SocialSharePopover';

interface CommunitySubscriptionTabProps {
  community: Community;
}

const CommunitySubscriptionTab: React.FC<CommunitySubscriptionTabProps> = ({ community }) => {
  const { user } = useAuth();
  const [subscriptionSettings, setSubscriptionSettings] =
    useState<CommunitySubscriptionSettingsType | null>(null);
  const [userSubscription, setUserSubscription] = useState<CommunitySubscriber | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load subscription settings
        const settings = await getCommunitySubscriptionSettings(community.id);
        setSubscriptionSettings(settings);

        // Load user's subscription status if logged in
        if (user) {
          const subscription = await getUserCommunitySubscription(user.id, community.id);
          setUserSubscription(subscription);
        }
      } catch (error) {
        toast.error('Failed to load subscription information');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [community.id, user]);

  const handleSubscribe = async (subscriptionType: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return;
    }

    if (!subscriptionSettings) {
      toast.error('Subscription settings not available');
      return;
    }

    setSelectedPlan(subscriptionType);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = async () => {
    if (!user || !subscriptionSettings) return;

    setIsProcessing(true);
    try {
      const price =
        selectedPlan === 'monthly'
          ? subscriptionSettings.monthlyPrice
          : subscriptionSettings.yearlyPrice;

      // Create subscription with real payment method (will be set during checkout)
      const subscriptionData = {
        community_id: community.id,
        subscription_type: selectedPlan,
        price: price,
        payment_method_id: null, // paymentMethodId will be handled in checkout flow
      };
      const subscriptionId = await createCommunitySubscription(subscriptionData);

      if (subscriptionId) {
        // Refresh subscription status
        const subscription = await getUserCommunitySubscription(user.id, community.id);
        setUserSubscription(subscription);
        setShowPaymentForm(false);
        toast.success('Successfully subscribed to community events!');
      }
    } catch (error) {
      toast.error('Failed to process subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userSubscription || !user) return;

    setIsProcessing(true);
    try {
      const success = await cancelCommunitySubscription(userSubscription.id, user.id);
      if (success) {
        setUserSubscription(null);
        toast.success('Subscription cancelled successfully');
      }
    } catch (_error) {
      // Error handling silently ignored
    } finally {
      setIsProcessing(false);
    }
  };

  const formatNextEventDate = () => {
    if (!subscriptionSettings?.nextEventDate) return 'TBD';

    const date = new Date(subscriptionSettings.nextEventDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) as string;
  };

  const getScheduleDescription = () => {
    if (!subscriptionSettings) return '';

    const { recurringEvent } = subscriptionSettings;

    switch (recurringEvent.schedule) {
      case 'monthly':
        return `Every ${recurringEvent.dayOfMonth}${getOrdinalSuffix(recurringEvent.dayOfMonth || 1)} of the month`;
      case 'weekly':
        return `Every ${getDayOfWeekName(recurringEvent.dayOfWeek || 0)}`;
      case 'bi-weekly':
        return `Every other ${getDayOfWeekName(recurringEvent.dayOfWeek || 0)}`;
      default:
        return 'Recurring event';
    }
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const getDayOfWeekName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  const calculateYearlyDiscount = () => {
    if (!subscriptionSettings) return { savings: 0, percentage: 0 };

    const monthlyTotal = subscriptionSettings.monthlyPrice * 12;
    const savings = monthlyTotal - subscriptionSettings.yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { savings, percentage };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin' />
            <span className='ml-2'>Loading subscription information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionSettings || !subscriptionSettings.enabled) {
    return (
      <Card>
        <CardContent className='p-6 text-center'>
          <div className='mb-4'>
            <CalendarDays className='h-12 w-12 mx-auto text-muted-foreground' />
          </div>
          <h3 className='text-lg font-medium mb-2'>Subscriptions Not Available</h3>
          <p className='text-muted-foreground'>
            This community hasn't set up subscription-based recurring events yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showPaymentForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Complete Subscription
          </CardTitle>
          <CardDescription>
            Subscribe to {subscriptionSettings.recurringEvent.title} - {selectedPlan} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionPaymentForm
            price={
              selectedPlan === 'monthly'
                ? subscriptionSettings.monthlyPrice
                : subscriptionSettings.yearlyPrice
            }
            productId={`community_${community.id}_${selectedPlan}`}
            {...(user?.customerEmail && { customerEmail: user.customerEmail })}
            onSuccess={handlePaymentSuccess}
            onError={() => setShowPaymentForm(false)}
          />

          <div className='mt-4 pt-4 border-t'>
            <Button variant='outline' onClick={() => setShowPaymentForm(false)} className='w-full'>
              Back to Subscription Options
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {userSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              Active Subscription
            </CardTitle>
            <CardDescription>
              You're subscribed to {subscriptionSettings.recurringEvent.title}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='font-medium'>Plan</p>
                <p className='text-muted-foreground capitalize'>
                  {userSubscription.subscriptionType}
                </p>
              </div>
              <div>
                <p className='font-medium'>Next Billing</p>
                <p className='text-muted-foreground'>
                  {new Date(userSubscription.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className='font-medium'>Status</p>
                <Badge variant={userSubscription.status === 'active' ? 'default' : 'secondary'}>
                  {userSubscription.status}
                </Badge>
              </div>
              <div>
                <p className='font-medium'>Amount</p>
                <p className='text-muted-foreground'>
                  $
                  {userSubscription.subscriptionType === 'monthly'
                    ? subscriptionSettings.monthlyPrice
                    : subscriptionSettings.yearlyPrice}
                  /{userSubscription.subscriptionType === 'monthly' ? 'month' : 'year'}
                </p>
              </div>
            </div>

            {/* Referral Section for Subscribers */}
            <Separator />
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Gift className='h-5 w-5 text-purple-600' />
                <h3 className='font-medium'>Refer Friends & Earn</h3>
              </div>
              <p className='text-sm text-muted-foreground'>
                Share this community subscription with friends and earn rewards when they subscribe!
              </p>

              <div className='flex gap-2'>
                <CommunityReferralButton communityId={community.id} className='flex-1' />
                <SocialSharePopover
                  url={`${window.location.origin}/community/${community.id}`}
                  title={`Join ${community.name} Community`}
                  description={`Get access to exclusive events and content in ${community.name}`}
                  trigger={
                    <Button variant='outline' size='sm'>
                      <Share2 className='h-4 w-4 mr-2' />
                      Share
                    </Button>
                  }
                />
              </div>
            </div>

            <Separator />
            <div className='flex justify-between items-center'>
              <div>
                <p className='font-medium'>Need to cancel?</p>
                <p className='text-sm text-muted-foreground'>
                  You can cancel your subscription at any time
                </p>
              </div>
              <Button variant='outline' onClick={handleCancelSubscription} disabled={isProcessing}>
                {isProcessing ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Star className='h-5 w-5' />
            {subscriptionSettings.recurringEvent.title}
          </CardTitle>
          <CardDescription>Exclusive recurring event for community subscribers</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>{subscriptionSettings.recurringEvent.description}</p>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <CalendarDays className='h-4 w-4 text-primary' />
                <span className='text-sm'>
                  <strong>Schedule:</strong> {getScheduleDescription()}
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4 text-primary' />
                <span className='text-sm'>
                  <strong>Time:</strong> {subscriptionSettings.recurringEvent.time} (
                  {subscriptionSettings.recurringEvent.duration} minutes)
                </span>
              </div>

              <div className='flex items-center gap-2'>
                {subscriptionSettings.recurringEvent.isVirtual ? (
                  <Video className='h-4 w-4 text-primary' />
                ) : (
                  <MapPin className='h-4 w-4 text-primary' />
                )}
                <span className='text-sm'>
                  <strong>Location:</strong> {subscriptionSettings.recurringEvent.location}
                  {subscriptionSettings.recurringEvent.isVirtual &&
                    subscriptionSettings.recurringEvent.platform &&
                    ` (${subscriptionSettings.recurringEvent.platform})`}
                </span>
              </div>

              {subscriptionSettings.recurringEvent.maxCapacity && (
                <div className='flex items-center gap-2'>
                  <Users className='h-4 w-4 text-primary' />
                  <span className='text-sm'>
                    <strong>Capacity:</strong> {subscriptionSettings.recurringEvent.maxCapacity}{' '}
                    attendees
                  </span>
                </div>
              )}
            </div>

            <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <h4 className='font-medium text-blue-800 mb-2'>Next Event</h4>
              <p className='text-sm text-blue-700'>{formatNextEventDate()}</p>
              {subscriptionSettings.nextEventDate && (
                <p className='text-xs text-blue-600 mt-1'>
                  {new Date(subscriptionSettings.nextEventDate) > new Date()
                    ? 'Upcoming'
                    : 'Past event'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {subscriptionSettings.benefits.map((benefit, index) => (
              <div key={index} className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-600 flex-shrink-0' />
                <span className='text-sm'>{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Subscription Options */}
      {!userSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <DollarSign className='h-5 w-5' />
              Subscription Plans
            </CardTitle>
            <CardDescription>Choose a plan to access exclusive recurring events</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Referral Banner for Non-Subscribers */}
            <div className='bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4'>
              <div className='flex items-start gap-3'>
                <Gift className='h-5 w-5 text-purple-600 mt-0.5' />
                <div className='flex-1'>
                  <h4 className='font-medium text-purple-900'>Join through a referral?</h4>
                  <p className='text-sm text-purple-700 mt-1'>
                    If someone referred you to this community, make sure to use their referral link
                    to help them earn rewards!
                  </p>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Monthly Plan */}
              <Card className='border-2 hover:border-primary transition-colors cursor-pointer'>
                <CardContent className='p-4'>
                  <div className='text-center space-y-2'>
                    <h3 className='font-semibold'>Monthly</h3>
                    <div className='text-2xl font-bold'>
                      ${subscriptionSettings.monthlyPrice}
                      <span className='text-sm font-normal text-muted-foreground'>/month</span>
                    </div>
                    <p className='text-sm text-muted-foreground'>Billed monthly, cancel anytime</p>
                    <Button
                      className='w-full mt-4'
                      onClick={() => handleSubscribe('monthly')}
                      disabled={!user}
                    >
                      {!user ? 'Sign in to Subscribe' : 'Subscribe Monthly'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Yearly Plan */}
              <Card className='border-2 hover:border-primary transition-colors cursor-pointer relative'>
                {calculateYearlyDiscount().percentage > 0 && (
                  <Badge className='absolute -top-2 -right-2 bg-green-600'>
                    Save {calculateYearlyDiscount().percentage}%
                  </Badge>
                )}
                <CardContent className='p-4'>
                  <div className='text-center space-y-2'>
                    <h3 className='font-semibold'>Yearly</h3>
                    <div className='text-2xl font-bold'>
                      ${subscriptionSettings.yearlyPrice}
                      <span className='text-sm font-normal text-muted-foreground'>/year</span>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      ${(subscriptionSettings.yearlyPrice / 12).toFixed(2)}/month • Save $
                      {calculateYearlyDiscount().savings.toFixed(2)}
                    </p>
                    <Button
                      className='w-full mt-4'
                      onClick={() => handleSubscribe('yearly')}
                      disabled={!user}
                    >
                      {!user ? 'Sign in to Subscribe' : 'Subscribe Yearly'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='h-4 w-4 text-amber-600 mt-0.5' />
                <div className='text-sm text-amber-800'>
                  <p className='font-medium mb-1'>Subscription Details</p>
                  <ul className='space-y-1 text-xs'>
                    <li>• Access to all exclusive recurring events</li>
                    <li>• Automatic billing on subscription date</li>
                    <li>• Cancel anytime from your account settings</li>
                    <li>
                      • Platform fee: 15-20% based on Creator Program status + Stripe processing
                      fees
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Community Referral Button Component
const CommunityReferralButton: React.FC<{
  communityId: string;
  className?: string;
}> = ({ communityId, className }) => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      generateReferralCode();
    }
  }, [user, communityId]);

  const generateReferralCode = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Generate a simple referral code for community subscriptions
      // In a real implementation, this would be stored in the database
      const code = `${user.id.slice(0, 8)}_${communityId.slice(0, 8)}`.toUpperCase();
      setReferralCode(code);
    } catch (_error) {
      // Error handling silently ignored
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralUrl = `${window.location.origin}/community/${communityId}?ref=${referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    toast.success('Referral link copied to clipboard!');
  };

  if (!user || !referralCode) {
    return (
      <Button variant='outline' disabled className={className}>
        <Gift className='h-4 w-4 mr-2' />
        {isLoading ? 'Loading...' : 'Generate Referral'}
      </Button>
    );
  }

  return (
    <Button variant='outline' onClick={copyReferralLink} className={className}>
      <Copy className='h-4 w-4 mr-2' />
      Copy Referral Link
    </Button>
  );
};

export default CommunitySubscriptionTab;
