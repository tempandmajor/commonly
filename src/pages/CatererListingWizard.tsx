import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  ChefHat,
  MapPin,
  DollarSign,
  Camera,
  FileText,
  Shield,
  CheckCircle,
  Info,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  CatererFormData,
  CatererListingStep,
  CUISINE_TYPES,
  SERVICE_TYPES,
  DIETARY_ACCOMMODATIONS,
} from '@/types/caterer';

const STEPS: { key: CatererListingStep; title: string; description: string }[] = [
  { key: 'basic_info', title: 'Basic Information', description: 'Tell us about your catering business' },
  { key: 'location', title: 'Location & Service', description: 'Where do you operate?' },
  { key: 'services', title: 'Services & Cuisine', description: 'What do you offer?' },
  { key: 'pricing', title: 'Pricing & Capacity', description: 'Set your rates and limits' },
  { key: 'menus', title: 'Sample Menus', description: 'Showcase your offerings' },
  { key: 'media', title: 'Photos & Media', description: 'Show off your work' },
  { key: 'policies', title: 'Policies & Terms', description: 'Set your business rules' },
  { key: 'verification', title: 'Verification', description: 'Upload required documents' },
  { key: 'review', title: 'Review & Submit', description: 'Review everything before going live' },
];

const CatererListingWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CatererFormData>({
    name: '',
    description: '',
    business_type: '',
    cuisine_types: [],
    service_types: [],
    specialties: [],
    address: '',
    city: '',
    state: '',
    country: 'US',
    postal_code: '',
    service_radius_km: 25,
    business_email: '',
    business_phone: '',
    website_url: '',
    minimum_guests: 10,
    maximum_guests: 200,
    base_price_per_person: 25,
    minimum_order_amount: 250,
    price_range: '$$',
    gallery_images: [],
    menu_images: [],
    sample_menus: [],
    dietary_accommodations: [],
    cancellation_policy: 'moderate',
    deposit_percentage: 50,
    advance_booking_days: 7,
    terms_accepted: false,
    privacy_accepted: false,
  });

  const updateFormData = (field: keyof CatererFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: keyof CatererFormData, value: string) => {
    const current = formData[field] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFormData(field, updated);
  };

  const validateStep = (step: number): boolean => {
    const currentStepKey = STEPS[step].key;

    switch (currentStepKey) {
      case 'basic_info':
        return !!(formData.name && formData.description && formData.business_type);
      case 'location':
        return !!(formData.address && formData.city && formData.state && formData.postal_code && formData.business_email && formData.business_phone);
      case 'services':
        return formData.cuisine_types.length > 0 && formData.service_types.length > 0;
      case 'pricing':
        return formData.base_price_per_person > 0 && formData.minimum_order_amount > 0 && formData.minimum_guests > 0 && formData.maximum_guests > 0;
      case 'menus':
        return true; // Optional step
      case 'media':
        return true; // Optional step
      case 'policies':
        return !!(formData.cancellation_policy && formData.deposit_percentage > 0);
      case 'verification':
        return true; // Optional step
      case 'review':
        return formData.terms_accepted && formData.privacy_accepted;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleFileUpload = (files: FileList | null, field: 'cover_image' | 'gallery_images' | 'menu_images') => {
    if (!files) return;

    const fileArray = Array.from(files);

    if (field === 'cover_image') {
      updateFormData(field, fileArray[0]);
    } else {
      const currentFiles = formData[field] as File[];
      updateFormData(field, [...currentFiles, ...fileArray]);
    }
  };

  const removeFile = (field: 'gallery_images' | 'menu_images', index: number) => {
    const currentFiles = formData[field] as File[];
    const updated = currentFiles.filter((_, i) => i !== index);
    updateFormData(field, updated);
  };

  const addSampleMenu = () => {
    const newMenu = {
      name: '',
      description: '',
      price_per_person: 25,
      menu_type: 'buffet',
    };
    updateFormData('sample_menus', [...formData.sample_menus, newMenu]);
  };

  const updateSampleMenu = (index: number, field: string, value: any) => {
    const updated = formData.sample_menus.map((menu, i) =>
      i === index ? { ...menu, [field]: value } : menu
    );
    updateFormData('sample_menus', updated);
  };

  const removeSampleMenu = (index: number) => {
    const updated = formData.sample_menus.filter((_, i) => i !== index);
    updateFormData('sample_menus', updated);
  };

  const submitForm = async () => {
    setIsSubmitting(true);

    try {
      // Prepare the data for submission
      const catererData = {
        name: formData.name,
        description: formData.description,
        business_type: formData.business_type,
        cuisine_types: formData.cuisine_types,
        service_types: formData.service_types,
        specialties: formData.specialties,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        service_radius_km: formData.service_radius_km,
        business_email: formData.business_email,
        business_phone: formData.business_phone,
        website_url: formData.website_url,
        minimum_guests: formData.minimum_guests,
        maximum_guests: formData.maximum_guests,
        base_price_per_person: formData.base_price_per_person,
        minimum_order_amount: formData.minimum_order_amount,
        price_range: formData.price_range,
        dietary_accommodations: formData.dietary_accommodations,
        cancellation_policy: formData.cancellation_policy,
        deposit_percentage: formData.deposit_percentage,
        advance_booking_days: formData.advance_booking_days,
        status: 'pending',
        verified: false,
        featured: false,
      };

      const { data, error } = await supabase
        .from('caterers')
        .insert([catererData])
        .select()
        .single();

      if (error) throw error;

      // Handle file uploads if needed (would typically upload to storage and save URLs)
      // This is a simplified version - in production you'd upload files to Supabase Storage

      toast.success('Catering business listing submitted successfully!');
      navigate(`/caterers/verification-complete?catererId=${data.id}`);
    } catch (error) {
      console.error('Error submitting caterer listing:', error);
      toast.error('Failed to submit listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Business Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateFormData('name', (e.target as HTMLInputElement).value)}
          placeholder="e.g., Sarah's Catering Co."
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="business_type">Business Type *</Label>
        <Select value={formData.business_type} onValueChange={(value) => updateFormData('business_type', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select business type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individual Caterer</SelectItem>
            <SelectItem value="company">Catering Company</SelectItem>
            <SelectItem value="restaurant">Restaurant with Catering</SelectItem>
            <SelectItem value="food_truck">Food Truck</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Business Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData('description', (e.target as HTMLInputElement).value)}
          placeholder="Tell potential clients about your catering business, your style, and what makes you special..."
          className="mt-2"
          rows={4}
        />
        <p className="text-sm text-gray-600 mt-1">
          {formData.description.length}/500 characters
        </p>
      </div>

      <div>
        <Label>Specialties (optional)</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.specialties.map((specialty, index) => (
            <Badge key={index} className="bg-[#2B2B2B] text-white">
              {specialty}
              <button
                onClick={() => {
                  const updated = formData.specialties.filter((_, i) => i !== index);
                  updateFormData('specialties', updated);
                }}
                className="ml-2 hover:text-red-300"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          placeholder="Add a specialty (press Enter)"
          className="mt-2"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const value = e.currentTarget.value.trim();
              if (value && !formData.specialties.includes(value)) {
                updateFormData('specialties', [...formData.specialties, value]);
                e.currentTarget.value = '';
              }
            }
          }}
        />
        <p className="text-sm text-gray-600 mt-1">
          Examples: Farm-to-table, Organic, Kosher, BBQ Specialist, etc.
        </p>
      </div>
    </div>
  );

  const renderLocation = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="address">Business Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateFormData('address', (e.target as HTMLInputElement).value)}
          placeholder="Street address"
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData('city', (e.target as HTMLInputElement).value)}
            placeholder="City"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => updateFormData('state', (e.target as HTMLInputElement).value)}
            placeholder="State"
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="postal_code">Postal Code *</Label>
        <Input
          id="postal_code"
          value={formData.postal_code}
          onChange={(e) => updateFormData('postal_code', (e.target as HTMLInputElement).value)}
          placeholder="12345"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="service_radius">Service Radius (km)</Label>
        <Input
          id="service_radius"
          type="number"
          value={formData.service_radius_km}
          onChange={(e) => updateFormData('service_radius_km', parseInt((e.target as HTMLInputElement).value) || 25)}
          className="mt-2"
        />
        <p className="text-sm text-gray-600 mt-1">
          How far are you willing to travel for events?
        </p>
      </div>

      <Separator />

      <div>
        <Label htmlFor="business_email">Business Email *</Label>
        <Input
          id="business_email"
          type="email"
          value={formData.business_email}
          onChange={(e) => updateFormData('business_email', (e.target as HTMLInputElement).value)}
          placeholder="contact@yourcatering.com"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="business_phone">Business Phone *</Label>
        <Input
          id="business_phone"
          type="tel"
          value={formData.business_phone}
          onChange={(e) => updateFormData('business_phone', (e.target as HTMLInputElement).value)}
          placeholder="(555) 123-4567"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="website_url">Website (optional)</Label>
        <Input
          id="website_url"
          type="url"
          value={formData.website_url}
          onChange={(e) => updateFormData('website_url', (e.target as HTMLInputElement).value)}
          placeholder="https://yourcatering.com"
          className="mt-2"
        />
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      <div>
        <Label>Cuisine Types * (select all that apply)</Label>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {CUISINE_TYPES.slice(0, 15).map(cuisine => (
            <div key={cuisine} className="flex items-center space-x-2">
              <Checkbox
                id={`cuisine-${cuisine}`}
                checked={formData.cuisine_types.includes(cuisine)}
                onCheckedChange={() => handleArrayToggle('cuisine_types', cuisine)}
              />
              <Label htmlFor={`cuisine-${cuisine}`} className="text-sm">
                {cuisine}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Selected: {formData.cuisine_types.length} cuisine types
        </p>
      </div>

      <div>
        <Label>Service Types * (select all that apply)</Label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {SERVICE_TYPES.slice(0, 12).map(service => (
            <div key={service} className="flex items-center space-x-2">
              <Checkbox
                id={`service-${service}`}
                checked={formData.service_types.includes(service)}
                onCheckedChange={() => handleArrayToggle('service_types', service)}
              />
              <Label htmlFor={`service-${service}`} className="text-sm">
                {service}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Selected: {formData.service_types.length} service types
        </p>
      </div>

      <div>
        <Label>Dietary Accommodations (optional)</Label>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {DIETARY_ACCOMMODATIONS.slice(0, 12).map(diet => (
            <div key={diet} className="flex items-center space-x-2">
              <Checkbox
                id={`diet-${diet}`}
                checked={formData.dietary_accommodations.includes(diet)}
                onCheckedChange={() => handleArrayToggle('dietary_accommodations', diet)}
              />
              <Label htmlFor={`diet-${diet}`} className="text-sm">
                {diet}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minimum_guests">Minimum Guests *</Label>
          <Input
            id="minimum_guests"
            type="number"
            value={formData.minimum_guests}
            onChange={(e) => updateFormData('minimum_guests', parseInt((e.target as HTMLInputElement).value) || 0)}
            min={1}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="maximum_guests">Maximum Guests *</Label>
          <Input
            id="maximum_guests"
            type="number"
            value={formData.maximum_guests}
            onChange={(e) => updateFormData('maximum_guests', parseInt((e.target as HTMLInputElement).value) || 0)}
            min={formData.minimum_guests}
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="base_price_per_person">Base Price per Person * ($)</Label>
        <Input
          id="base_price_per_person"
          type="number"
          value={formData.base_price_per_person}
          onChange={(e) => updateFormData('base_price_per_person', parseFloat((e.target as HTMLInputElement).value) || 0)}
          min={0}
          step={0.01}
          className="mt-2"
        />
        <p className="text-sm text-gray-600 mt-1">
          This is your starting rate - you can adjust for specific events
        </p>
      </div>

      <div>
        <Label htmlFor="minimum_order_amount">Minimum Order Amount * ($)</Label>
        <Input
          id="minimum_order_amount"
          type="number"
          value={formData.minimum_order_amount}
          onChange={(e) => updateFormData('minimum_order_amount', parseFloat((e.target as HTMLInputElement).value) || 0)}
          min={0}
          step={0.01}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Price Range Category</Label>
        <Select value={formData.price_range} onValueChange={(value) => updateFormData('price_range', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="$">$ - Budget-friendly ($10-20 per person)</SelectItem>
            <SelectItem value="$$">$$ - Moderate ($20-40 per person)</SelectItem>
            <SelectItem value="$$$">$$$ - Premium ($40-75 per person)</SelectItem>
            <SelectItem value="$$$$">$$$$ - Luxury ($75+ per person)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Pricing Tips</h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Consider your food costs, labor, equipment, and profit margin</li>
              <li>• Research competitor pricing in your area</li>
              <li>• You can create custom quotes for specific events</li>
              <li>• Factor in setup, service, and cleanup time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMenus = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#2B2B2B]">Sample Menus</h3>
          <p className="text-gray-600">Add a few sample menus to showcase your offerings</p>
        </div>
        <Button onClick={addSampleMenu} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Menu
        </Button>
      </div>

      {formData.sample_menus.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <ChefHat className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No sample menus added yet</p>
          <Button onClick={addSampleMenu} className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Menu
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.sample_menus.map((menu, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium text-[#2B2B2B]">Menu {index + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSampleMenu(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Menu Name</Label>
                    <Input
                      value={menu.name}
                      onChange={(e) => updateSampleMenu(index, 'name', (e.target as HTMLInputElement).value)}
                      placeholder="e.g., Wedding Package A"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Menu Type</Label>
                    <Select
                      value={menu.menu_type}
                      onValueChange={(value) => updateSampleMenu(index, 'menu_type', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buffet">Buffet</SelectItem>
                        <SelectItem value="plated">Plated Service</SelectItem>
                        <SelectItem value="family_style">Family Style</SelectItem>
                        <SelectItem value="cocktail">Cocktail Reception</SelectItem>
                        <SelectItem value="box_lunch">Box Lunch</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Description</Label>
                  <Textarea
                    value={menu.description}
                    onChange={(e) => updateSampleMenu(index, 'description', (e.target as HTMLInputElement).value)}
                    placeholder="Describe what's included in this menu..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="mt-4">
                  <Label>Price per Person ($)</Label>
                  <Input
                    type="number"
                    value={menu.price_per_person}
                    onChange={(e) => updateSampleMenu(index, 'price_per_person', parseFloat((e.target as HTMLInputElement).value) || 0)}
                    min={0}
                    step={0.01}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderMedia = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#2B2B2B] mb-2">Cover Photo</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Upload a cover photo for your listing</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload((e.target as HTMLInputElement).files, 'cover_image')}
            className="hidden"
            id="cover-upload"
          />
          <Label htmlFor="cover-upload">
            <Button className="bg-[#2B2B2B] hover:bg-gray-800 text-white" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Choose Cover Photo
              </span>
            </Button>
          </Label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#2B2B2B] mb-2">Gallery Photos</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Upload photos of your food and events</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload((e.target as HTMLInputElement).files, 'gallery_images')}
            className="hidden"
            id="gallery-upload"
          />
          <Label htmlFor="gallery-upload">
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Add Gallery Photos
              </span>
            </Button>
          </Label>
        </div>

        {formData.gallery_images.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              {formData.gallery_images.length} photos selected
            </p>
            <div className="grid grid-cols-4 gap-2">
              {formData.gallery_images.map((file, index) => (
                <div key={index} className="relative">
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile('gallery_images', index)}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-white border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#2B2B2B] mb-2">Menu Photos</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Upload photos of your menus or menu items</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload((e.target as HTMLInputElement).files, 'menu_images')}
            className="hidden"
            id="menu-upload"
          />
          <Label htmlFor="menu-upload">
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Add Menu Photos
              </span>
            </Button>
          </Label>
        </div>

        {formData.menu_images.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              {formData.menu_images.length} menu photos selected
            </p>
            <div className="grid grid-cols-4 gap-2">
              {formData.menu_images.map((file, index) => (
                <div key={index} className="relative">
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Menu ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile('menu_images', index)}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-white border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-6">
      <div>
        <Label>Cancellation Policy *</Label>
        <Select value={formData.cancellation_policy} onValueChange={(value) => updateFormData('cancellation_policy', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flexible">Flexible - Free cancellation up to 48 hours</SelectItem>
            <SelectItem value="moderate">Moderate - Free cancellation up to 7 days</SelectItem>
            <SelectItem value="strict">Strict - 50% refund up to 14 days, no refund after</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="deposit_percentage">Deposit Percentage * (%)</Label>
        <Input
          id="deposit_percentage"
          type="number"
          value={formData.deposit_percentage}
          onChange={(e) => updateFormData('deposit_percentage', parseInt((e.target as HTMLInputElement).value) || 0)}
          min={0}
          max={100}
          className="mt-2"
        />
        <p className="text-sm text-gray-600 mt-1">
          Percentage of total amount required as deposit to secure booking
        </p>
      </div>

      <div>
        <Label htmlFor="advance_booking_days">Advance Booking Required (days)</Label>
        <Input
          id="advance_booking_days"
          type="number"
          value={formData.advance_booking_days}
          onChange={(e) => updateFormData('advance_booking_days', parseInt((e.target as HTMLInputElement).value) || 0)}
          min={0}
          className="mt-2"
        />
        <p className="text-sm text-gray-600 mt-1">
          Minimum number of days notice required for bookings
        </p>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Policy Guidelines</h4>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1">
              <li>• Clear policies help avoid misunderstandings with clients</li>
              <li>• Flexible policies may attract more bookings</li>
              <li>• Strict policies protect your business from last-minute cancellations</li>
              <li>• You can always adjust these later in your dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVerification = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-16 w-16 mx-auto text-[#2B2B2B] mb-4" />
        <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">Verification Documents</h3>
        <p className="text-gray-600">Upload documents to verify your business and build trust with clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm">Business License</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload((e.target as HTMLInputElement).files, 'cover_image')}
                className="hidden"
                id="license-upload"
              />
              <Label htmlFor="license-upload">
                <Button variant="outline" size="sm" asChild>
                  <span>Upload License</span>
                </Button>
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm">Insurance Certificate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload((e.target as HTMLInputElement).files, 'cover_image')}
                className="hidden"
                id="insurance-upload"
              />
              <Label htmlFor="insurance-upload">
                <Button variant="outline" size="sm" asChild>
                  <span>Upload Insurance</span>
                </Button>
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm">Health Permit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload((e.target as HTMLInputElement).files, 'cover_image')}
                className="hidden"
                id="permit-upload"
              />
              <Label htmlFor="permit-upload">
                <Button variant="outline" size="sm" asChild>
                  <span>Upload Permit</span>
                </Button>
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900">Verification Benefits</h4>
            <ul className="text-sm text-green-800 mt-2 space-y-1">
              <li>• Verified badge on your listing increases bookings by 40%</li>
              <li>• Higher search ranking and featured placement</li>
              <li>• Builds trust with potential clients</li>
              <li>• Access to premium features and support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
        <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">Review Your Listing</h3>
        <p className="text-gray-600">Please review all information before submitting your catering business listing</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#2B2B2B]">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Name:</strong> {formData.name}</div>
            <div><strong>Type:</strong> {formData.business_type}</div>
            <div><strong>Location:</strong> {formData.city}, {formData.state}</div>
            <div><strong>Email:</strong> {formData.business_email}</div>
            <div><strong>Phone:</strong> {formData.business_phone}</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#2B2B2B]">Services & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Cuisines:</strong> {formData.cuisine_types.length} types</div>
            <div><strong>Services:</strong> {formData.service_types.length} types</div>
            <div><strong>Capacity:</strong> {formData.minimum_guests}-{formData.maximum_guests} guests</div>
            <div><strong>Base Price:</strong> ${formData.base_price_per_person}/person</div>
            <div><strong>Price Range:</strong> {formData.price_range}</div>
          </CardContent>
        </Card>
      </div>

      {/* Terms and conditions */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={formData.terms_accepted}
                onCheckedChange={(checked) => updateFormData('terms_accepted', checked)}
              />
              <Label htmlFor="terms" className="text-sm leading-5">
                I agree to the <a href="/terms" className="text-[#2B2B2B] hover:underline">Terms of Service</a> and
                confirm that all information provided is accurate and that I have the right to list this catering business.
              </Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy"
                checked={formData.privacy_accepted}
                onCheckedChange={(checked) => updateFormData('privacy_accepted', checked)}
              />
              <Label htmlFor="privacy" className="text-sm leading-5">
                I agree to the <a href="/privacy" className="text-[#2B2B2B] hover:underline">Privacy Policy</a> and
                understand how my data will be used and displayed on the platform.
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">What happens next?</h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Your listing will be reviewed by our team (typically 1-2 business days)</li>
              <li>• You'll receive an email confirmation once approved</li>
              <li>• Your catering business will be live and bookable</li>
              <li>• You can manage your listing and bookings from your dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    const stepKey = STEPS[currentStep].key;

    switch (stepKey) {
      case 'basic_info': return renderBasicInfo();
      case 'location': return renderLocation();
      case 'services': return renderServices();
      case 'pricing': return renderPricing();
      case 'menus': return renderMenus();
      case 'media': return renderMedia();
      case 'policies': return renderPolicies();
      case 'verification': return renderVerification();
      case 'review': return renderReview();
      default: return null;
    }
  };

  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2B2B2B] mb-4">List Your Catering Business</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join our platform and start receiving catering requests from customers in your area.
            Complete all steps to create your professional listing.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Step {currentStep + 1} of {STEPS.length}</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-[#2B2B2B] mb-2">{currentStepData.title}</h2>
          <p className="text-gray-600">{currentStepData.description}</p>
        </div>

        {/* Step content */}
        <Card className="max-w-4xl mx-auto border border-gray-200">
          <CardContent className="p-8">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between max-w-4xl mx-auto mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="bg-[#2B2B2B] hover:bg-gray-800 text-white"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={submitForm}
              disabled={!validateStep(currentStep) || isSubmitting}
              className="bg-[#2B2B2B] hover:bg-gray-800 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Listing'}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default CatererListingWizard;