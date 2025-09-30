'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useKeyboardShortcuts, createSubmitShortcut } from '@/hooks/useKeyboardShortcuts';
import {
  FormField,
  FormSection,
  FormActions,
  SearchSelect,
  SearchSelectOption,
} from '@/components/forms/shared';
import {
  onboardingSchema,
  onboardingDefaults,
  OnboardingValues,
  OnboardingStep,
  OnboardingProgress,
} from '@/lib/validations/onboardingValidation';
import {
  User,
  MapPin,
  Users,
  Settings,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Target,
  Globe,
  Heart,
  Briefcase,
  GraduationCap,
  Rocket,
  Camera,
  Upload,
  X,
  Clock,
  Star,
  Zap,
  Bell,
  Shield,
  Eye,
  MessageCircle,
  Calendar,
  Package,
  TrendingUp,
  Music,
  Book,
  Palette,
  Code,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingFormProps {
  onComplete?: (data: OnboardingValues) => Promise<void> | undefined;
  onStepComplete?: (step: number, data: unknown) => void | undefined;
  initialStep?: number | undefined;
  allowSkip?: boolean | undefined;
  className?: string | undefined;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  onComplete,
  onStepComplete,
  initialStep = 0,
  allowSkip = true,
  className,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: onboardingDefaults,
  });

  const {
    setValue,
    watch,
    formState: { errors },
  } = form;

  // Define onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: 'Welcome',
      description: 'Tell us about yourself',
      icon: <User className='w-5 h-5' />,
      required: true,
      estimatedTime: '2 min',
    },
    {
      id: 1,
      title: 'Your Role',
      description: 'What brings you here?',
      icon: <Target className='w-5 h-5' />,
      required: true,
      estimatedTime: '3 min',
    },
    {
      id: 2,
      title: 'Preferences',
      description: 'Location and settings',
      icon: <Settings className='w-5 h-5' />,
      required: true,
      estimatedTime: '3 min',
    },
    {
      id: 3,
      title: 'Connect',
      description: 'Social profiles and friends',
      icon: <Users className='w-5 h-5' />,
      required: false,
      estimatedTime: '2 min',
    },
    {
      id: 4,
      title: 'Complete',
      description: 'Final setup',
      icon: <CheckCircle className='w-5 h-5' />,
      required: true,
      estimatedTime: '1 min',
    },
  ];

  // Calculate progress
  const progress: OnboardingProgress = {
    totalSteps: steps.length,
    completedSteps: completedSteps.length,
    currentStep,
    percentComplete: (completedSteps.length / steps.length) * 100,
    isComplete: completedSteps.length === steps.length,
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    createSubmitShortcut(() => handleNext()),
    {
      key: 'ArrowLeft',
      handler: () => currentStep > 0 && setCurrentStep(currentStep - 1),
      description: 'Previous step',
    },
    {
      key: 'ArrowRight',
      handler: () => currentStep < steps.length - 1 && handleNext(),
      description: 'Next step',
    },
  ]);

  // Role options
  const roleOptions: SearchSelectOption[] = [
    {
      value: 'creator',
      label: 'Content Creator',
      icon: <Star className='w-4 h-4' />,
      description: 'Create and share content',
    },
    {
      value: 'attendee',
      label: 'Event Attendee',
      icon: <Calendar className='w-4 h-4' />,
      description: 'Discover and attend events',
    },
    {
      value: 'organizer',
      label: 'Event Organizer',
      icon: <Users className='w-4 h-4' />,
      description: 'Organize and manage events',
    },
    {
      value: 'business-owner',
      label: 'Business Owner',
      icon: <Briefcase className='w-4 h-4' />,
      description: 'Grow your business',
    },
    {
      value: 'freelancer',
      label: 'Freelancer',
      icon: <Zap className='w-4 h-4' />,
      description: 'Find opportunities and clients',
    },
    {
      value: 'student',
      label: 'Student',
      icon: <GraduationCap className='w-4 h-4' />,
      description: 'Learn and network',
    },
    {
      value: 'entrepreneur',
      label: 'Entrepreneur',
      icon: <Rocket className='w-4 h-4' />,
      description: 'Build and scale ventures',
    },
    {
      value: 'other',
      label: 'Other',
      icon: <User className='w-4 h-4' />,
      description: 'Something else',
    },
  ];

  // Interest options with icons
  const interestOptions = [
    {
      value: 'events',
      label: 'Events',
      icon: <Calendar className='w-4 h-4' />,
      color: 'bg-gray-100 text-gray-700',
    },
    {
      value: 'networking',
      label: 'Networking',
      icon: <Users className='w-4 h-4' />,
      color: 'bg-gray-200 text-gray-700',
    },
    {
      value: 'learning',
      label: 'Learning',
      icon: <Book className='w-4 h-4' />,
      color: 'bg-gray-300 text-gray-700',
    },
    {
      value: 'entertainment',
      label: 'Entertainment',
      icon: <Music className='w-4 h-4' />,
      color: 'bg-gray-100 text-gray-700',
    },
    {
      value: 'business',
      label: 'Business',
      icon: <TrendingUp className='w-4 h-4' />,
      color: 'bg-gray-200 text-gray-700',
    },
    {
      value: 'technology',
      label: 'Technology',
      icon: <Code className='w-4 h-4' />,
      color: 'bg-gray-300 text-gray-700',
    },
    {
      value: 'arts-culture',
      label: 'Arts & Culture',
      icon: <Palette className='w-4 h-4' />,
      color: 'bg-gray-100 text-gray-700',
    },
    {
      value: 'sports-fitness',
      label: 'Sports & Fitness',
      icon: <Target className='w-4 h-4' />,
      color: 'bg-gray-200 text-gray-700',
    },
    {
      value: 'food-drink',
      label: 'Food & Drink',
      icon: <Package className='w-4 h-4' />,
      color: 'bg-gray-300 text-gray-700',
    },
    {
      value: 'travel',
      label: 'Travel',
      icon: <Globe className='w-4 h-4' />,
      color: 'bg-gray-100 text-gray-700',
    },
  ];

  const goalOptions = [
    { value: 'attend-events', label: 'Attend Events', icon: <Calendar className='w-4 h-4' /> },
    { value: 'create-events', label: 'Create Events', icon: <Lightbulb className='w-4 h-4' /> },
    { value: 'build-community', label: 'Build Community', icon: <Users className='w-4 h-4' /> },
    {
      value: 'network-professionally',
      label: 'Network Professionally',
      icon: <Briefcase className='w-4 h-4' />,
    },
    {
      value: 'learn-new-skills',
      label: 'Learn New Skills',
      icon: <GraduationCap className='w-4 h-4' />,
    },
    {
      value: 'promote-business',
      label: 'Promote Business',
      icon: <TrendingUp className='w-4 h-4' />,
    },
  ];

  const handleNext = async () => {
    const currentStepData = getCurrentStepData();

    try {
      // Validate current step
      await validateCurrentStep();

      // Mark step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }

      // Call step completion callback
      onStepComplete?.(currentStep, currentStepData);

      // Move to next step or complete
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleComplete();
      }
    } catch (error) {
      // Form validation will show errors
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipStep = () => {
    if (allowSkip && !steps[currentStep].required) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      const formData = form.getValues();
      formData.completeOnboarding = true;
      formData.completedSteps = completedSteps;

      if (onComplete) {
        await onComplete(formData);
      }

      toast({
        title: 'Welcome to Commonly!',
        description: 'Your profile has been set up successfully.',
      });
    } catch (error) {
      toast({
        title: 'Setup failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentStepData = () => {
    const formData = form.getValues();
    switch (currentStep) {
      case 0:
        return formData.welcome;
      case 1:
        return formData.role;
      case 2:
        return formData.preferences;
      case 3:
        return formData.social;
      case 4:
        return formData.complete;
      default:
        return {};
    }
  };

  const validateCurrentStep = async () => {
    const stepFields = getStepFields(currentStep);
    const isValid = await form.trigger(stepFields);
    if (!isValid) {
      throw new Error('Validation failed');
    }
  };

  const getStepFields = (step: number): string[] => {
    switch (step) {
      case 0:
        return ['welcome.firstName', 'welcome.lastName'];
      case 1:
        return ['role.primaryRole', 'role.interests', 'role.experience', 'role.goals'];
      case 2:
        return ['preferences.location.city', 'preferences.location.country'];
      case 3:
        return []; // Optional step
      case 4:
        return [];
      default:
        return [];
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Avatar must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      setAvatarPreview(result);
      setValue('welcome.avatar.url', result);
    };
    reader.readAsDataURL(file);
  };

  const toggleInterest = (interest: string) => {
    const currentInterests = watch('role.interests') || [];
    const updatedInterests = currentInterests.includes(interest as unknown)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest as unknown];

    setValue('role.interests', updatedInterests);
  };

  const toggleGoal = (goal: string) => {
    const currentGoals = watch('role.goals') || [];
    const updatedGoals = currentGoals.includes(goal as unknown)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal as unknown];

    setValue('role.goals', updatedGoals);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold mb-2'>Welcome to Commonly!</h2>
              <p className='text-muted-foreground'>Let's get your profile set up</p>
            </div>

            <div className='flex justify-center'>
              <div className='relative'>
                <div className='w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden'>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt='Avatar' className='w-full h-full object-cover' />
                  ) : (
                    <Camera className='w-8 h-8 text-muted-foreground' />
                  )}
                </div>
                <input
                  type='file'
                  id='avatar-upload'
                  accept='image/*'
                  onChange={handleAvatarUpload}
                  className='hidden'
                />
                <label
                  htmlFor='avatar-upload'
                  className='absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors'
                >
                  <Upload className='w-4 h-4 text-primary-foreground' />
                </label>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                form={form}
                name='welcome.firstName'
                label='First Name'
                placeholder='Your first name'
                required
              />
              <FormField
                form={form}
                name='welcome.lastName'
                label='Last Name'
                placeholder='Your last name'
                required
              />
            </div>

            <FormField
              form={form}
              name='welcome.bio'
              label='Bio (Optional)'
              placeholder='Tell us a bit about yourself...'
              type='textarea'
              rows={3}
            />
          </div>
        );

      case 1:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold mb-2'>What's your role?</h2>
              <p className='text-muted-foreground'>Help us personalize your experience</p>
            </div>

            <div>
              <label className='text-sm font-medium mb-3 block'>
                Primary Role <span className='text-destructive'>*</span>
              </label>
              <SearchSelect
                options={roleOptions}
                value={watch('role.primaryRole') || ''}
                onChange={value => setValue('role.primaryRole', value as unknown)}
                placeholder='Select your primary role'
              />
            </div>

            <div>
              <label className='text-sm font-medium mb-3 block'>
                Interests <span className='text-destructive'>*</span>
              </label>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                {interestOptions.map(interest => (
                  <button
                    key={interest.value}
                    type='button'
                    onClick={() => toggleInterest(interest.value)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all hover:shadow-sm',
                      (watch('role.interests') || []).includes(interest.value as unknown)
                        ? interest.color + ' border-current shadow-sm'
                        : 'bg-card hover:bg-muted/50 border-border'
                    )}
                  >
                    <div className='flex items-center gap-2'>
                      {interest.icon}
                      <span className='text-sm font-medium'>{interest.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className='text-sm font-medium mb-3 block'>
                Goals <span className='text-destructive'>*</span>
              </label>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {goalOptions.map(goal => (
                  <button
                    key={goal.value}
                    type='button'
                    onClick={() => toggleGoal(goal.value)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all hover:shadow-sm flex items-center gap-3',
                      (watch('role.goals') || []).includes(goal.value as unknown)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-card hover:bg-muted/50 border-border'
                    )}
                  >
                    {goal.icon}
                    <span className='text-sm'>{goal.label}</span>
                    {((watch('role.goals') || []).includes(goal.value as any)) && (
                      <CheckCircle className='w-4 h-4 ml-auto' />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold mb-2'>Set your preferences</h2>
              <p className='text-muted-foreground'>Customize your experience</p>
            </div>

            <FormSection title='Location' icon={<MapPin className='w-4 h-4' />}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  form={form}
                  name='preferences.location.city'
                  label='City'
                  placeholder='Your city'
                  required
                />
                <FormField
                  form={form}
                  name='preferences.location.country'
                  label='Country'
                  placeholder='Your country'
                  required
                />
              </div>
            </FormSection>

            <FormSection title='Notifications' icon={<Bell className='w-4 h-4' />}>
              <div className='space-y-3'>
                {[
                  { key: 'email', label: 'Email notifications' },
                  { key: 'push', label: 'Push notifications' },
                  { key: 'events', label: 'Event updates' },
                  { key: 'messages', label: 'Direct messages' },
                ].map(notification => (
                  <div key={notification.key} className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      id={`notification-${notification.key}`}
          {...form.register(`preferences.notifications.${notification.key}` as unknown)}
                    />
                    <label htmlFor={`notification-${notification.key}`} className='text-sm'>
                      {notification.label}
                    </label>
                  </div>
                ))}
              </div>
            </FormSection>

            <FormSection title='Privacy' icon={<Shield className='w-4 h-4' />}>
              <div className='space-y-4'>
                <div>
                  <label className='text-sm font-medium mb-2 block'>Profile Visibility</label>
                  <SearchSelect
                    options={[
                      {
                        value: 'public',
                        label: 'Public',
                        description: 'Anyone can see your profile',
                      },
                      {
                        value: 'friends',
                        label: 'Friends only',
                        description: 'Only friends can see your profile',
                      },
                      {
                        value: 'private',
                        label: 'Private',
                        description: 'Only you can see your profile',
                      },
                    ]}
                    value={watch('preferences.privacy.profileVisibility') || 'public'}
                    onChange={value =>
                      setValue('preferences.privacy.profileVisibility', value as unknown)
                    }
                    placeholder='Select visibility'
                  />
                </div>
              </div>
            </FormSection>
          </div>
        );

      case 3:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold mb-2'>Connect with others</h2>
              <p className='text-muted-foreground'>Add your social profiles and find friends</p>
            </div>

            <Alert>
              <Users className='w-4 h-4' />
              <AlertDescription>
                This step is optional. You can skip it and add this information later.
              </AlertDescription>
            </Alert>

            <FormSection title='Social Profiles' icon={<Globe className='w-4 h-4' />}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  form={form}
                  name='social.socialProfiles.twitter'
                  label='Twitter'
                  placeholder='https://twitter.com/yourusername'
                />
                <FormField
                  form={form}
                  name='social.socialProfiles.linkedin'
                  label='LinkedIn'
                  placeholder='https://linkedin.com/in/yourusername'
                />
                <FormField
                  form={form}
                  name='social.socialProfiles.website'
                  label='Website'
                  placeholder='https://yourwebsite.com'
                />
                <FormField
                  form={form}
                  name='social.socialProfiles.portfolio'
                  label='Portfolio'
                  placeholder='https://yourportfolio.com'
                />
              </div>
            </FormSection>
          </div>
        );

      case 4:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold mb-2'>Almost done!</h2>
              <p className='text-muted-foreground'>A few final preferences</p>
            </div>

            <FormSection title='Newsletter' icon={<Bell className='w-4 h-4' />}>
              <div className='space-y-4'>
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    id='newsletter-subscribe'
          {...form.register('complete.newsletter.subscribe')}
                  />
                  <label htmlFor='newsletter-subscribe' className='text-sm'>
                    Subscribe to our newsletter for updates and tips
                  </label>
                </div>
              </div>
            </FormSection>

            <FormSection title='Getting Started' icon={<Lightbulb className='w-4 h-4' />}>
              <div className='space-y-4'>
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    id='take-tour'
          {...form.register('complete.tour.takeTour')}
                  />
                  <label htmlFor='take-tour' className='text-sm'>
                    Take a quick tour of the platform
                  </label>
                </div>

                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    id='verify-email'
          {...form.register('complete.verification.verifyEmail')}
                  />
                  <label htmlFor='verify-email' className='text-sm'>
                    Verify your email address
                  </label>
                </div>
              </div>
            </FormSection>

            <div className='text-center p-6 bg-muted/50 rounded-lg'>
              <CheckCircle className='w-12 h-12 text-green-500 mx-auto mb-3' />
              <h3 className='text-lg font-medium mb-2'>You're all set!</h3>
              <p className='text-sm text-muted-foreground'>
                Click complete to finish your onboarding and start exploring Commonly.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              {steps[currentStep].icon}
              {steps[currentStep].title}
            </CardTitle>
            <p className='text-sm text-muted-foreground mt-1'>
              {steps[currentStep].description} • {steps[currentStep].estimatedTime}
            </p>
          </div>
          <Badge variant='secondary'>
            {currentStep + 1} of {steps.length}
          </Badge>
        </div>

        <div className='space-y-2'>
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>Progress</span>
            <span>{Math.round(progress.percentComplete)}%</span>
          </div>
          <Progress value={progress.percentComplete} className='h-2' />
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-6'>
          {renderStepContent()}

          <Separator />

          <div className='flex items-center justify-between'>
            <Button
              type='button'
              variant='outline'
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className='flex items-center gap-2'
            >
              <ChevronLeft className='w-4 h-4' />
              Previous
            </Button>

            <div className='flex items-center gap-2'>
              {allowSkip && !steps[currentStep].required && currentStep < steps.length - 1 && (
                <Button type='button' variant='ghost' onClick={handleSkipStep}>
                  Skip
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className='flex items-center gap-2'
              >
                {currentStep === steps.length - 1 ? (
                  isSubmitting ? (
                    'Completing...'
                  ) : (
                    'Complete Setup'
                  )
                ) : (
                  <>
                    Next
                    <ChevronRight className='w-4 h-4' />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingForm;
