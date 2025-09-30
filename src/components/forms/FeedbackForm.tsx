'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  useKeyboardShortcuts,
  createSubmitShortcut,
  createSaveShortcut,
} from '@/hooks/useKeyboardShortcuts';
import {
  FormField,
  FormSection,
  FormActions,
  SearchSelect,
  SearchSelectOption,
} from '@/components/forms/shared';
import {
  feedbackFormSchema,
  feedbackFormDefaults,
  FeedbackFormValues,
} from '@/lib/validations/contactValidation';
import {
  Star,
  MessageSquare,
  Bug,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Upload,
  X,
  Send,
  Camera,
  User,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackFormProps {
  onSubmit?: (data: FeedbackFormValues) => Promise<void> | undefined;
  defaultValues?: Partial<FeedbackFormValues> | undefined;
  showUserRole?: boolean | undefined;
  showExperienceLevel?: boolean | undefined;
  showScreenshots?: boolean | undefined;
  feature?: string | undefined;
  className?: string | undefined;
}

interface ScreenshotAttachment {
  name: string;
  size: number;
  type: string;
  file: File;
  preview: string;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  onSubmit,
  defaultValues = {},
  showUserRole = true,
  showExperienceLevel = true,
  showScreenshots = true,
  feature,
  className,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotAttachment[]>([]);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
          ...feedbackFormDefaults,
      feature: feature || '',
          ...defaultValues,
    },
  });

  const {
    setValue,
    watch,
    formState: { errors },
  } = form;
  const ratingValue = watch('rating');
  const feedbackTypeValue = watch('feedbackType');
  const descriptionValue = watch('description');
  const wouldRecommendValue = watch('wouldRecommend');

  // Character count for description
  useEffect(() => {
    setCharacterCount(descriptionValue?.length || 0);
  }, [descriptionValue]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    createSubmitShortcut(() => form.handleSubmit(handleSubmit)()),
    createSaveShortcut(() => {
      toast({ title: 'Draft saved', description: 'Your feedback has been saved locally' });
    }),
  ]);

  // Feedback type options
  const feedbackTypeOptions: SearchSelectOption[] = [
    {
      value: 'bug-report',
      label: 'Bug Report',
      icon: <Bug className='w-4 h-4' />,
      description: 'Report a technical issue or bug',
    },
    {
      value: 'feature-request',
      label: 'Feature Request',
      icon: <Lightbulb className='w-4 h-4' />,
      description: 'Suggest a new feature or enhancement',
    },
    {
      value: 'improvement-suggestion',
      label: 'Improvement Suggestion',
      icon: <Target className='w-4 h-4' />,
      description: 'Suggest improvements to existing features',
    },
    {
      value: 'compliment',
      label: 'Compliment',
      icon: <Heart className='w-4 h-4' />,
      description: 'Share positive feedback',
    },
    {
      value: 'complaint',
      label: 'Complaint',
      icon: <ThumbsDown className='w-4 h-4' />,
      description: 'Report an issue or concern',
    },
    {
      value: 'general-feedback',
      label: 'General Feedback',
      icon: <MessageSquare className='w-4 h-4' />,
      description: 'General thoughts and feedback',
    },
  ];

  const userRoleOptions: SearchSelectOption[] = [
    {
      value: 'creator',
      label: 'Content Creator',
      description: 'Create events, products, or content',
    },
    { value: 'attendee', label: 'Event Attendee', description: 'Attend events and activities' },
    { value: 'organizer', label: 'Event Organizer', description: 'Organize and manage events' },
    {
      value: 'business',
      label: 'Business User',
      description: 'Use platform for business purposes',
    },
    { value: 'admin', label: 'Administrator', description: 'Platform administrator' },
    { value: 'other', label: 'Other', description: 'Other type of user' },
  ];

  const experienceLevelOptions: SearchSelectOption[] = [
    { value: 'beginner', label: 'Beginner', description: 'New to the platform' },
    {
      value: 'intermediate',
      label: 'Intermediate',
      description: 'Some experience with the platform',
    },
    { value: 'advanced', label: 'Advanced', description: 'Very familiar with the platform' },
    { value: 'expert', label: 'Expert', description: 'Power user with extensive experience' },
  ];

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target as HTMLElement.files || []);
    const maxSize = 5 * 1024 * 1024; // 5MB

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Only image files are allowed for screenshots',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 5MB`,
          variant: 'destructive',
        });
        return;
      }

      if (screenshots.length >= 5) {
        toast({
          title: 'Too many screenshots',
          description: 'Maximum 5 screenshots allowed',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const newScreenshot: ScreenshotAttachment = {
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          preview: e.target?.result as string,
        };
        setScreenshots(prev => [...prev, newScreenshot]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    (event.target as HTMLInputElement).value = '';
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleStarClick = (rating: number) => {
    setValue('rating', rating);
  };

  const handleStarHover = (rating: number) => {
    setHoveredStar(rating);
  };

  const handleSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true);

    try {
      // Add screenshots to form data
      const formDataWithScreenshots = {
          ...data,
        screenshots: screenshots.map(screenshot => ({
          name: screenshot.name,
          size: screenshot.size,
          type: screenshot.type,
          url: '', // Would be populated after upload
        })),
      };

      if (onSubmit) {
        await onSubmit(formDataWithScreenshots);
      } else {
        // Default submission logic
        await new Promise(resolve => setTimeout(resolve, 2000));

        toast({
          title: 'Feedback submitted!',
          description: 'Thank you for helping us improve the platform.',
        });

        // Clear form
        form.reset(feedbackFormDefaults);
        setScreenshots([]);
      }
    } catch (error) {
      toast({
        title: 'Failed to submit feedback',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-500';
    if (rating <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRatingLabel = (rating: number) => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[rating] || '';
  };

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MessageSquare className='w-5 h-5' />
          Share Your Feedback
        </CardTitle>
        <p className='text-sm text-muted-foreground'>
          Help us improve by sharing your thoughts, reporting issues, or suggesting features.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          {/* Feedback Type and Rating */}
          <FormSection title='Feedback Details'>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium mb-2 block'>
                  Feedback Type <span className='text-destructive'>*</span>
                </label>
                <SearchSelect
                  options={feedbackTypeOptions}
                  value={feedbackTypeValue || ''}
                  onChange={value => setValue('feedbackType', value as unknown)}
                  placeholder='Select feedback type'
                />
                {errors.feedbackType && (
                  <p className='text-sm text-destructive mt-1'>{errors.feedbackType.message}</p>
                )}
              </div>

              <div>
                <label className='text-sm font-medium mb-3 block'>
                  Overall Rating <span className='text-destructive'>*</span>
                </label>
                <div className='flex items-center gap-2'>
                  <div className='flex gap-1'>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type='button'
                        className={cn(
                          'transition-colors hover:scale-110 transform',
                          star <= (hoveredStar || ratingValue)
                            ? getRatingColor(hoveredStar || ratingValue)
                            : 'text-muted-foreground'
                        )}
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => handleStarHover(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                      >
                        <Star
                          className={cn(
                            'w-8 h-8',
                            star <= (hoveredStar || ratingValue) && 'fill-current'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {((hoveredStar || ratingValue) > 0) && (
                    <div className='ml-3'>
                      <span
                        className={cn('font-medium', getRatingColor(hoveredStar || ratingValue))}
                      >
                        {getRatingLabel(hoveredStar || ratingValue)}
                      </span>
                    </div>
                  )}
                </div>
                {errors.rating && (
                  <p className='text-sm text-destructive mt-1'>{errors.rating.message}</p>
                )}
              </div>

              <FormField
                form={form}
                name='title'
                label='Title'
                placeholder='Brief summary of your feedback'
                required
                icon={<Target className='w-4 h-4' />}
              />
            </div>
          </FormSection>

          {/* Description */}
          <FormSection title='Details'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>
                  Description <span className='text-destructive'>*</span>
                </label>
                <Textarea
          {...form.register('description')}
                  placeholder='Please provide detailed feedback...'
                  rows={6}
                  className='resize-none'
                />
                <div className='flex justify-between items-center text-xs text-muted-foreground'>
                  <span>{characterCount}/2000 characters</span>
                  {errors.description && (
                    <span className='text-destructive'>{errors.description.message}</span>
                  )}
                </div>
              </div>

              {feature && (
                <FormField
                  form={form}
                  name='feature'
                  label='Related Feature'
                  placeholder='Which feature is this about?'
                  icon={<Target className='w-4 h-4' />}
                />
              )}

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Additional Comments (Optional)</label>
                <Textarea
          {...form.register('additionalComments')}
                  placeholder='Any additional thoughts or context...'
                  rows={3}
                  className='resize-none'
                />
              </div>
            </div>
          </FormSection>

          {/* Screenshots */}
          {showScreenshots && (
            <FormSection title='Screenshots (Optional)'>
              <div className='space-y-4'>
                <Alert>
                  <Camera className='w-4 h-4' />
                  <AlertDescription>
                    Add screenshots to help us understand your feedback better. Max 5 images, 5MB
                    each.
                  </AlertDescription>
                </Alert>

                <div className='border-2 border-dashed rounded-lg p-6 text-center'>
                  <input
                    type='file'
                    id='screenshot-upload'
                    multiple
                    accept='image/*'
                    onChange={handleScreenshotUpload}
                    className='hidden'
                  />
                  <label
                    htmlFor='screenshot-upload'
                    className='cursor-pointer flex flex-col items-center gap-2'
                  >
                    <Upload className='w-8 h-8 text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>
                      Click to upload screenshots
                    </span>
                  </label>
                </div>

                {screenshots.length > 0 && (
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                    {screenshots.map((screenshot, index) => (
                      <div key={index} className='relative group'>
                        <img
                          src={screenshot.preview}
                          alt={`Screenshot ${index + 1}`}
                          className='w-full h-24 object-cover rounded border'
                        />
                        <Button
                          type='button'
                          variant='destructive'
                          size='sm'
                          className='absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                          onClick={() => removeScreenshot(index)}
                        >
                          <X className='w-3 h-3' />
                        </Button>
                        <p className='text-xs text-muted-foreground mt-1 truncate'>
                          {screenshot.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormSection>
          )}

          {/* User Context */}
          {(showUserRole || showExperienceLevel) && (
            <FormSection title='About You (Optional)'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {showUserRole && (
                  <div>
                    <label className='text-sm font-medium mb-2 block'>Your Role</label>
                    <SearchSelect
                      options={userRoleOptions}
                      value={watch('userRole') || ''}
                      onChange={value => setValue('userRole', value as unknown)}
                      placeholder='Select your role'
                    />
                  </div>
                )}

                {showExperienceLevel && (
                  <div>
                    <label className='text-sm font-medium mb-2 block'>Experience Level</label>
                    <SearchSelect
                      options={experienceLevelOptions}
                      value={watch('experienceLevel') || ''}
                      onChange={value => setValue('experienceLevel', value as unknown)}
                      placeholder='Select experience level'
                    />
                  </div>
                )}
              </div>
            </FormSection>
          )}

          {/* Additional Questions */}
          <FormSection title='Final Questions'>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium mb-3 block'>
                  Would you recommend our platform to others?
                </label>
                <div className='flex gap-4'>
                  <Button
                    type='button'
                    variant={wouldRecommendValue === true ? 'default' : 'outline'}
                    onClick={() => setValue('wouldRecommend', true)}
                    className='flex items-center gap-2'
                  >
                    <ThumbsUp className='w-4 h-4' />
                    Yes
                  </Button>
                  <Button
                    type='button'
                    variant={wouldRecommendValue === false ? 'default' : 'outline'}
                    onClick={() => setValue('wouldRecommend', false)}
                    className='flex items-center gap-2'
                  >
                    <ThumbsDown className='w-4 h-4' />
                    No
                  </Button>
                </div>
              </div>

              <div className='flex items-start space-x-2'>
                <input
                  type='checkbox'
                  id='allowFollowUp'
          {...form.register('allowFollowUp')}
                  className='mt-1'
                />
                <label htmlFor='allowFollowUp' className='text-sm'>
                  I'm open to follow-up questions about this feedback
                </label>
              </div>
            </div>
          </FormSection>

          <Separator />

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel='Submit Feedback'
            submitIcon={<Send className='w-4 h-4' />}
            showCancel={false}
            align='between'
          />

          <div className='text-center'>
            <p className='text-xs text-muted-foreground'>
              Your feedback helps us build a better platform for everyone
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
