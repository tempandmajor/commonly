import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  useKeyboardShortcuts,
  createSaveShortcut,
  createSubmitShortcut,
  createNavigationShortcuts,
} from '@/hooks/useKeyboardShortcuts';
import { useFormUndoRedo } from '@/hooks/useFormUndoRedo';
import {
  FormField,
  FormSection,
  FormProgress,
  FormActions,
  DatePicker,
  RichTextEditor,
  SearchSelect,
  SearchSelectOption,
} from '@/components/forms/shared';
import ImageUpload from '@/components/forms/ImageUpload';
import { TourSettings } from '@/components/forms/event/TourSettings';
import { CollaboratorManager } from '@/components/forms/event/CollaboratorManager';
import { SponsorshipTierManager } from '@/components/forms/event/SponsorshipTierManager';
import { EnhancedFormValidation } from '@/components/forms/event/EnhancedFormValidation';
import {
  eventFormSchema,
  eventFormDefaults,
  EventFormValues,
  EnhancedEventType,
} from '@/lib/validations/eventValidation';
import { EventCategory, EventType } from '@/lib/types/event';
import {
  Calendar,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  Settings,
  Ticket,
  Trophy,
  Share2,
  X,
  Undo,
  Redo,
  Keyboard,
  Info,
  Video,
  Globe,
  Music,
  BarChart3,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VenueSearchSelect from '@/components/forms/VenueSearchSelect';

// Add venue type interface
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

const CreateEventForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { track } = useAnalytics('create_event', 'Create Event');
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const autosaveTimeoutRef = useRef<number | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: eventFormDefaults,
  });

  // Undo/Redo functionality
  const { undo, redo, canUndo, canRedo, resetHistory } = useFormUndoRedo(form);

  const steps = [
    { id: 'basic', name: 'Basic Info', description: 'Event details and description', icon: Info },
    { id: 'datetime', name: 'Date & Location', description: 'When and where', icon: Calendar },
    { id: 'pricing', name: 'Pricing & Tickets', description: 'Set up ticketing', icon: Ticket },
    { id: 'media', name: 'Media', description: 'Images and branding', icon: ImageIcon },
    { id: 'settings', name: 'Settings', description: 'Advanced options', icon: Settings },
  ];

  // Initialize step from URL (?step=n)
  useEffect(() => {
    const spStep = searchParams.get('step');
    if (spStep !== null) {
      const parsed = Number(spStep) as number;
      if (!Number.isNaN(parsed)) {
        const clamped = Math.max(0, Math.min(steps.length - 1, parsed));
        if (clamped !== currentStep) setCurrentStep(clamped);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Persist step to URL
  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    sp.set('step', String(currentStep));
    setSearchParams(sp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Draft autosave key
  const draftKey = 'eventFormDraft';

  // Restore draft prompt on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { values?: EventFormValues; step?: number };
      if (!parsed || !parsed.values) return;
      const shouldRestore = window.confirm('Restore your saved event draft?');
      if (shouldRestore) {
        form.reset(parsed.values);
        const stepToRestore = Math.max(0, Math.min(steps.length - 1, Number(parsed.step) as number || 0));
        setCurrentStep(stepToRestore);
        const sp = new URLSearchParams(searchParams);
        sp.set('step', String(stepToRestore));
        setSearchParams(sp);
        toast.success('Draft restored');
      }
    } catch (e) {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave on form changes with debounce
  useEffect(() => {
    const subscription = form.watch(values => {
      if (autosaveTimeoutRef.current) window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = window.setTimeout(() => {
        try {
          localStorage.setItem(draftKey, JSON.stringify({ values, step: currentStep }));
        } catch (e) {
          // storage may be full or unavailable
        }
      }, 500);
    });
    return () => {
      if (autosaveTimeoutRef.current) window.clearTimeout(autosaveTimeoutRef.current);
      subscription.unsubscribe();
    };
  }, [form, currentStep]);

  const handleSubmit = async (values: EventFormValues) => {
    try {
      setIsSubmitting(true);

      if (!user?.id) {
        toast.error('You must be logged in to create an event');
        return;
      }

      track('event_create_attempt', {
        category: values.category,
        type: values.type,
        isVirtual: values.type === EventType.VirtualEvent || values.type === EventType.Hybrid,
      });

      // Prepare data for Supabase insertion
      const eventData = {
        title: values.title,
        description: values.description,
        short_description: values.shortDescription,
        category: values.category,
        event_type: values.type,
        enhanced_type: values.enhancedType,
        start_date: values.startDate.toISOString(),
        end_date: values.endDate?.toISOString() || null,
        location: values.location,
        creator_id: user.id,
        max_capacity: values.capacity,
        is_public: !values.isPrivate,
        is_free: values.isFree,
        price: values.price ? Math.round(values.price * 100) : null, // Convert to cents
        status: 'published',
        banner_image: values.bannerImage,
        tags: values.tags,
        is_all_or_nothing: values.isAllOrNothing,
        pledge_deadline: values.campaignSettings?.deadlineDate?.toISOString() || null,
        current_amount: 0,
        attendees_count: 0,
        available_tickets: values.capacity || null,
        funding_status: 'active',
        referral_enabled: values.referralSettings?.enabled || false,
        referral_commission_type: values.referralSettings?.commissionType || null,
        referral_commission_amount: values.referralSettings?.commissionAmount || null,
        sponsorship_enabled: values.sponsorshipEnabled || false,
        metadata: {
          venueId: values.venueId,
          virtualEventDetails: values.virtualEventDetails
            ? {
          ...values.virtualEventDetails,
                streamSchedule: values.virtualEventDetails.streamSchedule
                  ? {
          ...values.virtualEventDetails.streamSchedule,
                      startTime: values.virtualEventDetails.streamSchedule.startTime?.toISOString(),
          ...(values.virtualEventDetails.streamSchedule.recurringEndDate && {
                        recurringEndDate: values.virtualEventDetails.streamSchedule.recurringEndDate.toISOString()
                      }),
                    }
                  : undefined,
              }

            : undefined,

          tourDetails: values.tourDetails,

          ticketSettings: values.ticketSettings,

          referralSettings: values.referralSettings,

          sponsorshipTiers: values.sponsorshipTiers,

          collaborators: values.collaborators,

        },

      };

      // Insert event into database
      const { data: event, error } = await supabase
        .from('events')
        .insert(eventData)
        .select('id')
        .single();

      if (error) {
        throw new Error(`Error creating event: ${error.message}`);
      }

      if (!event) {
        throw new Error('Failed to create event');
      }

      // Note: Ticket types and collaborators are stored in metadata for now
      // These can be moved to separate tables when they are created in the database

      const typedEvent = event as any;
      track('event_created', {
        category: values.category,
        type: values.type,
        eventId: typedEvent.id,
      });

      // Remove draft from local storage if it exists
      localStorage.removeItem('eventFormDraft');

      toast.success('Event created successfully!');
      resetHistory();
      navigate(`/events/${typedEvent.id}`);

    } catch (error) {
      track('event_create_error', { error: (error as Error).message });
      toast.error('Failed to create event: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }

  };

  const handleSaveDraft = () => {
    const values = form.getValues();
    localStorage.setItem('eventFormDraft', JSON.stringify(values));
    toast.success('Draft saved!');
  };

  const nextStep = () => setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
  const prevStep = () => setCurrentStep(Math.max(0, currentStep - 1));

  // Keyboard shortcuts
  const { getShortcutsList } = useKeyboardShortcuts([
    createSaveShortcut(handleSaveDraft),
    createSubmitShortcut(() => {
      if (currentStep === steps.length - 1) {
        form.handleSubmit(handleSubmit)();
      }
    }),
          ...createNavigationShortcuts(nextStep, prevStep),
    {
      key: '/',
      callback: () => setShowShortcuts(!showShortcuts),
      description: 'Toggle shortcuts help',
    },
  ]);

  // Tag management
  const addTag = () => {
    const currentTags = form.getValues('tags') || [];
    const trimmedTag = tagInput.trim().toLowerCase();

    if (trimmedTag && !currentTags.includes(trimmedTag) && currentTags.length < 10) {
      form.setValue('tags', [...currentTags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue(
      'tags',
      currentTags.filter(tag => tag !== tagToRemove)
    );
  };

  // Options for select fields
  const categoryOptions: SearchSelectOption[] = Object.entries(EventCategory).map(
    ([key, value]) => ({
      value: value,
      label: key.replace(/([A-Z])/g, ' $1').trim(),
      description: `Events in the ${key.toLowerCase()} category`,
    })
  );

  const enhancedTypeOptions: SearchSelectOption[] = Object.entries(EnhancedEventType).map(
    ([key, value]) => ({
      value: value,
      label: key.replace(/([A-Z])/g, ' $1').trim(),
      description: getEventTypeDescription(value),
      icon: getEventTypeIcon(value),
    })
  );

  const getEventTypeDescription = (type: EnhancedEventType): string => {
    switch (type) {
      case EnhancedEventType.OneTime:
        return 'Single event happening once';
      case EnhancedEventType.Tour:
        return 'Multiple events across different locations';
      case EnhancedEventType.Series:
        return 'Related events happening over time';
      case EnhancedEventType.Recurring:
        return 'Events that repeat on a schedule';
      case EnhancedEventType.VirtualEvent:
        return 'Online-only event';
      case EnhancedEventType.Hybrid:
        return 'Both in-person and virtual attendance';
      case EnhancedEventType.Workshop:
        return 'Educational or skill-building session';
      case EnhancedEventType.Conference:
        return 'Professional or academic gathering';
      case EnhancedEventType.Festival:
        return 'Multi-day celebration or showcase';
      case EnhancedEventType.Meetup:
        return 'Casual community gathering';
      case EnhancedEventType.Webinar:
        return 'Educational online presentation';
      case EnhancedEventType.Livestream:
        return 'Live streaming event';
      default:
        return 'Select event type';
    }
  };

  const getEventTypeIcon = (type: EnhancedEventType) => {
    switch (type) {
      case EnhancedEventType.VirtualEvent:
      case EnhancedEventType.Webinar:
      case EnhancedEventType.Livestream:
        return <Video className='h-4 w-4' />;
      case EnhancedEventType.Hybrid:
        return <Globe className='h-4 w-4' />;
      case EnhancedEventType.Workshop:
        return <Settings className='h-4 w-4' />;
      case EnhancedEventType.Festival:
        return <Music className='h-4 w-4' />;
      default:
        return null;
    }
  };

  const watchEventType = form.watch('type');
  const watchIsFree = form.watch('isFree');
  const watchSponsorshipEnabled = form.watch('sponsorshipEnabled');
  const isVirtualOrHybrid =
    watchEventType === EventType.VirtualEvent || watchEventType === EventType.Hybrid;
  const isTour = watchEventType === EventType.Tour;

  // Campaign duration options
  const campaignDurationOptions = [
    { value: '15', label: '15 Days', description: 'Quick campaign for urgent events' },
    { value: '30', label: '30 Days', description: 'Standard campaign duration (recommended)' },
    { value: '45', label: '45 Days', description: 'Extended campaign for larger events' },
    { value: '60', label: '60 Days', description: 'Long campaign for major events' },
    { value: '90', label: '90 Days', description: 'Maximum campaign duration' },
  ];

  // Calculate deadline date when duration changes
  const handleDurationChange = (duration: '15' | '30' | '45' | '60' | '90') => {
    const days = parseInt(duration);
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + days);
    form.setValue('campaignSettings.deadlineDate', deadlineDate);
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
      {/* Main Form */}
      <div className='lg:col-span-3'>
        {/* Header with undo/redo */}
        <div className='flex items-center justify-between mb-8'>
          <h2 className='text-2xl font-bold'>Event Details</h2>
          <div className='flex items-center gap-2'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={undo}
                    disabled={!canUndo}
                  >
                    <Undo className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={redo}
                    disabled={!canRedo}
                  >
                    <Redo className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo (Ctrl+Y)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => setShowShortcuts(!showShortcuts)}
                  >
                    <Keyboard className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard Shortcuts (/)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => setShowValidationPanel(!showValidationPanel)}
                  >
                    <BarChart3 className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Validation Panel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Keyboard shortcuts help */}
        {showShortcuts && (
          <Card className='mb-6 p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <Info className='h-4 w-4' />
              <h3 className='font-medium'>Keyboard Shortcuts</h3>
            </div>
            <div className='grid grid-cols-2 gap-2 text-sm'>
              {getShortcutsList().map((shortcut, index) => (
                <div key={index} className='flex justify-between'>
                  <span className='text-muted-foreground'>{shortcut.description}</span>
                  <kbd className='bg-muted px-2 py-1 rounded text-xs font-mono'>
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </Card>
        )}

        <FormProgress steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-8'>
            {currentStep === 0 && (
              <>
                <FormSection
                  title='Basic Information'
                  description='Tell attendees about your event'
                >
                  <div className='space-y-6'>
                    <FormField
                      form={form}
                      name='title'
                      label='Event Title'
                      placeholder='Give your event a clear, descriptive title'
                      required
                    />

                    <FormField
                      form={form}
                      name='shortDescription'
                      label='Short Description'
                      placeholder='Brief summary for event listings'
                      type='textarea'
                      rows={2}
                      required
                    />

                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        Full Description <span className='text-destructive'>*</span>
                      </label>
                      <RichTextEditor
                        value={form.watch('description') || ''}
                        onChange={value => form.setValue('description', value)}
                        placeholder='Provide detailed information about your event'
                        minHeight='300px'
                      />
                      {form.formState.errors.description && (
                        <p className='text-sm text-destructive mt-1'>
                          {form.formState.errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <label className='text-sm font-medium mb-2 block'>
                          Category <span className='text-destructive'>*</span>
                        </label>
                        <SearchSelect
                          options={categoryOptions}
                          value={form.watch('category')}
                          onChange={value => form.setValue('category', value as EventCategory)}
                          placeholder='Select event category'
                        />
                        {form.formState.errors.category && (
                          <p className='text-sm text-destructive mt-1'>
                            {form.formState.errors.category.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className='text-sm font-medium mb-2 block'>
                          Event Type <span className='text-destructive'>*</span>
                        </label>
                        <SearchSelect
                          options={enhancedTypeOptions}
                          value={form.watch('enhancedType')}
                          onChange={value =>
                            form.setValue('enhancedType', value as EnhancedEventType)
                          }
                          placeholder='Select specific event type'
                        />
                        {form.formState.errors.enhancedType && (
                          <p className='text-sm text-destructive mt-1'>
                            {form.formState.errors.enhancedType.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className='text-sm font-medium mb-2 block'>Tags (max 10)</label>
                      <div className='flex gap-2 mb-2 flex-wrap'>
                        {form.watch('tags')?.map(tag => (
                          <Badge key={tag} variant='secondary'>
                            {tag}
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='h-4 w-4 ml-1'
                              onClick={() => removeTag(tag)}
                            >
                              <X className='h-3 w-3' />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <div className='flex gap-2'>
                        <Input
                          value={tagInput}
                          onChange={e => setTagInput((e.target as HTMLInputElement).value)}
                          placeholder='Add a tag'
                          onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button
                          type='button'
                          variant='outline'
                          onClick={addTag}
                          disabled={!tagInput.trim() || form.watch('tags')?.length >= 10}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </FormSection>

                {isVirtualOrHybrid && (
                  <FormSection
                    title='Virtual Event Settings'
                    description='Configure your online event with professional streaming features'
                    icon={<Video className='h-5 w-5' />}
                  >
                    <div className='space-y-6'>
                      <Alert className='bg-blue-50 border-blue-200'>
                        <Video className='h-4 w-4' />
                        <AlertDescription>
                          <strong>Professional Streaming:</strong> Virtual events use our integrated
                          livestreaming platform powered by LiveKit. Features include HD streaming,
                          recording, interactive chat, screen sharing, and real-time audience
                          engagement.
                        </AlertDescription>
                      </Alert>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                          <label className='text-sm font-medium mb-2 block'>
                            Streaming Platform <span className='text-destructive'>*</span>
                          </label>
                          <SearchSelect
                            options={[
                              {
                                value: 'commonly-live',
                                label: 'Commonly Live',
                                description: 'Our integrated streaming platform (Recommended)',
                              },
                              {
                                value: 'zoom',
                                label: 'Zoom',
                                description: 'Popular video conferencing',
                              },
                              {
                                value: 'teams',
                                label: 'Microsoft Teams',
                                description: 'Enterprise solution',
                              },
                              {
                                value: 'youtube',
                                label: 'YouTube Live',
                                description: 'Public streaming to YouTube',
                              },
                              {
                                value: 'twitch',
                                label: 'Twitch',
                                description: 'Gaming and creative content',
                              },
                              {
                                value: 'facebook',
                                label: 'Facebook Live',
                                description: 'Stream to Facebook audience',
                              },
                              {
                                value: 'custom',
                                label: 'Custom Platform',
                                description: 'Your own streaming solution',
                              },
                            ]}
                            value={form.watch('virtualEventDetails.platform')}
                            onChange={value => {
                              if (typeof value === 'string') {
                                form.setValue('virtualEventDetails.platform', value);
                              }
                            }}
                            placeholder='Select streaming platform'
                          />
                        </div>

                        <FormField
                          form={form}
                          name='virtualEventDetails.url'
                          label='External Stream URL (Optional)'
                          placeholder='https://example.com/stream'
                        />
                      </div>

                      <FormSection
                        title='Stream Configuration'
                        description='Technical settings for your live stream'
                      >
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div className='space-y-4'>
                            <FormField
                              form={form}
                              name='virtualEventDetails.streamConfiguration.quality'
                              label='Stream Quality'
                              type='select'
                              options={[
                                { value: 'low', label: 'Low Quality (480p) - Good for mobile' },
                                {
                                  value: 'standard',
                                  label: 'Standard Quality (720p) - Recommended',
                                },
                                { value: 'high', label: 'High Quality (1080p) - Best experience' },
                              ]}
                            />

                            <FormField
                              form={form}
                              name='virtualEventDetails.streamConfiguration.maxViewers'
                              label='Maximum Viewers'
                              type='number'
                              placeholder='1000'
                            />
                          </div>

                          <div className='space-y-4'>
                            <FormField
                              form={form}
                              name='virtualEventDetails.streamConfiguration.recordingEnabled'
                              label='Enable Recording'
                              type='switch'
                            />

                            <FormField
                              form={form}
                              name='virtualEventDetails.streamConfiguration.waitingRoomEnabled'
                              label='Enable Waiting Room'
                              type='switch'
                            />
                          </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-4'>
                          <FormField
                            form={form}
                            name='virtualEventDetails.streamConfiguration.chatEnabled'
                            label='Enable Live Chat'
                            type='switch'
                          />

                          <FormField
                            form={form}
                            name='virtualEventDetails.streamConfiguration.audienceInteractionEnabled'
                            label='Audience Interaction'
                            type='switch'
                          />
                        </div>
                      </FormSection>

                      <FormSection
                        title='Stream Schedule'
                        description='When will your stream go live?'
                      >
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div>
                            <label className='text-sm font-medium mb-2 block'>
                              Stream Start Time
                            </label>
                            <DatePicker
                              value={form.watch('virtualEventDetails.streamSchedule.startTime')}
                              onChange={date =>
                                form.setValue('virtualEventDetails.streamSchedule.startTime', date!)
                              }
                              placeholder='When will streaming begin?'
                              minDate={new Date()}
                              showTime
                            />
                            <p className='text-sm text-muted-foreground mt-1'>
                              This can be different from your event start time
                            </p>
                          </div>

                          <FormField
                            form={form}
                            name='virtualEventDetails.streamSchedule.estimatedDuration'
                            label='Estimated Duration (minutes)'
                            type='number'
                            placeholder='60'
                          />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-4'>
                          <FormField
                            form={form}
                            name='virtualEventDetails.streamSchedule.isRecurring'
                            label='Recurring Stream'
                            type='switch'
                          />

                          {form.watch('virtualEventDetails.streamSchedule.isRecurring') && (
                            <FormField
                              form={form}
                              name='virtualEventDetails.streamSchedule.recurrencePattern'
                              label='Recurrence Pattern'
                              type='select'
                              options={[
                                { value: 'daily', label: 'Daily' },
                                { value: 'weekly', label: 'Weekly' },
                                { value: 'monthly', label: 'Monthly' },
                              ]}
                            />
                          )}
                        </div>
                      </FormSection>

                      <div className='grid grid-cols-1 gap-6'>
                        <FormField
                          form={form}
                          name='virtualEventDetails.hostInstructions'
                          label='Host Instructions (Private)'
                          placeholder='Instructions for event hosts and speakers - only visible to organizers'
                          type='textarea'
                          rows={3}
                        />

                        <FormField
                          form={form}
                          name='virtualEventDetails.attendeeInstructions'
                          label='Attendee Instructions (Public)'
                          placeholder='Instructions for attendees to join and participate in the event'
                          type='textarea'
                          rows={3}
                        />
                      </div>

                      <Alert className='bg-green-50 border-green-200'>
                        <Video className='h-4 w-4' />
                        <AlertDescription>
                          <strong>Pro Tip:</strong> Use "Commonly Live" for the best experience with
                          built-in features like automatic recording, real-time analytics,
                          interactive polls, and seamless ticket integration.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </FormSection>
                )}

                {isTour && <TourSettings />}
              </>
            )}

            {currentStep === 1 && (
              <>
                <FormSection
                  title='Date & Time'
                  description='When is your event happening?'
                  icon={<Calendar className='h-5 w-5' />}
                >
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        Start Date & Time <span className='text-destructive'>*</span>
                      </label>
                      <DatePicker
                        value={form.watch('startDate')}
                        onChange={date => form.setValue('startDate', date!)}
                        placeholder='Select start date'
                        minDate={new Date()}
                        showTime
                      />
                      {form.formState.errors.startDate && (
                        <p className='text-sm text-destructive mt-1'>
                          {form.formState.errors.startDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className='text-sm font-medium mb-2 block'>End Date & Time</label>
                      <DatePicker
                        value={form.watch('endDate') || undefined}
                        onChange={date => form.setValue('endDate', date || null)}
                        placeholder='Select end date (optional)'
                        minDate={form.watch('startDate') || new Date()}
                        showTime
                      />
                      {form.formState.errors.endDate && (
                        <p className='text-sm text-destructive mt-1'>
                          {form.formState.errors.endDate.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <FormField
                    form={form}
                    name='timezone'
                    label='Timezone'
                    type='select'
                    options={[
                      {
                        value: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        label: 'Local Timezone',
                      },
                      { value: 'America/New_York', label: 'Eastern Time' },
                      { value: 'America/Chicago', label: 'Central Time' },
                      { value: 'America/Denver', label: 'Mountain Time' },
                      { value: 'America/Los_Angeles', label: 'Pacific Time' },
                      { value: 'Europe/London', label: 'London' },
                      { value: 'Europe/Paris', label: 'Paris' },
                      { value: 'Asia/Tokyo', label: 'Tokyo' },
                    ]}
                  />
                </FormSection>

                <FormSection
                  title='Location'
                  description='Where is your event taking place?'
                  icon={<MapPin className='h-5 w-5' />}
                >
                  <FormField
                    form={form}
                    name='location'
                    label={
                      isVirtualOrHybrid ? 'Physical Location (if applicable)' : 'Event Location'
                    }
                    placeholder='Enter address or venue name'
                    required={!isVirtualOrHybrid}
                  />

                  {/* Venue Selection with Search */}
                  <div>
                    <label className='text-sm font-medium mb-2 block'>
                      Select Venue (Optional)
                    </label>
                    <VenueSearchSelect
                      value={form.watch('venueId')}
                      onSelect={(venue: Venue) => {
                        form.setValue('venueId', venue.id);
                        // Auto-fill location if venue is selected
                        if (venue.address && !form.watch('location')) {
                          form.setValue('location', venue.address);
                        }
                      }}
                      placeholder='Search for a venue or add custom location above'
                      className='w-full'
                    />
                    <p className='text-xs text-muted-foreground mt-1'>
                      Choose from existing venues or enter a custom location above. Selecting a
                      venue may provide additional booking features.
                    </p>
                  </div>
                </FormSection>
              </>
            )}

            {currentStep === 2 && (
              <>
                <FormSection
                  title='Pricing'
                  description='Set up your event pricing'
                  icon={<DollarSign className='h-5 w-5' />}
                >
                  <div className='space-y-6'>
                    <FormField
                      form={form}
                      name='isFree'
                      label='Free Event'
                      type='switch'
                      description='This event is free to attend'
                    />

                    {!watchIsFree && (
                      <FormField
                        form={form}
                        name='price'
                        label='Ticket Price'
                        type='number'
                        placeholder='0.00'
                        required
                      />
                    )}

                    <FormSection
                      title='Campaign Settings'
                      description='Configure your all-or-nothing funding campaign'
                      icon={<Clock className='h-5 w-5' />}
                    >
                      <Alert className='bg-blue-50 border-blue-200 mb-6'>
                        <Info className='h-4 w-4' />
                        <AlertDescription>
                          <strong>All-or-Nothing Funding:</strong> Your event uses crowdfunding
                          where attendees reserve tickets but are only charged if you reach your
                          funding goal before the deadline. If the goal isn't reached, all
                          reservations are cancelled and no one is charged.
                        </AlertDescription>
                      </Alert>

                      <div className='space-y-6'>
                        <FormField
                          form={form}
                          name='targetAmount'
                          label='Funding Goal'
                          type='number'
                          placeholder='0.00'
                          description='Total amount needed to make your event happen'
                          required
                        />

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <div>
                            <label className='text-sm font-medium mb-2 block'>
                              Campaign Duration <span className='text-destructive'>*</span>
                            </label>
                            <SearchSelect
                              options={campaignDurationOptions}
                              value={form.watch('campaignSettings.duration')}
                              onChange={value => {
                                const typedValue = value as '15' | '30' | '45' | '60' | '90';
                                form.setValue('campaignSettings.duration', typedValue);
                                handleDurationChange(typedValue);
                              }}
                              placeholder='Select campaign duration'
                            />
                            {form.formState.errors.campaignSettings?.duration && (
                              <p className='text-sm text-destructive mt-1'>
                                {form.formState.errors.campaignSettings.duration.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className='text-sm font-medium mb-2 block'>
                              Campaign Deadline <span className='text-destructive'>*</span>
                            </label>
                            <DatePicker
                              value={form.watch('campaignSettings.deadlineDate')}
                              onChange={date =>
                                form.setValue('campaignSettings.deadlineDate', date!)
                              }
                              placeholder='Campaign ends on...'
                              minDate={new Date()}
                              maxDate={form.watch('startDate') || undefined}
                              disabled
                            />
                            <p className='text-xs text-muted-foreground mt-1'>
                              Automatically calculated based on duration
                            </p>
                            {form.formState.errors.campaignSettings?.deadlineDate && (
                              <p className='text-sm text-destructive mt-1'>
                                {form.formState.errors.campaignSettings.deadlineDate.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {form.watch('campaignSettings.duration') && form.watch('targetAmount') && (
                          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                            <h4 className='font-medium text-green-800 mb-2'>Campaign Summary</h4>
                            <div className='text-sm text-green-700 space-y-1'>
                              <p>• Goal: ${form.watch('targetAmount')?.toLocaleString()}</p>
                              <p>• Duration: {form.watch('campaignSettings.duration')} days</p>
                              <p>
                                • Deadline:{' '}
                                {form.watch('campaignSettings.deadlineDate')?.toLocaleDateString()}
                              </p>
                              <p>• Attendees are only charged if goal is reached by deadline</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </FormSection>

                    <FormSection
                      title='Capacity & Tickets'
                      description='Manage attendance limits'
                      icon={<Ticket className='h-5 w-5' />}
                    >
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <FormField
                          form={form}
                          name='capacity'
                          label='Event Capacity'
                          type='number'
                          placeholder='Unlimited'
                          description='Leave empty for unlimited capacity'
                        />

                        <FormField
                          form={form}
                          name='maxTicketsPerPurchase'
                          label='Max Tickets per Purchase'
                          type='number'
                          placeholder='4'
                        />
                      </div>

                      <FormSection
                        title='Advanced Ticketing'
                        description='Early bird and group discounts'
                        collapsible
                        defaultOpen={false}
                      >
                        <div className='space-y-6'>
                          <div>
                            <FormField
                              form={form}
                              name='ticketSettings.earlyBirdEnabled'
                              label='Enable Early Bird Pricing'
                              type='switch'
                            />

                            {form.watch('ticketSettings.earlyBirdEnabled') && (
                              <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                  form={form}
                                  name='ticketSettings.earlyBirdPrice'
                                  label='Early Bird Price'
                                  type='number'
                                  placeholder='0.00'
                                />
                                <div>
                                  <label className='text-sm font-medium mb-2 block'>
                                    Early Bird End Date
                                  </label>
                                  <DatePicker
                                    value={form.watch('ticketSettings.earlyBirdEndDate')}
                                    onChange={date =>
                                      form.setValue(
                                        'ticketSettings.earlyBirdEndDate',
                                        date || undefined
                                      )
                                    }
                                    placeholder='Select end date'
                                    minDate={new Date()}
                                    maxDate={form.watch('startDate')}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <FormField
                              form={form}
                              name='ticketSettings.groupDiscountEnabled'
                              label='Enable Group Discounts'
                              type='switch'
                            />

                            {form.watch('ticketSettings.groupDiscountEnabled') && (
                              <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                  form={form}
                                  name='ticketSettings.groupDiscountMinSize'
                                  label='Minimum Group Size'
                                  type='number'
                                  placeholder='5'
                                />
                                <FormField
                                  form={form}
                                  name='ticketSettings.groupDiscountPercentage'
                                  label='Discount Percentage'
                                  type='number'
                                  placeholder='10'
                                />
                              </div>
                            )}
                          </div>

                          <FormField
                            form={form}
                            name='ticketSettings.refundPolicy'
                            label='Refund Policy'
                            type='select'
                            options={[
                              { value: 'full', label: 'Full Refunds' },
                              { value: 'partial', label: 'Partial Refunds' },
                              { value: 'none', label: 'No Refunds' },
                            ]}
                          />

                          {form.watch('ticketSettings.refundPolicy') !== 'none' && (
                            <FormField
                              form={form}
                              name='ticketSettings.refundDeadlineDays'
                              label='Refund Deadline (days before event)'
                              type='number'
                              placeholder='7'
                            />
                          )}
                        </div>
                      </FormSection>
                    </FormSection>

                    <FormSection
                      title='Sponsorship'
                      description='Set up sponsorship opportunities'
                      icon={<Trophy className='h-5 w-5' />}
                      collapsible
                      defaultOpen={watchSponsorshipEnabled}
                    >
                      <FormField
                        form={form}
                        name='sponsorshipEnabled'
                        label='Enable Sponsorships'
                        type='switch'
                        description='Allow sponsors to support your event'
                      />

                      {watchSponsorshipEnabled && <SponsorshipTierManager form={form} />}
                    </FormSection>

                    <FormSection
                      title='Referral Program'
                      description='Enable users to earn commissions by referring your event'
                      icon={<Share2 className='h-5 w-5' />}
                      collapsible
                      defaultOpen={form.watch('referralSettings.enabled')}
                    >
                      <FormField
                        form={form}
                        name='referralSettings.enabled'
                        label='Enable Referral Program'
                        type='switch'
                        description='Allow users to earn commissions by sharing your event'
                      />

                      {form.watch('referralSettings.enabled') && (
                        <div className='space-y-6 mt-6'>
                          <Alert className='bg-amber-50 border-amber-200'>
                            <AlertCircle className='h-4 w-4' />
                            <AlertDescription>
                              <strong>Stripe Connect Required:</strong> Users who want to earn
                              referral commissions must have their own Stripe Connect account set up
                              to receive payouts. This ensures secure and compliant commission
                              payments.
                            </AlertDescription>
                          </Alert>

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                              <label className='text-sm font-medium mb-2 block'>
                                Commission Type <span className='text-destructive'>*</span>
                              </label>
                              <SearchSelect
                                options={[
                                  {
                                    value: 'fixed',
                                    label: 'Fixed Amount',
                                    description: 'Fixed dollar amount per ticket',
                                  },
                                  {
                                    value: 'percentage',
                                    label: 'Percentage',
                                    description: 'Percentage of ticket price',
                                  },
                                ]}
                                value={form.watch('referralSettings.commissionType')}
                                onChange={value =>
                                  form.setValue(
                                    'referralSettings.commissionType',
                                    value as 'fixed' | 'percentage'
                                  )
                                }
                                placeholder='Select commission type'
                              />
                            </div>

                            <FormField
                              form={form}
                              name='referralSettings.commissionAmount'
                              label={
                                form.watch('referralSettings.commissionType') === 'percentage'
                                  ? 'Commission Percentage'
                                  : 'Commission Amount'
                              }
                              type='number'
                              placeholder={
                                form.watch('referralSettings.commissionType') === 'percentage'
                                  ? '10'
                                  : '2.00'
                              }
                              description={
                                form.watch('referralSettings.commissionType') === 'percentage'
                                  ? 'Percentage of ticket price (max 50%)'
                                  : 'Dollar amount per ticket'
                              }
                              required
                            />
                          </div>

                          <FormField
                            form={form}
                            name='referralSettings.minimumPayoutAmount'
                            label='Minimum Payout Amount'
                            type='number'
                            placeholder='10.00'
                            description='Minimum amount before commission is paid out (recommended: $10+)'
                          />

                          {!watchIsFree && form.watch('referralSettings.commissionAmount') && (
                            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                              <h4 className='font-medium text-green-800 mb-2'>
                                Commission Preview
                              </h4>
                              <div className='text-sm text-green-700 space-y-1'>
                                {form.watch('referralSettings.commissionType') === 'fixed' ? (
                                  <>
                                    <p>• Ticket Price: ${form.watch('price') || 0}</p>
                                    <p>
                                      • Referral Commission: $
                                      {form.watch('referralSettings.commissionAmount') || 0}
                                    </p>
                                    <p>
                                      • You Keep: $
                                      {(
                                        (form.watch('price') || 0) -
                                        (form.watch('referralSettings.commissionAmount') || 0)
                                      ).toFixed(2)}{' '}
                                      per ticket
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p>• Ticket Price: ${form.watch('price') || 0}</p>
                                    <p>
                                      • Referral Commission (
                                      {form.watch('referralSettings.commissionAmount')}%): $
                                      {(
                                        ((form.watch('price') || 0) *
                                          (form.watch('referralSettings.commissionAmount') || 0)) /
                                        100
                                      ).toFixed(2)}
                                    </p>
                                    <p>
                                      • You Keep: $
                                      {(
                                        (form.watch('price') || 0) -
                                        ((form.watch('price') || 0) *
                                          (form.watch('referralSettings.commissionAmount') || 0)) /
                                          100
                                      ).toFixed(2)}{' '}
                                      per ticket
                                    </p>
                                  </>
                                )}
                                <p className='text-xs mt-2 text-green-600'>
                                  * Commission payments require Stripe Connect setup by referrers
                                </p>
                              </div>
                            </div>
                          )}

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <FormField
                              form={form}
                              name='referralSettings.maxReferrers'
                              label='Maximum Referrers (Optional)'
                              type='number'
                              placeholder='Unlimited'
                              description='Limit the number of people who can create referral links'
                            />

                            <FormField
                              form={form}
                              name='referralSettings.requiresApproval'
                              label='Require Approval'
                              type='switch'
                              description='Manually approve referral applications'
                            />
                          </div>

                          <FormField
                            form={form}
                            name='referralSettings.terms'
                            label='Referral Terms & Conditions'
                            type='textarea'
                            rows={3}
                            placeholder='Additional terms for your referral program (optional)'
                            description='Any specific rules or conditions for your referral program'
                          />

                          <Alert>
                            <Info className='h-4 w-4' />
                            <AlertDescription>
                              <strong>Payment Processing:</strong> Referral commissions are
                              automatically tracked and paid out monthly via Stripe. Referrers must
                              have a valid Stripe Connect account to receive payouts. Minimum payout
                              thresholds apply.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </FormSection>
                  </div>
                </FormSection>
              </>
            )}

            {currentStep === 3 && (
              <FormSection
                title='Event Media'
                description='Add images to showcase your event'
                icon={<ImageIcon className='h-5 w-5' />}
              >
                <div className='space-y-6'>
                  <div>
                    <label className='text-sm font-medium mb-2 block'>
                      Banner Image <span className='text-destructive'>*</span>
                    </label>
                    <ImageUpload
                      value={form.watch('bannerImage')}
                      onChange={url => form.setValue('bannerImage', url)}
                      className='h-48'
                      placeholder='Upload banner image (recommended: 1920x480)'
                    />
                    {form.formState.errors.bannerImage && (
                      <p className='text-sm text-destructive mt-1'>
                        {form.formState.errors.bannerImage.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='text-sm font-medium mb-2 block'>
                      Additional Images (max 10)
                    </label>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                      {form.watch('images')?.map((image, index) => (
                        <div key={index} className='relative group'>
                          <img
                            src={image}
                            alt={`Event image ${index + 1}`}
                            className='w-full h-32 object-cover rounded-lg'
                          />
                          <Button
                            type='button'
                            variant='destructive'
                            size='icon'
                            onClick={() => {
                              const images = form.getValues('images') || [];
                              form.setValue(
                                'images',
                                images.filter((_, i) => i !== index)
                              );
                            }}
                            className='absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}

                      {(form.watch('images') || []).length < 10 && (
                        <ImageUpload
                          onChange={url => {
                            const images = form.getValues('images') || [];
                            form.setValue('images', [...images, url]);
                          }}
                          className='h-32'
                          placeholder='Add image'
                        />
                      )}
                    </div>
                  </div>
                </div>
              </FormSection>
            )}

            {currentStep === 4 && (
              <>
                <FormSection
                  title='Event Settings'
                  description='Configure privacy and restrictions'
                  icon={<Settings className='h-5 w-5' />}
                >
                  <div className='space-y-6'>
                    <FormField
                      form={form}
                      name='isPrivate'
                      label='Private Event'
                      type='switch'
                      description='Only invited guests can see and register'
                    />

                    <FormField
                      form={form}
                      name='requiresApproval'
                      label='Requires Approval'
                      type='switch'
                      description='Manually approve attendee registrations'
                    />

                    <FormField
                      form={form}
                      name='ageRestriction'
                      label='Age Restriction'
                      type='number'
                      placeholder='No restriction'
                      description='Minimum age requirement (leave empty for all ages)'
                    />

                    <FormField
                      form={form}
                      name='campaignDuration'
                      label='Campaign Duration'
                      placeholder='30 days'
                      description='How long to run the funding campaign'
                    />
                  </div>
                </FormSection>

                <FormSection
                  title='SEO & Sharing'
                  description='Optimize for search and social media'
                  collapsible
                  defaultOpen={false}
                >
                  <div className='space-y-6'>
                    <FormField
                      form={form}
                      name='seoTitle'
                      label='SEO Title'
                      placeholder='Event title for search results'
                      description='Max 70 characters'
                    />

                    <FormField
                      form={form}
                      name='seoDescription'
                      label='SEO Description'
                      type='textarea'
                      rows={3}
                      placeholder='Event description for search results'
                      description='Max 160 characters'
                    />

                    <FormField
                      form={form}
                      name='slug'
                      label='URL Slug'
                      placeholder='my-awesome-event'
                      description='Used in the event URL'
                    />
                  </div>
                </FormSection>

                <CollaboratorManager form={form} />
              </>
            )}

            <div className='flex justify-between'>
              <Button
                type='button'
                variant='outline'
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type='button' onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <FormActions
                  isSubmitting={isSubmitting}
                  submitLabel='Create Event'
                  showSaveDraft
                  onSaveDraft={handleSaveDraft}
                  submitIcon={<Calendar className='h-4 w-4' />}
                />
              )}
            </div>
          </form>
        </Form>
      </div>

      {/* Validation Panel */}
      {showValidationPanel && (
        <div className='lg:col-span-1'>
          <div className='sticky top-8'>
            <EnhancedFormValidation
              form={form}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </div>
        </div>
      )}
    </div>
  );

};

export default CreateEventForm;
