import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Check, Star, Users, DollarSign, MapPin, Phone, Mail, Globe, ChefHat, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateCaterer } from '@/hooks/useCaterer';
import { toast } from 'sonner';

// Form validation schema
const catererSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters').max(100, 'Business name is too long'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(1000, 'Description is too long'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number').regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone format'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  address: z.string().min(10, 'Please enter a complete address'),
  cuisine_types: z.array(z.string()).min(1, 'Please select at least one cuisine type'),
  service_types: z.array(z.string()).min(1, 'Please select at least one service type'),
  price_range: z.string().min(1, 'Please select a price range'),
  minimum_order: z.number().min(1, 'Minimum order must be at least $1'),
  max_guest_capacity: z.number().min(1, 'Maximum capacity must be at least 1 guest'),
  specialties: z.array(z.string()).optional(),
  special_diets: z.array(z.string()).optional(),
});

type CatererFormData = z.infer<typeof catererSchema>;

const CUISINE_TYPES = [
  { value: 'Italian', emoji: '🍝' },
  { value: 'Mexican', emoji: '🌮' },
  { value: 'Chinese', emoji: '🥢' },
  { value: 'Indian', emoji: '🍛' },
  { value: 'Mediterranean', emoji: '🫒' },
  { value: 'American', emoji: '🍔' },
  { value: 'Japanese', emoji: '🍣' },
  { value: 'Thai', emoji: '🍜' },
  { value: 'French', emoji: '🥐' },
  { value: 'Greek', emoji: '🥗' },
  { value: 'Lebanese', emoji: '🧆' },
  { value: 'Korean', emoji: '🍲' },
  { value: 'Other', emoji: '🍽️' },
];

const SERVICE_TYPES = [
  { value: 'Full Service', description: 'Complete service with staff' },
  { value: 'Drop-off', description: 'Food delivery only' },
  { value: 'Buffet', description: 'Self-serve buffet setup' },
  { value: 'Plated', description: 'Individual plated meals' },
  { value: 'Family Style', description: 'Shared family-style dining' },
  { value: 'Cocktail Reception', description: 'Appetizers and finger foods' },
  { value: 'BBQ', description: 'Outdoor BBQ catering' },
  { value: 'Food Truck', description: 'Mobile food service' },
  { value: 'Corporate Catering', description: 'Business event catering' },
];

const PRICE_RANGES = [
  { value: '$', label: '$ - Budget', description: '$10-20 per person', color: 'bg-green-100 text-green-800' },
  { value: '$$', label: '$$ - Moderate', description: '$20-35 per person', color: 'bg-blue-100 text-blue-800' },
  { value: '$$$', label: '$$$ - Premium', description: '$35-60 per person', color: 'bg-secondary text-secondary-foreground' },
  { value: '$$$$', label: '$$$$ - Luxury', description: '$60+ per person', color: 'bg-purple-100 text-purple-800' },
];

const SPECIALTIES = [
  'Wedding Catering',
  'Corporate Events',
  'Birthday Parties',
  'Holiday Events',
  'Outdoor Events',
  'Intimate Gatherings',
  'Large Events (500+)',
  'Brunch',
  'Late Night Dining',
  'Breakfast Catering',
];

const SPECIAL_DIETS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Kosher',
  'Halal',
  'Dairy-Free',
  'Nut-Free',
  'Keto',
  'Paleo',
  'Raw Food',
];

const CatererListingForm: React.FC = () => {
  const navigate = useNavigate();
  const createCatererMutation = useCreateCaterer();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const form = useForm<CatererFormData>({
    resolver: zodResolver(catererSchema),
    defaultValues: {
      name: '',
      description: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      cuisine_types: [],
      service_types: [],
      price_range: '',
      minimum_order: 0,
      max_guest_capacity: 0,
      specialties: [],
      special_diets: [],
    },
    mode: 'onChange',
  });

  const watchedValues = form.watch();
  const progress = useMemo(() => {
    const steps = [
      // Step 1: Basic Information
      !!(watchedValues.name && watchedValues.description && watchedValues.email &&
         watchedValues.phone && watchedValues.address),
      // Step 2: Services & Cuisine
      !!(watchedValues.cuisine_types?.length && watchedValues.service_types?.length &&
         watchedValues.price_range),
      // Step 3: Capacity & Specialties
      !!(watchedValues.max_guest_capacity && watchedValues.minimum_order),
      // Step 4: Review complete
      true
    ];
    return (steps.filter(Boolean).length / totalSteps) * 100;
  }, [watchedValues]);

  const validateCurrentStep = async (): Promise<boolean> => {
    const stepFields = {
      1: ['name', 'description', 'email', 'phone', 'address'] as const,
      2: ['cuisine_types', 'service_types', 'price_range'] as const,
      3: ['max_guest_capacity', 'minimum_order'] as const,
      4: [] as const, // All fields for final validation
    };

    const fieldsToValidate = stepFields[currentStep as keyof typeof stepFields];

    if (currentStep === 4) {
      // Validate entire form for final step
      const isValid = await form.trigger();
      return isValid;
    } else {
      // Validate only current step fields
      const isValid = await form.trigger(fieldsToValidate);
      return isValid;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleArrayFieldChange = (
    field: 'cuisine_types' | 'service_types' | 'specialties' | 'special_diets',
    value: string,
    checked: boolean
  ) => {
    const currentValues = form.getValues(field) || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(item => item !== value);

    form.setValue(field, newValues, { shouldValidate: true });
  };

  const handleSubmit = async (data: CatererFormData) => {
    try {
      // Transform the data to match the expected API format
      const submitData = {
          ...data,
        images: [],
        cover_image: '',
      };

      await createCatererMutation.mutateAsync(submitData);
      toast.success('🎉 Your catering business has been submitted for review!', {
        description: "We'll review your application and get back to you within 24-48 hours."
      });
      navigate('/caterers');
    } catch (error) {
      toast.error('Failed to submit your listing', {
        description: 'Please check your information and try again.'
      });
      console.error('Error creating caterer:', error);
    }
  };

  const renderStep1 = () => (
    <div className='space-y-6'>
      <div className='text-center mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Tell us about your business</h3>
        <p className='text-gray-600'>Let's start with the basics about your catering service</p>
      </div>

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center gap-2'>
              <Star className='h-4 w-4 text-primary' />
              Business Name
            </FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Bella's Italian Catering"
                className='h-12'
                {...field}
              />
            </FormControl>
            <FormDescription>
              This will be displayed to customers searching for caterers
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Tell customers about your catering experience, specialties, and what makes your service unique. Share your story and what sets you apart from other caterers...'
                className='min-h-[120px] resize-none'
                {...field}
              />
            </FormControl>
            <FormDescription>
              A compelling description helps customers choose your services (minimum 50 characters)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className='flex items-center gap-2'>
                <Mail className='h-4 w-4 text-blue-600' />
                Email Address
              </FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='business@example.com'
                  className='h-12'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                We'll use this to contact you about your listing
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className='flex items-center gap-2'>
                <Phone className='h-4 w-4 text-green-600' />
                Phone Number
              </FormLabel>
              <FormControl>
                <Input
                  type='tel'
                  placeholder='(555) 123-4567'
                  className='h-12'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Customers will use this to contact you
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center gap-2'>
              <Globe className='h-4 w-4 text-purple-600' />
              Website (Optional)
            </FormLabel>
            <FormControl>
              <Input
                type='url'
                placeholder='https://www.yourwebsite.com'
                className='h-12'
                {...field}
              />
            </FormControl>
            <FormDescription>
              Link to your business website or social media page
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center gap-2'>
              <MapPin className='h-4 w-4 text-red-600' />
              Business Address
            </FormLabel>
            <FormControl>
              <Input
                placeholder='123 Main Street, City, State, ZIP Code'
                className='h-12'
                {...field}
              />
            </FormControl>
            <FormDescription>
              Your business location helps customers find local caterers
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className='space-y-8'>
      <div className='text-center mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Services & Cuisine</h3>
        <p className='text-gray-600'>What types of food and services do you offer?</p>
      </div>

      <FormField
        control={form.control}
        name="cuisine_types"
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center gap-2 text-base'>
              <ChefHat className='h-5 w-5 text-primary' />
              Cuisine Types
            </FormLabel>
            <FormDescription className='mb-4'>
              Select all cuisine types that you specialize in
            </FormDescription>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              {CUISINE_TYPES.map(cuisine => (
                <div key={cuisine.value} className='flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50'>
                  <Checkbox
                    id={`cuisine-${cuisine.value}`}
                    checked={field.value?.includes(cuisine.value) || false}
                    onCheckedChange={(checked) =>
                      handleArrayFieldChange('cuisine_types', cuisine.value, checked as boolean)
                    }
                  />
                  <label htmlFor={`cuisine-${cuisine.value}`} className='flex items-center gap-2 text-sm font-medium cursor-pointer'>
                    <span className='text-lg'>{cuisine.emoji}</span>
                    {cuisine.value}
                  </label>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="service_types"
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center gap-2 text-base'>
              <Utensils className='h-5 w-5 text-blue-600' />
              Service Types
            </FormLabel>
            <FormDescription className='mb-4'>
              What types of catering services do you provide?
            </FormDescription>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {SERVICE_TYPES.map(service => (
                <div key={service.value} className='flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50'>
                  <Checkbox
                    id={`service-${service.value}`}
                    checked={field.value?.includes(service.value) || false}
                    onCheckedChange={(checked) =>
                      handleArrayFieldChange('service_types', service.value, checked as boolean)
                    }
                    className='mt-1'
                  />
                  <div className='flex-1 cursor-pointer' onClick={() => {
                    const checked = !field.value?.includes(service.value);
                    handleArrayFieldChange('service_types', service.value, checked);
                  }}>
                    <label htmlFor={`service-${service.value}`} className='text-sm font-medium cursor-pointer'>
                      {service.value}
                    </label>
                    <p className='text-xs text-gray-500 mt-1'>{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price_range"
        render={({ field }) => (
          <FormItem>
            <FormLabel className='flex items-center gap-2 text-base'>
              <DollarSign className='h-5 w-5 text-green-600' />
              Price Range
            </FormLabel>
            <FormDescription className='mb-4'>
              What's your typical price range per person?
            </FormDescription>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {PRICE_RANGES.map(range => (
                <div
                  key={range.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    field.value === range.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => form.setValue('price_range', range.value, { shouldValidate: true })}
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-semibold text-gray-900'>{range.label}</h4>
                      <p className='text-sm text-gray-600'>{range.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      field.value === range.value
                        ? 'border-primary bg-primary'
                        : 'border-gray-300'
                    }`}>
                      {field.value === range.value && (
                        <div className='w-full h-full rounded-full bg-primary'></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep3 = () => (
    <div className='space-y-8'>
      <div className='text-center mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Capacity & Details</h3>
        <p className='text-gray-600'>Help customers understand your service capabilities</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <FormField
          control={form.control}
          name="max_guest_capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className='flex items-center gap-2'>
                <Users className='h-4 w-4 text-blue-600' />
                Maximum Guest Capacity
              </FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min='1'
                  placeholder='e.g., 200'
                  className='h-12'
                  {...field}
                  onChange={(e) => field.onChange(parseInt((e.target as HTMLInputElement).value) || 0)}
                />
              </FormControl>
              <FormDescription>
                What's the largest event you can cater?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minimum_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel className='flex items-center gap-2'>
                <DollarSign className='h-4 w-4 text-green-600' />
                Minimum Order Amount
              </FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min='0'
                  placeholder='e.g., 500'
                  className='h-12'
                  {...field}
                  onChange={(e) => field.onChange(parseInt((e.target as HTMLInputElement).value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Your minimum order value in dollars
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="specialties"
        render={({ field }) => (
          <FormItem>
            <FormLabel className='text-base'>Event Specialties (Optional)</FormLabel>
            <FormDescription className='mb-4'>
              What types of events do you specialize in?
            </FormDescription>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {SPECIALTIES.map(specialty => (
                <div key={specialty} className='flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50'>
                  <Checkbox
                    id={`specialty-${specialty}`}
                    checked={field.value?.includes(specialty) || false}
                    onCheckedChange={(checked) =>
                      handleArrayFieldChange('specialties', specialty, checked as boolean)
                    }
                  />
                  <label htmlFor={`specialty-${specialty}`} className='text-sm font-medium cursor-pointer'>
                    {specialty}
                  </label>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="special_diets"
        render={({ field }) => (
          <FormItem>
            <FormLabel className='text-base'>Dietary Accommodations (Optional)</FormLabel>
            <FormDescription className='mb-4'>
              What special dietary needs can you accommodate?
            </FormDescription>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              {SPECIAL_DIETS.map(diet => (
                <div key={diet} className='flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50'>
                  <Checkbox
                    id={`diet-${diet}`}
                    checked={field.value?.includes(diet) || false}
                    onCheckedChange={(checked) =>
                      handleArrayFieldChange('special_diets', diet, checked as boolean)
                    }
                  />
                  <label htmlFor={`diet-${diet}`} className='text-sm font-medium cursor-pointer'>
                    {diet}
                  </label>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep4 = () => (
    <div className='space-y-6'>
      <div className='text-center mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Review & Submit</h3>
        <p className='text-gray-600'>Please review your information before submitting</p>
      </div>

      <Alert className='border-border bg-secondary'>
        <Check className='h-4 w-4 text-primary' />
        <AlertDescription className='text-foreground'>
          Your listing will be reviewed by our team and will go live within 24-48 hours.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Star className='h-5 w-5 text-primary' />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-gray-600'>Business Name</p>
              <p className='font-medium'>{watchedValues.name}</p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Email</p>
              <p className='font-medium'>{watchedValues.email}</p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Phone</p>
              <p className='font-medium'>{watchedValues.phone}</p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Address</p>
              <p className='font-medium'>{watchedValues.address}</p>
            </div>
          </div>
          {watchedValues.website && (
            <div>
              <p className='text-sm text-gray-600'>Website</p>
              <p className='font-medium text-blue-600'>{watchedValues.website}</p>
            </div>
          )}
          <div>
            <p className='text-sm text-gray-600'>Description</p>
            <p className='font-medium text-gray-800'>{watchedValues.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Utensils className='h-5 w-5 text-blue-600' />
            Services & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <p className='text-sm text-gray-600 mb-2'>Cuisine Types</p>
            <div className='flex flex-wrap gap-2'>
              {watchedValues.cuisine_types?.map(cuisine => {
                const cuisineData = CUISINE_TYPES.find(c => c.value === cuisine);
                return (
                  <Badge key={cuisine} variant='secondary' className='flex items-center gap-1'>
                    <span>{cuisineData?.emoji}</span>
                    {cuisine}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div>
            <p className='text-sm text-gray-600 mb-2'>Service Types</p>
            <div className='flex flex-wrap gap-2'>
              {watchedValues.service_types?.map(service => (
                <Badge key={service} variant='outline'>
                  {service}
                </Badge>
              ))}
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <p className='text-sm text-gray-600'>Price Range</p>
              <p className='font-medium'>{watchedValues.price_range}</p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Max Capacity</p>
              <p className='font-medium'>{watchedValues.max_guest_capacity} guests</p>
            </div>
            <div>
              <p className='text-sm text-gray-600'>Minimum Order</p>
              <p className='font-medium'>${watchedValues.minimum_order}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(watchedValues.specialties?.length || watchedValues.special_diets?.length) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {watchedValues.specialties?.length > 0 && (
              <div>
                <p className='text-sm text-gray-600 mb-2'>Event Specialties</p>
                <div className='flex flex-wrap gap-2'>
                  {watchedValues.specialties.map(specialty => (
                    <Badge key={specialty} variant='default'>
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {watchedValues.special_diets?.length > 0 && (
              <div>
                <p className='text-sm text-gray-600 mb-2'>Dietary Accommodations</p>
                <div className='flex flex-wrap gap-2'>
                  {watchedValues.special_diets.map(diet => (
                    <Badge key={diet} variant='secondary'>
                      {diet}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const stepTitles = [
    'Basic Information',
    'Services & Cuisine',
    'Capacity & Details',
    'Review & Submit',
  ];

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='bg-white border-b shadow-sm'>
        <div className='max-w-4xl mx-auto px-4 py-6'>
          <Button variant='ghost' onClick={() => navigate('/caterers')} className='mb-4'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Caterers
          </Button>
          <div className='text-center'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>List Your Catering Business</h1>
            <p className='text-gray-600'>
              Join our platform and connect with customers looking for amazing catering services
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className='bg-white border-b'>
        <div className='max-w-4xl mx-auto px-4 py-6'>
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>Progress</span>
              <span className='text-sm text-gray-600'>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className='h-2' />
          </div>

          <div className='flex items-center justify-between'>
            {stepTitles.map((title, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;

              return (
                <div key={stepNumber} className='flex items-center'>
                  <div
                    className={`
                    flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all
                    ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : isCompleted
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-gray-200 text-gray-600'
                    }
                  `}
                  >
                    {isCompleted ? (
                      <Check className='w-5 h-5' />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <div className='ml-3 hidden sm:block'>
                    <span
                      className={`text-sm font-medium ${
                        isActive
                          ? 'text-primary'
                          : isCompleted
                            ? 'text-green-600'
                            : 'text-gray-500'
                      }`}
                    >
                      {title}
                    </span>
                  </div>
                  {stepNumber < stepTitles.length && (
                    <div
                      className={`w-8 h-0.5 mx-4 transition-colors ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <Card className='shadow-lg'>
          <CardHeader className='text-center'>
            <CardTitle className='text-xl'>
              Step {currentStep}: {stepTitles[currentStep - 1]}
            </CardTitle>
          </CardHeader>
          <CardContent className='p-8'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}

                {/* Navigation Buttons */}
                <div className='flex justify-between pt-8 border-t'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className='px-8'
                  >
                    Previous
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button
                      type='button'
                      onClick={handleNext}
                      className='px-8'
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type='submit'
                      disabled={createCatererMutation.isPending}
                      className='px-8'
                    >
                      {createCatererMutation.isPending ? 'Submitting...' : 'Submit for Review'}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CatererListingForm;