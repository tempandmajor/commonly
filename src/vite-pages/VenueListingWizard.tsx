import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  MapPin,
  Users,
  DollarSign,
  Camera,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  Home,
  Wifi,
  Car,
  Coffee,
  Music,
  Utensils,
  Lightbulb,
  Accessibility,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { VenueFormData, VenueListingStep } from '@/types/venue';
import AppLayout from '@/components/layout/AppLayout';

const STEPS: { key: VenueListingStep; title: string; description: string }[] = [
  {
    key: 'basic_info',
    title: 'Basic Information',
    description: 'Tell us about your venue',
  },
  {
    key: 'location',
    title: 'Location',
    description: 'Where is your venue located?',
  },
  {
    key: 'media',
    title: 'Photos',
    description: 'Show off your space',
  },
  {
    key: 'amenities',
    title: 'Amenities',
    description: 'What does your venue offer?',
  },
  {
    key: 'pricing',
    title: 'Pricing',
    description: 'Set your rates',
  },
  {
    key: 'availability',
    title: 'Availability',
    description: 'When is your venue available?',
  },
  {
    key: 'policies',
    title: 'Policies',
    description: 'Set your rules and policies',
  },
  {
    key: 'review',
    title: 'Review',
    description: 'Review and publish',
  },
];

const VENUE_TYPES = [
  'Event Hall',
  'Conference Room',
  'Outdoor Space',
  'Restaurant',
  'Gallery',
  'Theater',
  'Studio',
  'Warehouse',
  'Rooftop',
  'Community Center',
  'Other',
];

const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: Wifi, category: 'basic' },
  { id: 'parking', label: 'Parking', icon: Car, category: 'basic' },
  { id: 'kitchen', label: 'Kitchen', icon: Utensils, category: 'catering' },
  { id: 'bar', label: 'Bar Service', icon: Coffee, category: 'catering' },
  { id: 'sound_system', label: 'Sound System', icon: Music, category: 'technology' },
  { id: 'lighting', label: 'Professional Lighting', icon: Lightbulb, category: 'technology' },
  { id: 'stage', label: 'Stage/Platform', icon: Home, category: 'basic' },
  { id: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: Accessibility, category: 'accessibility' },
  { id: 'air_conditioning', label: 'Air Conditioning', icon: Home, category: 'basic' },
  { id: 'heating', label: 'Heating', icon: Home, category: 'basic' },
  { id: 'security', label: 'Security System', icon: Shield, category: 'basic' },
  { id: 'catering_available', label: 'Catering Available', icon: Utensils, category: 'catering' },
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

const VenueListingWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<VenueListingStep>('basic_info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(true);

  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    description: '',
    venue_type: '',
    capacity: 0,
    address: '',
    city: '',
    state: '',
    country: 'United States',
    postal_code: '',
    base_price_per_hour: 0,
    minimum_booking_hours: 2,
    security_deposit: 0,
    cleaning_fee: 0,
    amenities: [],
    accessibility_features: [],
    gallery_images: [],
    house_rules: [],
    cancellation_policy: 'moderate',
    ...(user && { contact_email: user.email || '' }),
    contact_phone: '',
    available_days: [],
    available_hours_start: '09:00',
    available_hours_end: '22:00',
    instant_booking_enabled: false,
    terms_accepted: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentStepIndex = STEPS.findIndex(step => step.key === currentStep);

  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const updateFormData = useCallback((updates: Partial<VenueFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDraft(true);

  }, []);

  const validateStep = (step: VenueListingStep): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'basic_info':
        if (!formData.name.trim()) newErrors.name = 'Venue name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.venue_type) newErrors.venue_type = 'Venue type is required';
        if (!formData.capacity || formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1';
        break;

      case 'location':
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.postal_code.trim()) newErrors.postal_code = 'Postal code is required';
        break;

      case 'media':
        if (formData.gallery_images.length === 0) {
          newErrors.gallery_images = 'At least one photo is required';
        }
        break;

      case 'amenities':
        if (formData.amenities.length === 0) {
          newErrors.amenities = 'Please select at least one amenity';
        }
        break;

      case 'pricing':
        if (!formData.base_price_per_hour || formData.base_price_per_hour < 1) {
          newErrors.base_price_per_hour = 'Hourly rate must be at least $1';
        }
        if (!formData.minimum_booking_hours || formData.minimum_booking_hours < 1) {
          newErrors.minimum_booking_hours = 'Minimum booking must be at least 1 hour';
        }
        break;

      case 'availability':
        if (formData.available_days.length === 0) {
          newErrors.available_days = 'Please select at least one available day';
        }
        if (!formData.available_hours_start) {
          newErrors.available_hours_start = 'Start time is required';
        }
        if (!formData.available_hours_end) {
          newErrors.available_hours_end = 'End time is required';
        }
        break;

      case 'policies':
        if (formData.house_rules.length === 0) {
          newErrors.house_rules = 'Please add at least one house rule';
        }
        break;

      case 'review':
        if (!formData.terms_accepted) {
          newErrors.terms_accepted = 'You must accept the terms and conditions';
        }
        break;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < STEPS.length) {
        setCurrentStep(STEPS[nextIndex].key);
      }
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  };

  const saveDraft = async () => {
    if (!user) {
      toast.error('Please log in to save your listing');
      return;
    }

    try {
      // Save draft to localStorage for now
      localStorage.setItem('venue_listing_draft', JSON.stringify(formData));
      setIsDraft(false);
      toast.success('Draft saved');
    } catch (error) {
      toast.error('Failed to save draft');
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newImages: File[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          toast.error(`${file.name} is too large. Maximum size is 10MB.`);
          return;
        }
        newImages.push(file);
      }
    });

    if (newImages.length > 0) {
      updateFormData({
        gallery_images: [...formData.gallery_images, ...newImages].slice(0, 10) // Max 10 images
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.gallery_images.filter((_, i) => i !== index);
    updateFormData({ gallery_images: newImages });
  };

  const addHouseRule = (rule: string) => {
    if (rule.trim()) {
      updateFormData({
        house_rules: [...formData.house_rules, rule.trim()]
      });
    }
  };

  const removeHouseRule = (index: number) => {
    const newRules = formData.house_rules.filter((_, i) => i !== index);
    updateFormData({ house_rules: newRules });
  };

  const submitListing = async () => {
    if (!validateStep('review')) return;

    if (!user) {
      toast.error('Please log in to submit your listing');
      return;
    }

    setIsSubmitting(true);

    try {
      // First, create location record
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .insert({
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postal_code: formData.postal_code,
        })
        .select()
        .single();

      if (locationError) throw locationError;

      // Upload images (simulate for now)
      const imageUrls = formData.gallery_images.map((_, index) =>
        `https://images.unsplash.com/photo-${1507003211169 + index}?w=800&h=600&fit=crop`
      );

      // Create venue record
      const venueData = {
        name: formData.name,
        description: formData.description,
        venue_type: formData.venue_type,
        capacity: formData.capacity,
        location_id: locationData.id,
        owner_id: user.id,
        base_price_per_hour: formData.base_price_per_hour,
        minimum_booking_hours: formData.minimum_booking_hours,
        security_deposit: formData.security_deposit,
        cleaning_fee: formData.cleaning_fee,
        amenities: formData.amenities,
        gallery_images: imageUrls,
        cover_image: imageUrls[0],
        house_rules: formData.house_rules,
        cancellation_policy: formData.cancellation_policy,
        available_days: formData.available_days,
        available_hours_start: formData.available_hours_start,
        available_hours_end: formData.available_hours_end,
        instant_booking_enabled: formData.instant_booking_enabled,
        status: 'pending', // Requires approval
        featured: false,
        verified: false,
      };

      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert(venueData)
        .select()
        .single();

      if (venueError) throw venueError;

      // Clear draft
      localStorage.removeItem('venue_listing_draft');

      toast.success('Venue listing submitted for review!');
      navigate('/venue/verification-complete');
    } catch (error) {
      console.error('Error submitting venue:', error);
      toast.error('Failed to submit venue listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'basic_info':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-[#2B2B2B]">Venue Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: (e.target as HTMLInputElement).value })}
                className={`border-gray-300 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="e.g., Downtown Event Hall"
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="description" className="text-[#2B2B2B]">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: (e.target as HTMLInputElement).value })}
                className={`border-gray-300 ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Describe your venue, its unique features, and what makes it special..."
                rows={4}
              />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="venue_type" className="text-[#2B2B2B]">Venue Type *</Label>
                <Select
                  value={formData.venue_type}
                  onValueChange={(value) => updateFormData({ venue_type: value })}
                >
                  <SelectTrigger className={`border-gray-300 ${errors.venue_type ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select venue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENUE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.venue_type && <p className="text-sm text-red-600 mt-1">{errors.venue_type}</p>}
              </div>

              <div>
                <Label htmlFor="capacity" className="text-[#2B2B2B]">Maximum Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => updateFormData({ capacity: parseInt((e.target as HTMLInputElement).value) || 0 })}
                  className={`border-gray-300 ${errors.capacity ? 'border-red-500' : ''}`}
                  placeholder="e.g., 100"
                  min="1"
                />
                {errors.capacity && <p className="text-sm text-red-600 mt-1">{errors.capacity}</p>}
              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="address" className="text-[#2B2B2B]">Street Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData({ address: (e.target as HTMLInputElement).value })}
                  className={`pl-10 border-gray-300 ${errors.address ? 'border-red-500' : ''}`}
                  placeholder="123 Main Street"
                />
              </div>
              {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="city" className="text-[#2B2B2B]">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData({ city: (e.target as HTMLInputElement).value })}
                  className={`border-gray-300 ${errors.city ? 'border-red-500' : ''}`}
                  placeholder="New York"
                />
                {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
              </div>

              <div>
                <Label htmlFor="state" className="text-[#2B2B2B]">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => updateFormData({ state: value })}
                >
                  <SelectTrigger className={`border-gray-300 ${errors.state ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && <p className="text-sm text-red-600 mt-1">{errors.state}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="postal_code" className="text-[#2B2B2B]">Postal Code *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => updateFormData({ postal_code: (e.target as HTMLInputElement).value })}
                  className={`border-gray-300 ${errors.postal_code ? 'border-red-500' : ''}`}
                  placeholder="10001"
                />
                {errors.postal_code && <p className="text-sm text-red-600 mt-1">{errors.postal_code}</p>}
              </div>

              <div>
                <Label htmlFor="country" className="text-[#2B2B2B]">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  readOnly
                  className="border-gray-300 bg-gray-50"
                />
              </div>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-[#2B2B2B]">Venue Photos *</Label>
              <p className="text-sm text-gray-600 mb-4">
                Upload high-quality photos that showcase your venue. The first photo will be your cover image.
              </p>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-[#2B2B2B] ${
                  errors.gallery_images ? 'border-red-500' : 'border-gray-300'
                }`}
                onClick={() => (document.getElementById('file-upload') as HTMLElement)?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-[#2B2B2B] mb-2">
                  Upload your venue photos
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop images here, or click to browse
                </p>
                <Button type="button" variant="outline" className="border-gray-300">
                  <Camera className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload((e.target as HTMLInputElement).files)}
                />
              </div>
              {errors.gallery_images && <p className="text-sm text-red-600 mt-1">{errors.gallery_images}</p>}
            </div>

            {formData.gallery_images.length > 0 && (
              <div>
                <h4 className="font-medium text-[#2B2B2B] mb-3">
                  Uploaded Photos ({formData.gallery_images.length}/10)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.gallery_images.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2 bg-[#2B2B2B] text-white">
                          Cover Photo
                        </Badge>
                      )}
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        );

      case 'amenities':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-[#2B2B2B]">Venue Amenities *</Label>
              <p className="text-sm text-gray-600 mb-4">
                Select all amenities and features available at your venue.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AMENITIES.map((amenity) => (
                <div
                  key={amenity.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.amenities.includes(amenity.id)
                      ? 'border-[#2B2B2B] bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => {
                    const newAmenities = formData.amenities.includes(amenity.id)
                      ? formData.amenities.filter(a => a !== amenity.id)
                      : [...formData.amenities, amenity.id];
                    updateFormData({ amenities: newAmenities });
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={formData.amenities.includes(amenity.id)}
                      readOnly
                    />
                    <amenity.icon className="h-5 w-5 text-[#2B2B2B]" />
                    <span className="font-medium text-[#2B2B2B]">{amenity.label}</span>
                  </div>
                </div>
              ))}
            </div>
            {errors.amenities && <p className="text-sm text-red-600">{errors.amenities}</p>}
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="base_price_per_hour" className="text-[#2B2B2B]">Hourly Rate *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="base_price_per_hour"
                    type="number"
                    value={formData.base_price_per_hour || ''}
                    onChange={(e) => updateFormData({ base_price_per_hour: parseFloat((e.target as HTMLInputElement).value) || 0 })}
                    className={`pl-10 border-gray-300 ${errors.base_price_per_hour ? 'border-red-500' : ''}`}
                    placeholder="150"
                    min="1"
                  />
                </div>
                {errors.base_price_per_hour && (
                  <p className="text-sm text-red-600 mt-1">{errors.base_price_per_hour}</p>
                )}
              </div>

              <div>
                <Label htmlFor="minimum_booking_hours" className="text-[#2B2B2B]">Minimum Booking Hours *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="minimum_booking_hours"
                    type="number"
                    value={formData.minimum_booking_hours || ''}
                    onChange={(e) => updateFormData({ minimum_booking_hours: parseInt((e.target as HTMLInputElement).value) || 0 })}
                    className={`pl-10 border-gray-300 ${errors.minimum_booking_hours ? 'border-red-500' : ''}`}
                    placeholder="2"
                    min="1"
                  />
                </div>
                {errors.minimum_booking_hours && (
                  <p className="text-sm text-red-600 mt-1">{errors.minimum_booking_hours}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="security_deposit" className="text-[#2B2B2B]">Security Deposit</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="security_deposit"
                    type="number"
                    value={formData.security_deposit || ''}
                    onChange={(e) => updateFormData({ security_deposit: parseFloat((e.target as HTMLInputElement).value) || 0 })}
                    className="pl-10 border-gray-300"
                    placeholder="300"
                    min="0"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">Refundable deposit for damages</p>
              </div>

              <div>
                <Label htmlFor="cleaning_fee" className="text-[#2B2B2B]">Cleaning Fee</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="cleaning_fee"
                    type="number"
                    value={formData.cleaning_fee || ''}
                    onChange={(e) => updateFormData({ cleaning_fee: parseFloat((e.target as HTMLInputElement).value) || 0 })}
                    className="pl-10 border-gray-300"
                    placeholder="75"
                    min="0"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">One-time cleaning fee</p>
              </div>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-[#2B2B2B] mb-2">Pricing Example</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base rate ({formData.minimum_booking_hours || 2} hours)</span>
                    <span>${((formData.base_price_per_hour || 0) * (formData.minimum_booking_hours || 2)).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>${(formData.cleaning_fee || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security deposit</span>
                    <span>${(formData.security_deposit || 0).toFixed(0)}</span>
                  </div>
                  <div className="border-t pt-1 flex justify-between font-medium text-[#2B2B2B]">
                    <span>Total (minimum booking)</span>
                    <span>${((formData.base_price_per_hour || 0) * (formData.minimum_booking_hours || 2) + (formData.cleaning_fee || 0) + (formData.security_deposit || 0)).toFixed(0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-[#2B2B2B]">Available Days *</Label>
              <p className="text-sm text-gray-600 mb-4">
                Select the days when your venue is available for booking.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors text-center ${
                      formData.available_days.includes(day.id)
                        ? 'border-[#2B2B2B] bg-gray-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => {
                      const newDays = formData.available_days.includes(day.id)
                        ? formData.available_days.filter(d => d !== day.id)
                        : [...formData.available_days, day.id];
                      updateFormData({ available_days: newDays });
                    }}
                  >
                    <Checkbox
                      checked={formData.available_days.includes(day.id)}
                      readOnly
                      className="mb-2"
                    />
                    <div className="font-medium text-[#2B2B2B]">{day.label}</div>
                  </div>
                ))}
              </div>
              {errors.available_days && <p className="text-sm text-red-600 mt-1">{errors.available_days}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="available_hours_start" className="text-[#2B2B2B]">Opening Time *</Label>
                <Input
                  id="available_hours_start"
                  type="time"
                  value={formData.available_hours_start}
                  onChange={(e) => updateFormData({ available_hours_start: (e.target as HTMLInputElement).value })}
                  className={`border-gray-300 ${errors.available_hours_start ? 'border-red-500' : ''}`}
                />
                {errors.available_hours_start && (
                  <p className="text-sm text-red-600 mt-1">{errors.available_hours_start}</p>
                )}
              </div>

              <div>
                <Label htmlFor="available_hours_end" className="text-[#2B2B2B]">Closing Time *</Label>
                <Input
                  id="available_hours_end"
                  type="time"
                  value={formData.available_hours_end}
                  onChange={(e) => updateFormData({ available_hours_end: (e.target as HTMLInputElement).value })}
                  className={`border-gray-300 ${errors.available_hours_end ? 'border-red-500' : ''}`}
                />
                {errors.available_hours_end && (
                  <p className="text-sm text-red-600 mt-1">{errors.available_hours_end}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="instant_booking"
                checked={formData.instant_booking_enabled}
                onCheckedChange={(checked) => updateFormData({ instant_booking_enabled: !!checked })}
              />
              <Label htmlFor="instant_booking" className="text-[#2B2B2B] cursor-pointer">
                Enable instant booking
              </Label>
            </div>
            <p className="text-sm text-gray-600 ml-6">
              Allow guests to book your venue immediately without waiting for approval.
            </p>
          </div>
        );

      case 'policies':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-[#2B2B2B]">House Rules *</Label>
              <p className="text-sm text-gray-600 mb-4">
                Set clear expectations for guests using your venue.
              </p>

              <div className="space-y-3">
                {formData.house_rules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="flex-1 text-sm">{rule}</span>
                    <button
                      onClick={() => removeHouseRule(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    placeholder="Add a house rule..."
                    className="border-gray-300"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addHouseRule((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addHouseRule(input.value);
                      input.value = '';
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
              {errors.house_rules && <p className="text-sm text-red-600 mt-1">{errors.house_rules}</p>}
            </div>

            <div>
              <Label className="text-[#2B2B2B]">Cancellation Policy</Label>
              <RadioGroup
                value={formData.cancellation_policy}
                onValueChange={(value) => updateFormData({ cancellation_policy: value as any })}
                className="mt-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flexible" id="flexible" />
                  <Label htmlFor="flexible" className="cursor-pointer">
                    <strong>Flexible:</strong> Full refund 24 hours prior to event
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="cursor-pointer">
                    <strong>Moderate:</strong> Full refund 5 days prior, 50% refund within 5 days
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="strict" id="strict" />
                  <Label htmlFor="strict" className="cursor-pointer">
                    <strong>Strict:</strong> Full refund 14 days prior, 50% refund within 14 days
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-[#2B2B2B]">Review Your Listing</CardTitle>
                <CardDescription>
                  Please review all information before submitting your venue listing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-[#2B2B2B] mb-2">Basic Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {formData.name}</p>
                      <p><strong>Type:</strong> {formData.venue_type}</p>
                      <p><strong>Capacity:</strong> {formData.capacity} guests</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#2B2B2B] mb-2">Location</h4>
                    <div className="space-y-1 text-sm">
                      <p>{formData.address}</p>
                      <p>{formData.city}, {formData.state} {formData.postal_code}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#2B2B2B] mb-2">Pricing</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Hourly Rate:</strong> ${formData.base_price_per_hour}</p>
                      <p><strong>Minimum Hours:</strong> {formData.minimum_booking_hours}</p>
                      <p><strong>Security Deposit:</strong> ${formData.security_deposit}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#2B2B2B] mb-2">Availability</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Days:</strong> {formData.available_days.join(', ')}</p>
                      <p><strong>Hours:</strong> {formData.available_hours_start} - {formData.available_hours_end}</p>
                      <p><strong>Instant Booking:</strong> {formData.instant_booking_enabled ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-[#2B2B2B] mb-2">Amenities ({formData.amenities.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.slice(0, 6).map((amenityId) => {
                      const amenity = AMENITIES.find(a => a.id === amenityId);
                      return amenity ? (
                        <Badge key={amenityId} variant="outline">
                          {amenity.label}
                        </Badge>
                      ) : null;
                    })}
                    {formData.amenities.length > 6 && (
                      <Badge variant="outline">
                        +{formData.amenities.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-[#2B2B2B] mb-2">Photos ({formData.gallery_images.length})</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {formData.gallery_images.slice(0, 4).map((file, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms_accepted"
                checked={formData.terms_accepted}
                onCheckedChange={(checked) => updateFormData({ terms_accepted: !!checked })}
              />
              <Label htmlFor="terms_accepted" className="text-[#2B2B2B] cursor-pointer">
                I agree to the Terms of Service and Privacy Policy
              </Label>
            </div>
            {errors.terms_accepted && <p className="text-sm text-red-600">{errors.terms_accepted}</p>}

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-[#2B2B2B] mb-1">What happens next?</h4>
                    <p className="text-sm text-gray-700">
                      Your venue listing will be reviewed by our team within 24-48 hours.
                      You'll receive an email notification once it's approved and live on the platform.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-[#2B2B2B] mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-6">
              You need to be signed in to list your venue on our platform.
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="bg-[#2B2B2B] hover:bg-gray-800 text-white"
            >
              Sign In to Continue
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-[#2B2B2B]">List Your Venue</h1>
                  <p className="text-gray-600 mt-1">
                    Share your space with event organizers and start earning income
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={!isDraft}
                  className="border-gray-300"
                >
                  {isDraft ? 'Save Draft' : 'Draft Saved'}
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#2B2B2B] font-medium">
                    Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex].title}
                  </span>
                  <span className="text-gray-600">{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Step Navigation */}
              <div className="mt-6 flex flex-wrap gap-2">
                {STEPS.map((step, index) => (
                  <button
                    key={step.key}
                    onClick={() => setCurrentStep(step.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      index <= currentStepIndex
                        ? 'bg-[#2B2B2B] text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}. {step.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-[#2B2B2B]">{STEPS[currentStepIndex].title}</CardTitle>
                <CardDescription>{STEPS[currentStepIndex].description}</CardDescription>
              </CardHeader>
              <CardContent>
                {renderStep()}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="border-gray-300"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-3">
                {currentStepIndex === STEPS.length - 1 ? (
                  <Button
                    onClick={submitListing}
                    disabled={isSubmitting}
                    className="bg-[#2B2B2B] hover:bg-gray-800 text-white"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    className="bg-[#2B2B2B] hover:bg-gray-800 text-white"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );

};

export default VenueListingWizard;