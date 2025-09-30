import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RouteWrapper } from '@/components/layout/RouteWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/providers/AuthProvider';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  CalendarIcon,
  CreditCard,
  DollarSign,
  Target,
  Users,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Eye,
  Clock,
  Zap,
  CheckCircle,
  MapPin,
  Heart,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const promotionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title is too long'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500, 'Description is too long'),
  targetType: z.enum(['event', 'venue', 'caterer', 'product', 'profile']),
  targetId: z.string().min(1, 'Please select what to promote'),
  budget: z.number().min(10, 'Minimum budget is $10').max(10000, 'Maximum budget is $10,000'),
  dailyBudgetLimit: z.number().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  deliveryMethod: z.enum(['feed', 'ai-message', 'combined']),
  aiDeliveryTone: z.enum(['casual', 'professional', 'friendly']).optional(),
  ageRangeMin: z.number().min(13).max(100).optional(),
  ageRangeMax: z.number().min(13).max(100).optional(),
  locationTargeting: z.boolean().optional(),
  locationRadius: z.number().min(1).max(100).optional(),
  interestTargeting: z.array(z.string()).optional(),
  boostPriority: z.enum(['low', 'medium', 'high']).optional(),
});

type PromotionFormData = z.infer<typeof promotionSchema>;

interface PromotableItem {
  id: string;
  title: string;
  type: string;
  description?: string | undefined;
}

const DELIVERY_METHODS = [
  {
    value: 'feed',
    label: 'Feed Promotion',
    description: 'Show your promotion in users\' feeds',
    icon: Eye,
    estimatedReach: 1.0,
  },
  {
    value: 'ai-message',
    label: 'AI Personalized Messages',
    description: 'Send personalized messages to targeted users',
    icon: Zap,
    estimatedReach: 0.7,
  },
  {
    value: 'combined',
    label: 'Combined Approach',
    description: 'Both feed posts and personalized messages',
    icon: TrendingUp,
    estimatedReach: 1.5,
  },
];

const INTEREST_CATEGORIES = [
  'Food & Dining',
  'Entertainment',
  'Sports & Recreation',
  'Arts & Culture',
  'Business & Networking',
  'Health & Wellness',
  'Family & Kids',
  'Music & Concerts',
  'Technology',
  'Outdoor Activities',
  'Shopping & Fashion',
  'Education & Learning',
];

const AI_TONES = [
  {
    value: 'casual',
    label: 'Casual & Friendly',
    description: 'Relaxed, approachable tone',
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Business-like, authoritative tone',
  },
  {
    value: 'friendly',
    label: 'Warm & Inviting',
    description: 'Enthusiastic, welcoming tone',
  },
];

const CreatePromotion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { track } = useAnalytics('create_promotion', 'Create Promotion');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [promotableItems, setPromotableItems] = useState<PromotableItem[]>([]);

  const form = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      title: '',
      description: '',
      targetType: 'event',
      targetId: '',
      budget: 50,
      startDate: new Date(),
      deliveryMethod: 'feed',
      aiDeliveryTone: 'casual',
      ageRangeMin: 18,
      ageRangeMax: 65,
      locationTargeting: false,
      locationRadius: 10,
      interestTargeting: [],
      boostPriority: 'medium',
    },
    mode: 'onChange',
  });

  const watchBudget = form.watch('budget');
  const watchTargetType = form.watch('targetType');
  const watchDeliveryMethod = form.watch('deliveryMethod');
  const watchLocationTargeting = form.watch('locationTargeting');

  const selectedDeliveryMethod = DELIVERY_METHODS.find(m => m.value === watchDeliveryMethod);

  const estimatedStats = useMemo(() => {
    const baseReach = Math.floor(watchBudget * 25 * (selectedDeliveryMethod?.estimatedReach || 1));
    const estimatedCost = Math.min(watchBudget * 0.85, watchBudget);
    const estimatedClicks = Math.floor(baseReach * 0.15);
    const estimatedEngagements = Math.floor(baseReach * 0.08);

    return {
      reach: baseReach,
      cost: estimatedCost,
      clicks: estimatedClicks,
      engagements: estimatedEngagements,
    };
  }, [watchBudget, selectedDeliveryMethod]);

  useEffect(() => {
    track('page_view', { page: 'create_promotion' });
    fetchAvailableCredits();
  }, [track]);

  useEffect(() => {
    if (watchTargetType) {
      fetchPromotableItems(watchTargetType);
    }
  }, [watchTargetType]);

  const fetchAvailableCredits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('promotion_credits')
        .select('remaining_amount')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('remaining_amount', 0);

      if (error) throw error;

      const total = data?.reduce((sum, credit) => sum + credit.remaining_amount, 0) || 0;
      setAvailableCredits(total);
    } catch (error) {
      console.error('Error fetching promotion credits:', error);
      toast.error('Failed to load promotion credits');
      setAvailableCredits(0);
    }
  };

  const fetchPromotableItems = async (type: string) => {
    if (!user) return;

    try {
      let query;
      switch (type) {
        case 'event':
          query = supabase
            .from('events')
            .select('id, title, description')
            .eq('creator_id', user.id)
            .eq('status', 'active');
          break;
        case 'venue':
          query = supabase
            .from('venues')
            .select('id, name as title, description')
            .eq('owner_id', user.id);
          break;
        case 'caterer':
          query = supabase
            .from('caterers')
            .select('id, name as title, description')
            .eq('user_id', user.id)
            .eq('status', 'approved');
          break;
        case 'product':
          query = supabase
            .from('products')
            .select('id, name as title, description')
            .eq('creator_id', user.id)
            .eq('status', 'active');
          break;
        case 'profile':
          setPromotableItems([
            {
              id: user.id,
              title: user.name || 'Your Profile',
              type: 'profile',
              description: 'Promote your personal or business profile',
            },
          ]);
          return;
        default:
          setPromotableItems([]);
          return;
      }

      const { data, error } = await query;
      if (error) throw error;

      const items = data || [];
      setPromotableItems(
        items.map((item: any) => ({
          id: item.id || '',
          title: item.title || item.name || 'Untitled',
          type,
          description: item.description || '',
        }))
      );
    } catch (error) {
      console.error('Error fetching promotable items:', error);
      setPromotableItems([]);
    }
  };

  const handleInterestToggle = (interest: string, checked: boolean) => {
    const currentInterests = form.getValues('interestTargeting') || [];
    const newInterests = checked
      ? [...currentInterests, interest]
      : currentInterests.filter(i => i !== interest);

    form.setValue('interestTargeting', newInterests, { shouldValidate: true });
  };

  const onSubmit = async (data: PromotionFormData) => {
    if (!user) {
      toast.error('You must be logged in to create a promotion');
      return;
    }

    setIsLoading(true);

    try {
      // Create promotion in database
      const promotionData = {
        user_id: user.id,
        title: data.title,
        description: data.description,
        target_type: data.targetType,
        target_id: data.targetId,
        budget: data.budget,
        daily_budget_limit: data.dailyBudgetLimit,
        start_date: data.startDate.toISOString(),
        end_date: data.endDate?.toISOString(),
        delivery_method: data.deliveryMethod,
        ai_delivery_tone: data.aiDeliveryTone,
        age_range_min: data.ageRangeMin,
        age_range_max: data.ageRangeMax,
        location_targeting: data.locationTargeting,
        location_radius: data.locationRadius,
        interest_targeting: data.interestTargeting,
        boost_priority: data.boostPriority,
        status: 'pending',
      };

      const { data: promotion, error: promotionError } = await supabase
        .from('promotions')
        .insert(promotionData)
        .select()
        .single();

      if (promotionError) throw promotionError;

      // Process payment
      const useCredits = availableCredits > 0;
      const { data: paymentResult, error: paymentError } = await supabase.functions.invoke(
        'process-promotion-payment',
        {
          body: {
            userId: user.id,
            promotionId: promotion.id,
            amount: data.budget,
            useCredits,
          },
        }
      );

      if (paymentError) throw paymentError;

      if (paymentResult.success) {
        toast.success('🎉 Promotion created successfully!', {
          description: 'Your promotion will be reviewed and go live within 24 hours.'
        });
        track('promotion_created', {
          promotion_id: promotion.id,
          budget: data.budget,
          target_type: data.targetType,
          delivery_method: data.deliveryMethod,
          credit_used: paymentResult.creditUsed,
          amount_charged: paymentResult.amountCharged,
        });
        navigate('/dashboard?tab=promotions');
      } else {
        toast.error(paymentResult.message || 'Failed to process payment');
      }
    } catch (error) {
      toast.error('Failed to create promotion');
    } finally {
      setIsLoading(false);
    }
  };

  const needsPayment = watchBudget > availableCredits;

  return (
    <RouteWrapper
      title='Create Promotion'
      description='Create and manage promotional campaigns'
      requiresAuth={true}
      analyticsPath='/create-promotion'
      analyticsTitle='Create Promotion'
    >
      <div className='min-h-screen bg-background'>
        <div className='container mx-auto px-4 py-8'>
          <div className='max-w-6xl mx-auto'>
            {/* Header */}
            <div className='text-center mb-8'>
              <h1 className='text-4xl font-bold text-gray-900 mb-3'>Create Promotion</h1>
              <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
                Reach more people in your community with targeted promotional campaigns
              </p>
            </div>

            {/* Credits Alert */}
            {availableCredits > 0 && (
              <Alert className='mb-6 border-green-200 bg-green-50'>
                <CreditCard className='h-4 w-4 text-green-600' />
                <AlertDescription className='text-green-800'>
                  <strong>${availableCredits.toFixed(2)}</strong> in promotion credits available.
                  {needsPayment && (
                    <span className='text-primary ml-2'>
                      Additional ${(watchBudget - availableCredits).toFixed(2)} will be charged.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                  {/* Main Form */}
                  <div className='lg:col-span-2 space-y-6'>
                    {/* Basic Information */}
                    <Card className='shadow-lg'>
                      <CardHeader className='bg-primary text-primary-foreground rounded-t-lg'>
                        <CardTitle className='flex items-center gap-3'>
                          <Target className='h-6 w-6' />
                          Promotion Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-6 space-y-6'>
                        <FormField
                          control={form.control}
                          name='title'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-base font-semibold'>Campaign Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='e.g., Summer Music Festival Special Offer'
                                  className='h-12'
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                A catchy title that will grab attention in feeds
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='description'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-base font-semibold'>Campaign Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder='Tell people why they should be excited about this. What makes it special? What value are you offering?'
                                  className='min-h-[120px] resize-none'
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Compelling copy that converts browsers into customers ({field.value?.length || 0}/500 characters)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className='grid grid-cols-1 ...(grid-cols-2 gap-6'>
                          <FormField
                            control={form.control}
                            name='targetType'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className='text-base font-semibold'>What to Promote</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className='h-12'>
                                      <SelectValue placeholder='Select type' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value='event'>🎪 Event</SelectItem>
                                    <SelectItem value='venue'>🏢 Venue</SelectItem>
                                    <SelectItem value='caterer'>👨‍🍳 Catering Service</SelectItem>
                                    <SelectItem value='product'>📦 Product</SelectItem>
                                    <SelectItem value='profile'>👤 Profile</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name='targetId'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className='text-base font-semibold'>Select Item</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className='h-12'>
                                      <SelectValue placeholder='Choose what to promote' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {promotableItems.map(item => (
                                      <SelectItem key={item.id} value={item.id}>
                                        <div className='flex flex-col'>
                                          <span className='font-medium'>{item.title}</span>
                                          {item.description && (
                                            <span className='text-xs text-gray-500 truncate max-w-[200px]'>
                                              {item.description}
                                            </span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Budget & Schedule */}
                    <Card className='shadow-lg'>
                      <CardHeader className='bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg'>
                        <CardTitle className='flex items-center gap-3'>
                          <DollarSign className='h-6 w-6' />
                          Budget & Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-6 space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <FormField
                            control={form.control}
                            name='budget'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className='text-base font-semibold'>Total Budget</FormLabel>
                                <FormControl>
                                  <div className='relative'>
                                    <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                                    <Input
                                      type='number'
                                      min='10'
                                      max='10000'
                                      step='10'
                                      className='pl-10 h-12'
                                      {...field}
                                      onChange={e => field.onChange(Number((e.target as HTMLInputElement).value) as number || 0)}
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Pay only for results. Minimum $10, maximum $10,000.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name='dailyBudgetLimit'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className='text-base font-semibold'>Daily Limit (Optional)</FormLabel>
                                <FormControl>
                                  <div className='relative'>
                                    <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                                    <Input
                                      type='number'
                                      min='1'
                                      step='1'
                                      placeholder='No limit'
                                      className='pl-10 h-12'
                                      {...field}
                                      onChange={e =>
                                        field.onChange(Number((e.target as HTMLInputElement).value))
                                      }
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Control daily spending to spread budget over time
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <FormField
                            control={form.control}
                            name='startDate'
                            render={({ field }) => (
                              <FormItem className='flex flex-col'>
                                <FormLabel className='text-base font-semibold'>Start Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant='outline'
                                        className={cn(
                                          'h-12 w-full pl-3 text-left font-normal',
                                          !field.value && 'text-muted-foreground'
                                        )}
                                      >
                                        {field.value ? (
                                          <div className='flex items-center gap-2'>
                                            <CalendarIcon className='h-4 w-4' />
                                            {format(field.value, 'PPP')}
                                          </div>
                                        ) : (
                                          <span>Pick start date</span>
                                        )}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className='w-auto p-0' align='start'>
                                    <Calendar
                                      mode='single'
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={date => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  When should your campaign start running?
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name='endDate'
                            render={({ field }) => (
                              <FormItem className='flex flex-col'>
                                <FormLabel className='text-base font-semibold'>End Date (Optional)</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant='outline'
                                        className={cn(
                                          'h-12 w-full pl-3 text-left font-normal',
                                          !field.value && 'text-muted-foreground'
                                        )}
                                      >
                                        {field.value ? (
                                          <div className='flex items-center gap-2'>
                                            <CalendarIcon className='h-4 w-4' />
                                            {format(field.value, 'PPP')}
                                          </div>
                                        ) : (
                                          <span>Run until budget spent</span>
                                        )}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className='w-auto p-0' align='start'>
                                    <Calendar
                                      mode='single'
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={date => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  Leave blank to run until budget is spent
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Targeting */}
                    <Card className='shadow-lg'>
                      <CardHeader className='bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg'>
                        <CardTitle className='flex items-center gap-3'>
                          <Users className='h-6 w-6' />
                          Audience Targeting
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='p-6 space-y-6'>
                        {/* Delivery Method */}
                        <FormField
                          control={form.control}
                          name='deliveryMethod'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-base font-semibold'>Delivery Method</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className='grid grid-cols-1 md:grid-cols-3 gap-4'
                                >
                                  {DELIVERY_METHODS.map(method => (
                                    <div key={method.value} className='relative'>
                                      <RadioGroupItem
                                        value={method.value}
                                        id={method.value}
                                        className='peer sr-only'
                                      />
                                      <label
                                        htmlFor={method.value}
                                        className={cn(
                                          'flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all',
                                          'peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-secondary'
                                        )}
                                      >
                                        <method.icon className='h-8 w-8 mb-2 text-muted-foreground peer-checked:text-primary' />
                                        <h4 className='font-semibold text-sm'>{method.label}</h4>
                                        <p className='text-xs text-gray-500 text-center mt-1'>
                                          {method.description}
                                        </p>
                                      </label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* AI Tone Selection */}
                        {(watchDeliveryMethod === 'ai-message' || watchDeliveryMethod === 'combined') && (
                          <FormField
                            control={form.control}
                            name='aiDeliveryTone'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className='text-base font-semibold'>AI Message Tone</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className='h-12'>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {AI_TONES.map(tone => (
                                      <SelectItem key={tone.value} value={tone.value}>
                                        <div className='flex flex-col'>
                                          <span className='font-medium'>{tone.label}</span>
                                          <span className='text-xs text-gray-500'>{tone.description}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Age Range */}
                        <div>
                          <div className='mb-4'>
                            <label className='text-base font-semibold'>Age Range</label>
                            <p className='text-sm text-gray-600'>Target users within this age range</p>
                          </div>
                          <div className='grid grid-cols-2 gap-6'>
                            <FormField
                              control={form.control}
                              name='ageRangeMin'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Minimum Age</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      min='13'
                                      max='100'
                                      className='h-12'
                                      {...field}
                                      onChange={e => field.onChange(Number((e.target as HTMLInputElement).value) as number || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name='ageRangeMax'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Maximum Age</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      min='13'
                                      max='100'
                                      className='h-12'
                                      {...field}
                                      onChange={e => field.onChange(Number((e.target as HTMLInputElement).value) as number || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Location Targeting */}
                        <FormField
                          control={form.control}
                          name='locationTargeting'
                          render={({ field }) => (
                            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                              <div className='space-y-0.5'>
                                <FormLabel className='text-base font-semibold flex items-center gap-2'>
                                  <MapPin className='h-4 w-4' />
                                  Location Targeting
                                </FormLabel>
                                <FormDescription>
                                  Target users in your area for local events and services
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {watchLocationTargeting && (
                          <FormField
                            control={form.control}
                            name='locationRadius'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Radius (miles)</FormLabel>
                                <FormControl>
                                  <div className='px-3'>
                                    <Slider
                                      min={1}
                                      max={100}
                                      step={1}
                                      value={[field.value || 10]}
                                      onValueChange={(value) => field.onChange(value[0])}
                                      className='w-full'
                                    />
                                    <div className='flex justify-between text-sm text-gray-500 mt-1'>
                                      <span>1 mile</span>
                                      <span>{field.value} miles</span>
                                      <span>100 miles</span>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Interest Targeting */}
                        <FormField
                          control={form.control}
                          name='interestTargeting'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-base font-semibold flex items-center gap-2'>
                                <Heart className='h-4 w-4' />
                                Interest Categories (Optional)
                              </FormLabel>
                              <FormDescription>
                                Target users interested in these categories
                              </FormDescription>
                              <div className='grid grid-cols-2 md:grid-cols-3 gap-3 mt-3'>
                                {INTEREST_CATEGORIES.map(interest => (
                                  <div key={interest} className='flex items-center space-x-2'>
                                    <input
                                      type='checkbox'
                                      id={`interest-${interest}`}
                                      checked={field.value?.includes(interest) || false}
                                      onChange={(e) => handleInterestToggle(interest, e.target as HTMLElement.checked)}
                                      className='rounded border-input text-primary focus:ring-ring'
                                    />
                                    <label htmlFor={`interest-${interest}`} className='text-sm font-medium cursor-pointer'>
                                      {interest}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary Sidebar */}
                  <div className='lg:col-span-1'>
                    <div className='sticky top-4 space-y-6'>
                      {/* Estimated Performance */}
                      <Card className='shadow-lg'>
                        <CardHeader className='bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg'>
                          <CardTitle className='flex items-center gap-2'>
                            <TrendingUp className='h-5 w-5' />
                            Estimated Performance
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='p-6'>
                          <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-2'>
                                <Eye className='h-4 w-4 text-blue-600' />
                                <span className='text-sm text-gray-600'>Reach</span>
                              </div>
                              <span className='font-bold text-lg'>
                                {estimatedStats.reach.toLocaleString()}
                              </span>
                            </div>

                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-2'>
                                <Zap className='h-4 w-4 text-green-600' />
                                <span className='text-sm text-gray-600'>Clicks</span>
                              </div>
                              <span className='font-bold text-lg'>
                                {estimatedStats.clicks.toLocaleString()}
                              </span>
                            </div>

                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-2'>
                                <Heart className='h-4 w-4 text-red-600' />
                                <span className='text-sm text-gray-600'>Engagements</span>
                              </div>
                              <span className='font-bold text-lg'>
                                {estimatedStats.engagements.toLocaleString()}
                              </span>
                            </div>

                            <div className='pt-4 border-t'>
                              <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium text-gray-700'>Budget</span>
                                <span className='font-bold text-xl text-primary'>
                                  ${watchBudget}
                                </span>
                              </div>
                              <div className='flex items-center justify-between mt-2'>
                                <span className='text-xs text-gray-500'>Est. Cost</span>
                                <span className='text-sm font-medium'>
                                  ${estimatedStats.cost.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Payment Summary */}
                      {(availableCredits > 0 || needsPayment) && (
                        <Card className='shadow-lg'>
                          <CardHeader>
                            <CardTitle className='flex items-center gap-2 text-lg'>
                              <CreditCard className='h-5 w-5' />
                              Payment Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className='space-y-3'>
                            {availableCredits > 0 && (
                              <div className='flex justify-between items-center'>
                                <span className='text-sm text-gray-600'>Credits Available</span>
                                <Badge variant='outline' className='text-green-600 border-green-200 bg-green-50'>
                                  ${availableCredits.toFixed(2)}
                                </Badge>
                              </div>
                            )}

                            {needsPayment && (
                              <div className='flex justify-between items-center'>
                                <span className='text-sm text-gray-600'>Additional Payment</span>
                                <Badge variant='outline'>
                                  ${(watchBudget - availableCredits).toFixed(2)}
                                </Badge>
                              </div>
                            )}

                            <div className='pt-3 border-t text-xs text-gray-500'>
                              <div className='flex items-start gap-2'>
                                <AlertTriangle className='h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0' />
                                <p>
                                  Performance-based pricing: $0.005/impression, $0.50/click,
                                  $0.25/engagement, $2.00/conversion.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}{/* Submit Button */}
                      <Card className='shadow-lg'>
                        <CardContent className='p-6'>
                          <Button
                            type='submit'
                            className='w-full h-14 text-lg'
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                                Creating Promotion...
                              </>
                            ) : (
                              <>
                                <CheckCircle className='mr-2 h-5 w-5' />
                                Launch Campaign
                              </>
                            )}
                          </Button>

                          <p className='text-xs text-center text-gray-500 mt-3'>
                            Your promotion will be reviewed within 24 hours
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </RouteWrapper>
  );
};

export default CreatePromotion;