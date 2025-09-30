import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Users,
  DollarSign,
  MapPin,
  Star,
  Info,
  CheckCircle,
  ChefHat,
} from 'lucide-react';
import { EnhancedCaterer, CatererBooking, EVENT_TYPES } from '@/types/caterer';
import { supabase } from '@/integrations/supabase/client';

interface CatererBookingModalProps {
  caterer: EnhancedCaterer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingSuccess?: (booking: CatererBooking) => void | undefined;
}

interface BookingForm {
  event_title: string;
  event_type: string;
  event_description: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  guest_count: number;
  event_address: string;
  event_city: string;
  event_state: string;
  setup_location: 'indoor' | 'outdoor' | 'both';
  venue_type: string;
  service_style: string;
  dietary_requests: string[];
  special_requests: string;
  alcohol_service_requested: boolean;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  menu_selections: string[];
}

const CatererBookingModal: React.FC<CatererBookingModalProps> = ({
  caterer,
  open,
  onOpenChange,
  onBookingSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<BookingForm>({
    event_title: '',
    event_type: '',
    event_description: '',
    event_date: '',
    event_start_time: '',
    event_end_time: '',
    guest_count: 50,
    event_address: '',
    event_city: '',
    event_state: '',
    setup_location: 'indoor',
    venue_type: '',
    service_style: '',
    dietary_requests: [],
    special_requests: '',
    alcohol_service_requested: false,
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    menu_selections: [],
  });

  const calculateQuote = () => {
    if (!form.guest_count || form.guest_count < caterer.capacity.minimum_guests) {
      return null;
    }

    const baseAmount = form.guest_count * caterer.pricing.base_price_per_person;
    const serviceFee = baseAmount * (caterer.pricing.service_fee_percentage / 100);
    const deliveryFee = caterer.pricing.delivery_fee || 0;
    const setupFee = caterer.pricing.setup_fee || 0;
    const additionalFees = caterer.pricing.additional_fees.reduce((sum, fee) => sum + fee.amount, 0);

    // Calculate tax (assuming 8.5%)
    const subtotal = baseAmount + serviceFee + deliveryFee + setupFee + additionalFees;
    const taxAmount = subtotal * 0.085;
    const totalAmount = subtotal + taxAmount;

    const depositAmount = totalAmount * (caterer.pricing.deposit_percentage / 100);

    return {
      baseAmount,
      serviceFee,
      deliveryFee,
      setupFee,
      additionalFees,
      taxAmount,
      totalAmount,
      depositAmount,
      remainingBalance: totalAmount - depositAmount,
    };
  };

  const quote = calculateQuote();

  const handleInputChange = (field: keyof BookingForm, value: any) => {
    setForm(prev => ({
          ...prev,
      [field]: value,
    }));
  };

  const handleDietaryChange = (diet: string, checked: boolean) => {
    setForm(prev => ({
          ...prev,
      dietary_requests: checked
        ? [...prev.dietary_requests, diet]
        : prev.dietary_requests.filter(d => d !== diet),
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return form.event_title && form.event_type && form.event_date && form.event_start_time && form.event_end_time;
      case 2:
        return form.guest_count >= caterer.capacity.minimum_guests && form.event_address && form.event_city && form.event_state;
      case 3:
        return form.contact_name && form.contact_email && form.contact_phone;
      case 4:
        return quote !== null;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitBooking = async () => {
    if (!quote) {
      toast.error('Invalid booking details');
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData: Partial<CatererBooking> = {
        caterer_id: caterer.id,
        event_title: form.event_title,
        event_type: form.event_type,
        event_description: form.event_description,
        event_date: form.event_date,
        event_start_time: form.event_start_time,
        event_end_time: form.event_end_time,
        guest_count: form.guest_count,
        event_address: form.event_address,
        event_city: form.event_city,
        event_state: form.event_state,
        setup_location: form.setup_location,
        venue_type: form.venue_type,
        menu_selections: form.menu_selections.map(menuId => ({
          menu_id: menuId,
          menu_name: caterer.menus.find(m => m.id === menuId)?.name || '',
          guest_count: form.guest_count,
          customizations: '',
        })),
        service_style: form.service_style,
        dietary_requests: form.dietary_requests,
        special_requests: form.special_requests,
        alcohol_service_requested: form.alcohol_service_requested,
        base_cost: quote.baseAmount,
        additional_fees: quote.serviceFee + quote.deliveryFee + quote.setupFee + quote.additionalFees,
        tax_amount: quote.taxAmount,
        total_amount: quote.totalAmount,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email,
        status: 'pending',
        payment_status: 'pending',
      };

      const { data, error } = await supabase
        .from('caterer_bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from booking insert');

      toast.success('Booking request submitted successfully!');
      onBookingSuccess?.(data as any);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Failed to submit booking request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="event_title">Event Title *</Label>
        <Input
          id="event_title"
          value={form.event_title}
          onChange={(e) => handleInputChange('event_title', (e.target as HTMLInputElement).value)}
          placeholder="e.g., Sarah's Wedding Reception"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="event_type">Event Type *</Label>
        <Select value={form.event_type} onValueChange={(value) => handleInputChange('event_type', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="event_description">Event Description</Label>
        <Textarea
          id="event_description"
          value={form.event_description}
          onChange={(e) => handleInputChange('event_description', e.target.value)}
          placeholder="Tell us more about your event..."
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="event_date">Event Date *</Label>
          <Input
            id="event_date"
            type="date"
            value={form.event_date}
            onChange={(e) => handleInputChange('event_date', (e.target as HTMLInputElement).value)}
            min={new Date().toISOString().split('T')[0]}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="event_start_time">Start Time *</Label>
          <Input
            id="event_start_time"
            type="time"
            value={form.event_start_time}
            onChange={(e) => handleInputChange('event_start_time', (e.target as HTMLInputElement).value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="event_end_time">End Time *</Label>
          <Input
            id="event_end_time"
            type="time"
            value={form.event_end_time}
            onChange={(e) => handleInputChange('event_end_time', (e.target as HTMLInputElement).value)}
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="guest_count">Number of Guests *</Label>
        <Input
          id="guest_count"
          type="number"
          value={form.guest_count}
          onChange={(e) => handleInputChange('guest_count', parseInt((e.target as HTMLInputElement).value) || 0)}
          min={caterer.capacity.minimum_guests}
          max={caterer.capacity.maximum_guests}
          className="mt-2"
        />
        <p className="text-sm text-gray-600 mt-1">
          Minimum: {caterer.capacity.minimum_guests}, Maximum: {caterer.capacity.maximum_guests}
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="event_address">Event Address *</Label>
        <Input
          id="event_address"
          value={form.event_address}
          onChange={(e) => handleInputChange('event_address', (e.target as HTMLInputElement).value)}
          placeholder="Street address"
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event_city">City *</Label>
          <Input
            id="event_city"
            value={form.event_city}
            onChange={(e) => handleInputChange('event_city', (e.target as HTMLInputElement).value)}
            placeholder="City"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="event_state">State *</Label>
          <Input
            id="event_state"
            value={form.event_state}
            onChange={(e) => handleInputChange('event_state', (e.target as HTMLInputElement).value)}
            placeholder="State"
            className="mt-2"
          />
        </div>
      </div>

      <div>
        <Label>Setup Location</Label>
        <Select value={form.setup_location} onValueChange={(value: any) => handleInputChange('setup_location', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="indoor">Indoor</SelectItem>
            <SelectItem value="outdoor">Outdoor</SelectItem>
            <SelectItem value="both">Both Indoor & Outdoor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="venue_type">Venue Type</Label>
        <Input
          id="venue_type"
          value={form.venue_type}
          onChange={(e) => handleInputChange('venue_type', (e.target as HTMLInputElement).value)}
          placeholder="e.g., Wedding venue, Corporate office, Private home"
          className="mt-2"
        />
      </div>

      <div>
        <Label>Service Style</Label>
        <Select value={form.service_style} onValueChange={(value) => handleInputChange('service_style', value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select service style" />
          </SelectTrigger>
          <SelectContent>
            {caterer.service_types.map(service => (
              <SelectItem key={service} value={service}>{service}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu selection */}
      {caterer.menus.length > 0 && (
        <div>
          <Label>Select Menus (optional)</Label>
          <div className="mt-2 space-y-2">
            {caterer.menus.map(menu => (
              <div key={menu.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={`menu-${menu.id}`}
                  checked={form.menu_selections.includes(menu.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleInputChange('menu_selections', [...form.menu_selections, menu.id]);
                    } else {
                      handleInputChange('menu_selections', form.menu_selections.filter(id => id !== menu.id));
                    }
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor={`menu-${menu.id}`} className="font-medium">{menu.name}</Label>
                  <p className="text-sm text-gray-600">{menu.description}</p>
                  <p className="text-sm font-medium">${menu.price_per_person}/person</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dietary requests */}
      {caterer.dietary_accommodations.length > 0 && (
        <div>
          <Label>Dietary Accommodations</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {caterer.dietary_accommodations.map(diet => (
              <div key={diet} className="flex items-center space-x-2">
                <Checkbox
                  id={`diet-${diet}`}
                  checked={form.dietary_requests.includes(diet)}
                  onCheckedChange={(checked) => handleDietaryChange(diet, checked as boolean)}
                />
                <Label htmlFor={`diet-${diet}`} className="text-sm">{diet}</Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="alcohol_service"
          checked={form.alcohol_service_requested}
          onCheckedChange={(checked) => handleInputChange('alcohol_service_requested', checked)}
          disabled={!caterer.policies.alcohol_service}
        />
        <Label htmlFor="alcohol_service" className="text-sm">
          Alcohol service requested
          {!caterer.policies.alcohol_service && <span className="text-gray-500"> (Not available)</span>}
        </Label>
      </div>

      <div>
        <Label htmlFor="special_requests">Special Requests</Label>
        <Textarea
          id="special_requests"
          value={form.special_requests}
          onChange={(e) => handleInputChange('special_requests', e.target.value)}
          placeholder="Any special requirements or requests..."
          className="mt-2"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="contact_name">Contact Name *</Label>
        <Input
          id="contact_name"
          value={form.contact_name}
          onChange={(e) => handleInputChange('contact_name', (e.target as HTMLInputElement).value)}
          placeholder="Your full name"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="contact_email">Email Address *</Label>
        <Input
          id="contact_email"
          type="email"
          value={form.contact_email}
          onChange={(e) => handleInputChange('contact_email', (e.target as HTMLInputElement).value)}
          placeholder="your@email.com"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="contact_phone">Phone Number *</Label>
        <Input
          id="contact_phone"
          type="tel"
          value={form.contact_phone}
          onChange={(e) => handleInputChange('contact_phone', (e.target as HTMLInputElement).value)}
          placeholder="(555) 123-4567"
          className="mt-2"
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">What happens next?</h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• {caterer.name} will review your request</li>
              <li>• They typically respond within {caterer.owner.response_time_hours} hours</li>
              <li>• You'll receive a detailed quote and proposal</li>
              <li>• You can discuss customizations before confirming</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    if (!quote) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Please complete the previous steps to see pricing details.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Booking Summary */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-[#2B2B2B] mb-4">Booking Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Event:</span>
                <span className="font-medium">{form.event_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span>{form.event_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Date(form.event_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span>{form.event_start_time} - {form.event_end_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guests:</span>
                <span>{form.guest_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span>{form.event_city}, {form.event_state}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-[#2B2B2B] mb-4">Estimated Pricing</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Catering ({form.guest_count} × ${caterer.pricing.base_price_per_person})
                </span>
                <span>${quote.baseAmount.toFixed(2)}</span>
              </div>
              {quote.serviceFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Service fee ({caterer.pricing.service_fee_percentage}%)</span>
                  <span>${quote.serviceFee.toFixed(2)}</span>
                </div>
              )}
              {quote.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery fee</span>
                  <span>${quote.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {quote.setupFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Setup fee</span>
                  <span>${quote.setupFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (8.5%)</span>
                <span>${quote.taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Estimate</span>
                <span>${quote.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-[#2B2B2B] mb-4">Payment Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Deposit required ({caterer.pricing.deposit_percentage}%)</span>
                <span className="font-medium">${quote.depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balance due at event</span>
                <span>${quote.remainingBalance.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">Important Notes</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• This is an estimate - final pricing may vary based on menu selections and customizations</li>
                  <li>• Booking is not confirmed until approved by the caterer</li>
                  <li>• Cancellation policy: {caterer.policies.cancellation_policy}</li>
                  <li>• Payment is required only after booking confirmation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ChefHat className="h-5 w-5" />
            Request Quote from {caterer.name}
          </DialogTitle>
        </DialogHeader>

        {/* Caterer Info */}
        <Card className="border border-gray-200 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {caterer.media.cover_image && (
                  <img
                    src={caterer.media.cover_image}
                    alt={caterer.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#2B2B2B] mb-1">{caterer.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{caterer.location.city}, {caterer.location.state}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{caterer.capacity.minimum_guests}-{caterer.capacity.maximum_guests} guests</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>${caterer.pricing.base_price_per_person}/person</span>
                  </div>
                  {caterer.analytics.average_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{caterer.analytics.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-[#2B2B2B] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              {step < 4 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-[#2B2B2B]' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="grid grid-cols-4 gap-4 mb-8 text-center">
          <div className="text-sm">
            <div className="font-medium text-[#2B2B2B]">Event Details</div>
            <div className="text-gray-500">Basic information</div>
          </div>
          <div className="text-sm">
            <div className="font-medium text-[#2B2B2B]">Service Details</div>
            <div className="text-gray-500">Location & preferences</div>
          </div>
          <div className="text-sm">
            <div className="font-medium text-[#2B2B2B]">Contact Info</div>
            <div className="text-gray-500">Your details</div>
          </div>
          <div className="text-sm">
            <div className="font-medium text-[#2B2B2B]">Review & Submit</div>
            <div className="text-gray-500">Final details</div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="bg-[#2B2B2B] hover:bg-gray-800 text-white"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={submitBooking}
              disabled={isSubmitting || !quote}
              className="bg-[#2B2B2B] hover:bg-gray-800 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CatererBookingModal;