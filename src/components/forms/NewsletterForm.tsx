'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  FormField,
  FormSection,
  FormActions,
  SearchSelect,
  SearchSelectOption,
} from '@/components/forms/shared';
import {
  newsletterSchema,
  newsletterDefaults,
  NewsletterValues,
} from '@/lib/validations/contactValidation';
import {
  Mail,
  User,
  Globe,
  Clock,
  CheckCircle,
  Star,
  Calendar,
  Package,
  Users,
  Building,
  Zap,
  TrendingUp,
  Gift,
  Bell,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsletterFormProps {
  onSubmit?: (data: NewsletterValues) => Promise<void> | undefined;
  defaultValues?: Partial<NewsletterValues> | undefined;
  variant?: 'full' | undefined| 'compact' | 'inline';
  showNameFields?: boolean | undefined;
  showAdvancedOptions?: boolean | undefined;
  title?: string | undefined;
  description?: string | undefined;
  className?: string | undefined;
}

export const NewsletterForm: React.FC<NewsletterFormProps> = ({
  onSubmit,
  defaultValues = {},
  variant = 'full',
  showNameFields = true,
  showAdvancedOptions = true,
  title,
  description,
  className,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const form = useForm<NewsletterValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
          ...newsletterDefaults,
          ...defaultValues,
    },
  });

  const {
    setValue,
    watch,
    formState: { errors },
  } = form;
  const selectedInterests = watch('interests') || [];
  const frequencyValue = watch('frequency');
  const languageValue = watch('language');

  // Interest options with icons and descriptions
  const interestOptions = [
    {
      value: 'events',
      label: 'Events',
      icon: <Calendar className='w-4 h-4' />,
      description: 'Local and virtual events, workshops, and meetups',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    {
      value: 'products',
      label: 'Products',
      icon: <Package className='w-4 h-4' />,
      description: 'New product launches and marketplace updates',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
    {
      value: 'community-updates',
      label: 'Community Updates',
      icon: <Users className='w-4 h-4' />,
      description: 'Community news, highlights, and member spotlights',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    {
      value: 'partnerships',
      label: 'Partnerships',
      icon: <Building className='w-4 h-4' />,
      description: 'New partnerships and collaboration opportunities',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    {
      value: 'technology',
      label: 'Technology',
      icon: <Zap className='w-4 h-4' />,
      description: 'Platform updates, new features, and tech insights',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    {
      value: 'creator-tools',
      label: 'Creator Tools',
      icon: <Star className='w-4 h-4' />,
      description: 'Tools and resources for content creators',
      color: 'bg-pink-100 text-pink-700 border-pink-200',
    },
    {
      value: 'business-features',
      label: 'Business Features',
      icon: <TrendingUp className='w-4 h-4' />,
      description: 'Business tools, analytics, and enterprise features',
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    {
      value: 'promotions',
      label: 'Promotions',
      icon: <Gift className='w-4 h-4' />,
      description: 'Special offers, discounts, and exclusive deals',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ];

  const frequencyOptions: SearchSelectOption[] = [
    {
      value: 'daily',
      label: 'Daily',
      icon: <Bell className='w-4 h-4' />,
      description: 'Get updates every day (only for breaking news)',
    },
    {
      value: 'weekly',
      label: 'Weekly',
      icon: <Calendar className='w-4 h-4' />,
      description: 'Perfect balance of staying informed (Recommended)',
    },
    {
      value: 'monthly',
      label: 'Monthly',
      icon: <Clock className='w-4 h-4' />,
      description: 'Monthly digest with the most important updates',
    },
  ];

  const languageOptions: SearchSelectOption[] = [
    { value: 'en', label: 'English', icon: <Globe className='w-4 h-4' /> },
    { value: 'es', label: 'Español', icon: <Globe className='w-4 h-4' /> },
    { value: 'fr', label: 'Français', icon: <Globe className='w-4 h-4' /> },
    { value: 'de', label: 'Deutsch', icon: <Globe className='w-4 h-4' /> },
    { value: 'it', label: 'Italiano', icon: <Globe className='w-4 h-4' /> },
    { value: 'pt', label: 'Português', icon: <Globe className='w-4 h-4' /> },
  ];

  const toggleInterest = (interest: string) => {
    const currentInterests = selectedInterests;
    const updatedInterests = currentInterests.includes(interest as unknown)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest as unknown];

    setValue('interests', updatedInterests);
  };

  const handleSubmit = async (data: NewsletterValues) => {
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Default submission logic
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsSubscribed(true);
        toast({
          title: 'Successfully subscribed!',
          description: 'Welcome to our newsletter. Check your email for confirmation.',
        });
      }
    } catch (error) {
      toast({
        title: 'Subscription failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSubscribed) {
    return (
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardContent className='text-center py-8'>
          <div className='flex justify-center mb-4'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
              <CheckCircle className='w-8 h-8 text-green-600' />
            </div>
          </div>
          <h3 className='text-lg font-semibold mb-2'>You're all set!</h3>
          <p className='text-sm text-muted-foreground mb-4'>
            Check your email to confirm your subscription and start receiving updates.
          </p>
          <Button variant='outline' onClick={() => setIsSubscribed(false)} className='text-sm'>
            Subscribe Another Email
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compact variant for sidebars/footers
  if (variant === 'compact') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className='p-4'>
          <div className='space-y-3'>
            <div>
              <h4 className='font-medium mb-1'>Stay Updated</h4>
              <p className='text-sm text-muted-foreground'>Get the latest news and updates</p>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-3'>
              <FormField
                form={form}
                name='email'
                label='Email'
                placeholder='Enter your email'
                type='email'
                required
              />

              <div className='space-y-2'>
                <p className='text-xs text-muted-foreground'>Interests:</p>
                <div className='flex flex-wrap gap-1'>
                  {interestOptions.slice(0, 4).map(interest => (
                    <button
                      key={interest.value}
                      type='button'
                      onClick={() => toggleInterest(interest.value)}
                      className={cn(
                        'px-2 py-1 text-xs rounded-md border transition-colors',
                        selectedInterests.includes(interest.value as unknown)
                          ? interest.color
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      {interest.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className='flex items-start space-x-2'>
                <input
                  type='checkbox'
                  id='consent-compact'
          {...form.register('consentToMarketing')}
                  className='mt-0.5'
                />
                <label htmlFor='consent-compact' className='text-xs text-muted-foreground'>
                  I agree to receive marketing emails
                </label>
              </div>

              <Button type='submit' disabled={isSubmitting} className='w-full' size='sm'>
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline variant for embedded use
  if (variant === 'inline') {
    return (
      <div className={cn('flex gap-2', className)}>
        <FormField
          form={form}
          name='email'
          label='Email'
          placeholder='Enter your email'
          type='email'
          className='flex-1'
          required
        />
        <Button type='submit' onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </div>
    );
  }

  // Full variant (default)
  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Mail className='w-5 h-5' />
          {title || 'Subscribe to Our Newsletter'}
        </CardTitle>
        <p className='text-sm text-muted-foreground'>
          {description || 'Stay up-to-date with the latest news, events, and platform updates.'}
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {/* Contact Information */}
          <FormSection title='Contact Information'>
            <div className='space-y-4'>
              <FormField
                form={form}
                name='email'
                label='Email'
                placeholder='Enter your email'
                type='email'
                required
              />

              {showNameFields && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    form={form}
                    name='firstName'
                    label='First Name (Optional)'
                    placeholder='Your first name'
                    icon={<User className='w-4 h-4' />}
                  />

                  <FormField
                    form={form}
                    name='lastName'
                    label='Last Name (Optional)'
                    placeholder='Your last name'
                    icon={<User className='w-4 h-4' />}
                  />
                </div>
              )}
            </div>
          </FormSection>

          {/* Interests */}
          <FormSection title='Your Interests'>
            <div className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                Select the topics you're most interested in (select at least one):
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {interestOptions.map(interest => (
                  <button
                    key={interest.value}
                    type='button'
                    onClick={() => toggleInterest(interest.value)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all hover:shadow-sm',
                      selectedInterests.includes(interest.value as unknown)
                        ? interest.color + ' shadow-sm'
                        : 'bg-card hover:bg-muted/50 border-border'
                    )}
                  >
                    <div className='flex items-start gap-3'>
                      <div
                        className={cn(
                          'p-1.5 rounded-md',
                          selectedInterests.includes(interest.value as unknown)
                            ? 'bg-white/80'
                            : 'bg-muted'
                        )}
                      >
                        {interest.icon}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <h4 className='font-medium text-sm'>{interest.label}</h4>
                          {selectedInterests.includes(interest.value as unknown) && (
                            <CheckCircle className='w-4 h-4 text-current' />
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground mt-1'>{interest.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {errors.interests && (
                <p className='text-sm text-destructive'>{errors.interests.message}</p>
              )}
            </div>
          </FormSection>

          {/* Preferences */}
          {showAdvancedOptions && (
            <FormSection title='Email Preferences'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label className='text-sm font-medium mb-2 block'>Email Frequency</label>
                  <SearchSelect
                    options={frequencyOptions}
                    value={frequencyValue || 'weekly'}
                    onChange={value => setValue('frequency', value as unknown)}
                    placeholder='Select frequency'
                  />
                </div>

                <div>
                  <label className='text-sm font-medium mb-2 block'>Language</label>
                  <SearchSelect
                    options={languageOptions}
                    value={languageValue || 'en'}
                    onChange={value => setValue('language', value as unknown)}
                    placeholder='Select language'
                  />
                </div>
              </div>
            </FormSection>
          )}

          {/* Consent */}
          <FormSection title='Consent'>
            <div className='space-y-4'>
              <Alert>
                <Shield className='w-4 h-4' />
                <AlertDescription>
                  We respect your privacy and will never share your email with third parties. You
                  can unsubscribe at any time.
                </AlertDescription>
              </Alert>

              <div className='space-y-3'>
                <div className='flex items-start space-x-3'>
                  <input
                    type='checkbox'
                    id='consentToMarketing'
          {...form.register('consentToMarketing')}
                    className='mt-1'
                  />
                  <label htmlFor='consentToMarketing' className='text-sm'>
                    I consent to receive marketing communications and newsletters from Commonly.
                    <span className='text-destructive ml-1'>*</span>
                  </label>
                </div>
                {errors.consentToMarketing && (
                  <p className='text-sm text-destructive'>{errors.consentToMarketing.message}</p>
                )}

                <p className='text-xs text-muted-foreground'>
                  By subscribing, you agree to our Privacy Policy and Terms of Service. You can
                  change your preferences or unsubscribe at any time.
                </p>
              </div>
            </div>
          </FormSection>

          <Separator />

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel='Subscribe to Newsletter'
            submitIcon={<Mail className='w-4 h-4' />}
            showCancel={false}
            align='center'
            fullWidth
          />

          <div className='text-center'>
            <p className='text-xs text-muted-foreground'>
              Join thousands of users who stay updated with our newsletter
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewsletterForm;
