import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  eventFormSchema,
  eventFormDefaults,
  EventFormValues,
} from '@/lib/validations/eventValidation';
import {
  FormField,
  FormSection,
  DatePicker,
  RichTextEditor,
  SearchSelect,
  SearchSelectOption,
} from '@/components/forms/shared';
import ImageUpload from '@/components/forms/ImageUpload';
import VenueSearchSelect from '@/components/forms/VenueSearchSelect';
import { EventCategory, EventType } from '@/lib/types/event';
import {
  Calendar,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  Settings,
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  Clock,
  Users,
  X,
  AlertCircle,
  Info,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  icon: React.ComponentType<any>;
  estimatedTime: string;
  complexity: 'simple' | 'moderate' | 'advanced';
  features: string[];
  color: string;
}

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  capacity?: number | undefined;
  rating?: number | undefined;
  price_range?: string | undefined;
  venue_type?: string | undefined;
  image_url?: string | undefined;
  amenities?: string[] | undefined;
  description?: string | undefined;
}

interface CreateEventWizardProps {
  template?: QuickTemplate | undefined| null;
  onComplete: (eventId: string) => void;
  onCancel: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  required: boolean;
  estimatedTime: string;
}

export const CreateEventWizard: React.FC<CreateEventWizardProps> = ({
  template,
  onComplete,
  onCancel,
}) => {
  const { user } = useAuth();
  const { track } = useAnalytics('event_wizard', 'Event Creation Wizard');
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const wizardSteps: WizardStep[] = [
    {
      id: 'basics',
      title: 'Event Basics',
      description: 'Core information about your event',
      icon: Info,
      required: true,
      estimatedTime: '3 min',
    },
    {
      id: 'schedule',
      title: 'Date & Location',
      description: 'When and where it happens',
      icon: Calendar,
      required: true,
      estimatedTime: '2 min',
    },
    {
      id: 'pricing',
      title: 'Pricing & Goals',
      description: 'Set your funding target',
      icon: DollarSign,
      required: true,
      estimatedTime: '3 min',
    },
    {
      id: 'media',
      title: 'Images & Branding',
      description: 'Make it visually appealing',
      icon: ImageIcon,
      required: false,
      estimatedTime: '2 min',
    },
    {
      id: 'settings',
      title: 'Final Settings',
      description: 'Privacy and advanced options',
      icon: Settings,
      required: false,
      estimatedTime: '1 min',
    },
  ];

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      ...eventFormDefaults,
      // Apply template defaults if provided
      ...(template && {
        category: template.category as EventCategory,
        type: template.type as EventType,
        title: `My ${template.title}`,
      }),
    },
  });

  // Auto-save functionality
  const saveProgress = useCallback(async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const formData = form.getValues();
      const draftData = {
        ...formData,
        ...(template && {
          templateId: template.id,
          currentStep,
          completedSteps: Array.from(completedSteps),
          lastSaved: new Date().toISOString()
        }),
      };

      localStorage.setItem('eventWizardDraft', JSON.stringify(draftData));

      track('wizard_auto_saved', { step: currentStep, ...(template && { template: template.id }) });

    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }

  }, [form, currentStep, completedSteps, template?.id, user?.id, track]);

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      autosaveTimeoutRef.current = setTimeout(saveProgress, 1000);
    });

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [form, saveProgress]);

  // Load saved draft on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('eventWizardDraft');
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft) as any;
        if (draftData.templateId === template?.id) {
          const shouldRestore = window.confirm(
            'You have a saved draft for this event type. Would you like to continue where you left off?'
          );

          if (shouldRestore) {
            form.reset(draftData);
            setCurrentStep(draftData.currentStep || 0);
            setCompletedSteps(new Set(draftData.completedSteps || []));
            toast.success('Draft restored!');
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore draft:', error);
    }
  }, [form, template?.id]);

  const validateCurrentStep = useCallback((): boolean => {
    const values = form.getValues();
    const errors = form.formState.errors;

    switch (currentStep) {
      case 0: // Basics
        return !!(values.title && values.description && values.category && !errors.title && !errors.description);
      case 1: // Schedule
        return !!(values.startDate && values.location && !errors.startDate && !errors.location);
      case 2: // Pricing
        return !!(values.targetAmount && !errors.targetAmount);
      case 3: // Media
        return true; // Optional step
      case 4: // Settings
        return true; // Optional step
      default:
        return false;
    }
  }, [form, currentStep]);

  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => Math.min(wizardSteps.length - 1, prev + 1));

      track('wizard_step_completed', { step: currentStep, ...(template && { template: template.id }) });

    } else {
      toast.error('Please complete all required fields before continuing');
    }
  }, [validateCurrentStep, currentStep, wizardSteps.length, track, template?.id]);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const handleStepClick = useCallback((stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  }, [currentStep, completedSteps]);

  const handleSubmit = async (values: EventFormValues) => {
    try {
      setIsSubmitting(true);

      if (!user?.id) {
        toast.error('You must be logged in to create an event');
        return;
      }

      track('event_creation_started', {
        ...(template && { template: template.id }),
        category: values.category,
        type: values.type,
      });

      // Prepare event data for Supabase
      const eventData = {
        title: values.title,
        description: values.description,
        short_description: values.shortDescription,
        category: values.category,
        event_type: values.type,
        start_date: values.startDate.toISOString(),
        end_date: values.endDate?.toISOString() || null,
        location: values.location,
        creator_id: user.id,
        max_capacity: values.capacity,
        is_public: !values.isPrivate,
        is_free: values.isFree,
        price: values.price ? Math.round(values.price * 100) : null,
        target_amount: values.targetAmount ? Math.round(values.targetAmount * 100) : null,
        status: 'published',
        banner_image: values.bannerImage,
        tags: values.tags || [],
        is_all_or_nothing: true,
        current_amount: 0,
        attendees_count: 0,
        available_tickets: values.capacity || null,
        funding_status: 'active',
        metadata: {
          ...(template && { wizardTemplate: template.id }),
          venueId: values.venueId,
          images: values.images,
        },
      };

      const { data: event, error } = await supabase
        .from('events')
        .insert(eventData)
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create event: ${error.message}`);
      }

      if (!event) {
        throw new Error('No event data returned');
      }

      // Clear the saved draft
      localStorage.removeItem('eventWizardDraft');

      const typedEvent = event as any;

      track('event_created_successfully', {
        eventId: typedEvent.id,
        ...(template && { template: template.id }),
        stepsCompleted: completedSteps.size,
      });

      toast.success('Event created successfully!');

      onComplete(typedEvent.id);

    } catch (error) {
      console.error('Event creation failed:', error);
      track('event_creation_failed', {
        error: (error as Error).message,
        ...(template && { template: template.id }),
      });

      toast.error(`Failed to create event: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / wizardSteps.length) * 100;
  const currentStepData = wizardSteps[currentStep];

  const categoryOptions: SearchSelectOption[] = Object.entries(EventCategory).map(
    ([key, value]) => ({
      value,
      label: key.replace(/([A-Z])/g, ' $1').trim(),
      description: `Events in the ${key.toLowerCase()} category`,
    })
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {template ? `Create ${template.title}` : 'Create Custom Event'}
              </h1>
              <p className="text-muted-foreground">
                Step {currentStep + 1} of {wizardSteps.length}: {currentStepData.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3 animate-spin" />
                Saving...
              </div>
            )}
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {wizardSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <Button
                  variant={index === currentStep ? "default" : completedSteps.has(index) ? "secondary" : "outline"}
                  size="sm"
                  className={cn(
                    "w-10 h-10 rounded-full p-0",
                    index <= currentStep || completedSteps.has(index) ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  )}
                  onClick={() => handleStepClick(index)}
                  disabled={index > currentStep && !completedSteps.has(index)}
                >
                  {completedSteps.has(index) ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </Button>
                {index < wizardSteps.length - 1 && (
                  <div className={cn(
                    "h-px w-8 mx-2",
                    completedSteps.has(index) ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <currentStepData.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{currentStepData.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentStepData.description} • Est. {currentStepData.estimatedTime}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {currentStep === 0 && (
                  <div className="space-y-6">
                    {template && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <Zap className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Template Selected:</strong> {template.title} - Pre-configured settings have been applied. You can customize everything to fit your needs.
                        </AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      form={form}
                      name="title"
                      label="Event Title"
                      placeholder="Give your event a compelling title"
                      required
                    />

                    <FormField
                      form={form}
                      name="shortDescription"
                      label="Short Description"
                      placeholder="Brief summary that appears in event listings"
                      type="textarea"
                      rows={2}
                      required
                    />

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Full Description <span className="text-destructive">*</span>
                      </label>
                      <RichTextEditor
                        value={form.watch('description') || ''}
                        onChange={value => form.setValue('description', value)}
                        placeholder="Provide detailed information about your event"
                        minHeight="200px"
                      />
                      {form.formState.errors.description && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Category <span className="text-destructive">*</span>
                        </label>
                        <SearchSelect
                          options={categoryOptions}
                          value={form.watch('category')}
                          onChange={value => form.setValue('category', value as EventCategory)}
                          placeholder="Select event category"
                        />
                        {form.formState.errors.category && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.category.message}
                          </p>
                        )}
                      </div>

                      <FormField
                        form={form}
                        name="capacity"
                        label="Expected Attendance"
                        type="number"
                        placeholder="How many people do you expect?"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Start Date & Time <span className="text-destructive">*</span>
                        </label>
                        <DatePicker
                          value={form.watch('startDate')}
                          onChange={date => form.setValue('startDate', date!)}
                          placeholder="When does your event start?"
                          minDate={new Date()}
                          showTime
                        />
                        {form.formState.errors.startDate && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.startDate.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">End Date & Time</label>
                        <DatePicker
                          value={form.watch('endDate') || undefined}
                          onChange={date => form.setValue('endDate', date || null)}
                          placeholder="When does it end? (optional)"
                          minDate={form.watch('startDate') || new Date()}
                          showTime
                        />
                      </div>
                    </div>

                    <FormField
                      form={form}
                      name="location"
                      label="Location"
                      placeholder="Where is your event taking place?"
                      required
                    />

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Select Venue (Optional)
                      </label>
                      <VenueSearchSelect
                        value={form.watch('venueId')}
                        onSelect={(venue: Venue) => {
                          form.setValue('venueId', venue.id);
                          if (venue.address && !form.watch('location')) {
                            form.setValue('location', venue.address);
                          }
                        }}
                        placeholder="Search for a venue or use custom location above"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>All-or-Nothing Funding:</strong> Set a funding goal. Attendees reserve tickets but are only charged if you reach your goal by the deadline.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        form={form}
                        name="targetAmount"
                        label="Funding Goal"
                        type="number"
                        placeholder="How much do you need to raise?"
                        required
                      />

                      <FormField
                        form={form}
                        name="price"
                        label="Ticket Price"
                        type="number"
                        placeholder="Price per ticket"
                        description="Leave empty for free events"
                      />
                    </div>

                    <FormField
                      form={form}
                      name="isFree"
                      label="This is a free event"
                      type="switch"
                      description="No charge for attendance"
                    />

                    {form.watch('targetAmount') && form.watch('price') && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2">Funding Summary</h4>
                        <div className="text-sm text-green-700 space-y-1">
                          <p>• Goal: ${form.watch('targetAmount')?.toLocaleString()}</p>
                          <p>• Ticket Price: ${form.watch('price')}</p>
                          <p>• Tickets Needed: {Math.ceil((form.watch('targetAmount') || 0) / (form.watch('price') || 1))}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Banner Image <span className="text-destructive">*</span>
                      </label>
                      <ImageUpload
                        value={form.watch('bannerImage')}
                        onChange={url => form.setValue('bannerImage', url)}
                        className="h-48"
                        placeholder="Upload a compelling banner image (1920x480 recommended)"
                      />
                      {form.formState.errors.bannerImage && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.bannerImage.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Additional Images (Optional)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {form.watch('images')?.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Event image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                const images = form.getValues('images') || [];
                                form.setValue('images', images.filter((_, i) => i !== index));
                              }}
                              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}

                        {(form.watch('images') || []).length < 5 && (
                          <ImageUpload
                            onChange={url => {
                              const images = form.getValues('images') || [];
                              form.setValue('images', [...images, url]);
                            }}
                            className="h-32"
                            placeholder="Add image"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <FormField
                      form={form}
                      name="isPrivate"
                      label="Private Event"
                      type="switch"
                      description="Only people with the link can see and register"
                    />

                    <FormField
                      form={form}
                      name="requiresApproval"
                      label="Require Manual Approval"
                      type="switch"
                      description="Review each registration before accepting"
                    />

                    <FormField
                      form={form}
                      name="ageRestriction"
                      label="Minimum Age"
                      type="number"
                      placeholder="Leave empty for all ages"
                    />

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Ready to Launch!</h4>
                      <p className="text-sm text-yellow-700">
                        Your event will be published immediately after creation. You can always edit these settings later.
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < wizardSteps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isSubmitting}
                className="px-8"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating Event...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};