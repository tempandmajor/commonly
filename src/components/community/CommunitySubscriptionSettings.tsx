import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Plus, X, Save, Settings, Repeat, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import type { CommunitySubscriptionSettings as CommunitySubscriptionSettingsType } from '@/lib/types/community';
import { communitySubscriptionSettingsSchema } from '@/lib/validations/communityValidation';
import {
  getCommunitySubscriptionSettings,
  updateCommunitySubscriptionSettings,
} from '@/services/communitySubscriptionService';

interface CommunitySubscriptionSettingsProps {
  communityId: string;
  onClose?: () => void | undefined;
}

type FormData = CommunitySubscriptionSettingsType;

const CommunitySubscriptionSettings: React.FC<CommunitySubscriptionSettingsProps> = ({
  communityId,
  onClose,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(communitySubscriptionSettingsSchema),
    defaultValues: {
      enabled: false,
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      recurringEvent: {
        title: 'Monthly Community Meetup',
        description: 'Join our exclusive monthly meetup for subscribers only',
        schedule: 'monthly',
        dayOfMonth: 15,
        time: '19:00',
        duration: 120,
        location: 'Virtual Meeting Room',
        isVirtual: true,
        platform: 'Zoom',
      },
      benefits: [
        'Access to exclusive monthly events',
        'Priority support and feedback',
        'Early access to announcements',
        'Direct interaction with community leaders',
      ],
      autoCreateEvents: true,
    },
  });

  const { watch, setValue, getValues } = form;
  const watchedValues = watch();

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getCommunitySubscriptionSettings(communityId);
        if (settings) {
          const typedSettings = settings as FormData;
          (Object.keys(typedSettings) as (keyof typeof typedSettings)[]).forEach(key => {
            const typedKey = key as keyof FormData;
            const value = typedSettings[typedKey];
            setValue(typedKey, value);
          });
        }
      } catch (error) {
        toast.error('Failed to load subscription settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [communityId, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error('You must be logged in to update settings');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await updateCommunitySubscriptionSettings({
        communityId,
        settings: data,
        userId: user.id,
      });

      if (success && onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to update subscription settings:', error);
      toast.error('Failed to update subscription settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      const currentBenefits = getValues('benefits') || [];
      setValue('benefits', [...currentBenefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    const currentBenefits = getValues('benefits') || [];
    setValue(
      'benefits',
      currentBenefits.filter((_, i) => i !== index)
    );
  };

  const calculateYearlyDiscount = () => {
    const monthlyTotal = watchedValues.monthlyPrice * 12;
    const savings = monthlyTotal - watchedValues.yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { savings, percentage };
  };

  const getDayOfWeekName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  const handleNumericInputChange = (
    field: any,
    value: string,
    parser: (val: string) => number = parseFloat
  ) => {
    const numericValue = value ? parser(value) : 0;
    field.onChange(numericValue);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            <span className='ml-2'>Loading subscription settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Community Subscription Settings</h2>
          <p className='text-muted-foreground'>
            Set up recurring events and subscription pricing for your community
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose} className='border'>
            <X className='h-4 w-4 mr-2' />
            Close
          </Button>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Settings className='h-5 w-5' />
              Subscription Settings
            </CardTitle>
            <CardDescription>
              Enable paid subscriptions for exclusive recurring events
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label htmlFor='enabled' className='text-base font-medium'>
                  Enable Community Subscriptions
                </Label>
                <p className='text-sm text-muted-foreground'>
                  Allow members to subscribe for exclusive recurring events
                </p>
              </div>
              <Controller
                name='enabled'
                control={form.control}
                render={({ field }) => (
                  <Switch id='enabled' checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            {watchedValues.enabled && (
              <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <span className='text-sm font-medium text-green-800'>Subscriptions Enabled</span>
                </div>
                <p className='text-sm text-green-700 mt-1'>
                  Members can now subscribe to your community for exclusive events
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {watchedValues.enabled && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <DollarSign className='h-5 w-5' />
                  Subscription Pricing
                </CardTitle>
                <CardDescription>Set your monthly and yearly subscription prices</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='monthlyPrice'>Monthly Price ($)</Label>
                    <Controller
                      name='monthlyPrice'
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          id='monthlyPrice'
                          type='number'
                          step='0.01'
                          min='1'
                          max='999'
                          {...field}
                          onChange={e => handleNumericInputChange(field, (e.target as HTMLInputElement).value)}
                        />
                      )}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='yearlyPrice'>Yearly Price ($)</Label>
                    <Controller
                      name='yearlyPrice'
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          id='yearlyPrice'
                          type='number'
                          step='0.01'
                          min='1'
                          max='9999'
                          {...field}
                          onChange={e => handleNumericInputChange(field, (e.target as HTMLInputElement).value)}
                        />
                      )}
                    />
                    {watchedValues.yearlyPrice < watchedValues.monthlyPrice * 12 && (
                      <div className='text-sm text-green-600'>
                        {calculateYearlyDiscount().percentage}% discount ($
                        {calculateYearlyDiscount().savings.toFixed(2)} savings)
                      </div>
                    )}
                  </div>
                </div>

                {watchedValues.recurringEvent.schedule === 'weekly' || watchedValues.recurringEvent.schedule === 'bi-weekly' ? (
                  <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                    <h4 className='font-medium text-blue-800 mb-2'>Pricing Preview</h4>
                    <div className='space-y-1 text-sm text-blue-700'>
                      <p>• Monthly: ${watchedValues.monthlyPrice}/month</p>
                      <p>
                        • Yearly: ${watchedValues.yearlyPrice}/year ({
                          (watchedValues.yearlyPrice / 12).toFixed(2)
                        }/month)
                      </p>
                      <p>
                        • Platform fee: 15-20% based on Creator Program status + Stripe processing
                        fees
                      </p>
                      <p className='text-xs text-blue-600 mt-1'>
                        Creator Program members enjoy 15% platform fees vs 20% for regular users
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Repeat className='h-5 w-5' />
                  Recurring Event Configuration
                </CardTitle>
                <CardDescription>
                  Configure the exclusive recurring event for subscribers
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='eventTitle'>Event Title</Label>
                    <Controller
                      name='recurringEvent.title'
                      control={form.control}
                      render={({ field }) => (
                        <Input id='eventTitle' placeholder='Monthly Community Meetup' {...field} />
                      )}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='schedule'>Schedule</Label>
                    <Controller
                      name='recurringEvent.schedule'
                      control={form.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='monthly'>Monthly</SelectItem>
                            <SelectItem value='weekly'>Weekly</SelectItem>
                            <SelectItem value='bi-weekly'>Bi-weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='eventDescription'>Event Description</Label>
                  <Controller
                    name='recurringEvent.description'
                    control={form.control}
                    render={({ field }) => (
                      <Textarea
                        id='eventDescription'
                        placeholder='Describe what subscribers can expect from this recurring event...'
                        rows={3}
                        {...field}
                      />
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {watchedValues.recurringEvent.schedule === 'monthly' && (
                    <div className='space-y-2'>
                      <Label htmlFor='dayOfMonth'>Day of Month</Label>
                      <Controller
                        name='recurringEvent.dayOfMonth'
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            value={field.value.toString()}
                            onValueChange={value => field.onChange(parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}

                  {(watchedValues.recurringEvent.schedule === 'weekly' ||
                    watchedValues.recurringEvent.schedule === 'bi-weekly') && (
                    <div className='space-y-2'>
                      <Label htmlFor='dayOfWeek'>Day of Week</Label>
                      <Controller
                        name='recurringEvent.dayOfWeek'
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            value={field.value.toString()}
                            onValueChange={value => field.onChange(parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>

                              {Array.from({ length: 7 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {getDayOfWeekName(i)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}

                  <div className='space-y-2'>
                    <Label htmlFor='time'>Time</Label>
                    <Controller
                      name='recurringEvent.time'
                      control={form.control}
                      render={({ field }) => <Input id='time' type='time' {...field} />}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='duration'>Duration (minutes)</Label>
                    <Controller
                      name='recurringEvent.duration'
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          id='duration'
                          type='number'
                          min='30'
                          max='480'
                          {...field}
                          onChange={e => handleNumericInputChange(field, (e.target as HTMLInputElement).value, parseInt)}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='location'>Location</Label>
                    <Controller
                      name='recurringEvent.location'
                      control={form.control}
                      render={({ field }) => (
                        <Input id='location' placeholder='Virtual Meeting Room' {...field} />
                      )}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='maxCapacity'>Max Capacity (optional)</Label>
                    <Controller
                      name='recurringEvent.maxCapacity'
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          id='maxCapacity'
                          type='number'
                          min='1'
                          placeholder='Unlimited'
                          {...field}
                          onChange={e => field.onChange(parseInt((e.target as HTMLInputElement).value) || undefined)}
                        />

                      )}

                    />
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='isVirtual' className='text-base font-medium'>
                      Virtual Event
                    </Label>
                    <p className='text-sm text-muted-foreground'>Is this a virtual event?</p>
                  </div>
                  <Controller
                    name='recurringEvent.isVirtual'
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id='isVirtual'
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                {watchedValues.recurringEvent.isVirtual && (
                  <div className='space-y-2'>
                    <Label htmlFor='platform'>Platform</Label>
                    <Controller
                      name='recurringEvent.platform'
                      control={form.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder='Select platform' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Zoom'>Zoom</SelectItem>
                            <SelectItem value='Teams'>Microsoft Teams</SelectItem>
                            <SelectItem value='Meet'>Google Meet</SelectItem>
                            <SelectItem value='Discord'>Discord</SelectItem>
                            <SelectItem value='Other'>Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}

                <div className='flex items-center justify-between'>
                  <div>
                    <Label htmlFor='autoCreateEvents' className='text-base font-medium'>
                      Auto-Create Events
                    </Label>
                    <p className='text-sm text-muted-foreground'>
                      Automatically create recurring events based on schedule
                    </p>
                  </div>
                  <Controller
                    name='autoCreateEvents'
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id='autoCreateEvents'
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Benefits</CardTitle>
                <CardDescription>List the benefits subscribers will receive</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  {watchedValues.benefits?.map((benefit, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-2 border rounded-md'
                    >
                      <span className='text-sm'>{benefit}</span>
                      <Button
                        type='button'
                        onClick={() => removeBenefit(index)}
                        className='h-8 px-2'
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className='flex gap-2'>
                  <Input
                    placeholder='Add a new benefit...'
                    value={newBenefit}
                    onChange={e => setNewBenefit((e.target as HTMLInputElement).value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  />
                  <Button type='button' onClick={addBenefit} disabled={!newBenefit.trim()}>
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className='flex justify-end gap-4'>
          {onClose && (
            <Button type='button' onClick={onClose} className='border'>
              Cancel
            </Button>
          )}
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Saving...
              </>
            ) : (
              <>
                <Save className='h-4 w-4 mr-2' />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );

};

export default CommunitySubscriptionSettings;