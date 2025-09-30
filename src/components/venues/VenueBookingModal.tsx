import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  MapPin,
  Star,
  Shield,
  Info,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import { EnhancedVenue, VenueBooking } from '@/types/venue';
import { supabase } from '@/integrations/supabase/client';

interface VenueBookingModalProps {
  venue: EnhancedVenue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingSuccess?: (booking: VenueBooking) => void | undefined;
}

interface BookingForm {
  event_title: string;
  event_type: string;
  event_description: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  guest_count: number;
  contact_phone: string;
  contact_email: string;
  special_requests: string;
  setup_requirements: string;
}

const VenueBookingModal: React.FC<VenueBookingModalProps> = ({
  venue,
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
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    guest_count: 1,
    contact_phone: '',
    contact_email: '',
    special_requests: '',
    setup_requirements: '',
  });

  const eventTypes = [
    'Wedding',
    'Corporate Event',
    'Birthday Party',
    'Anniversary',
    'Conference',
    'Workshop',
    'Photography Shoot',
    'Art Exhibition',
    'Networking Event',
    'Product Launch',
    'Other',
  ];

  const calculateBookingDetails = () => {
    if (!form.start_date || !form.start_time || !form.end_date || !form.end_time) {
      return null;
    }

    const startDateTime = new Date(`${form.start_date}T${form.start_time}`);
    const endDateTime = new Date(`${form.end_date}T${form.end_time}`);
    const hours = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60));

    if (hours < venue.pricing.minimum_booking_hours) {
      return null;
    }

    const baseAmount = hours * venue.pricing.base_price_per_hour;
    const cleaningFee = venue.pricing.cleaning_fee || 0;
    const securityDeposit = venue.pricing.security_deposit || 0;
    const serviceFeeAmount = baseAmount * (venue.pricing.service_fee_percentage || 0) / 100;
    const taxAmount = (baseAmount + cleaningFee + serviceFeeAmount) * 0.08; // 8% tax
    const totalAmount = baseAmount + cleaningFee + serviceFeeAmount + taxAmount;

    return {
      hours,
      baseAmount,
      cleaningFee,
      securityDeposit,
      serviceFeeAmount,
      taxAmount,
      totalAmount,
      dueToday: totalAmount * 0.5, // 50% deposit
      dueAtEvent: totalAmount * 0.5,
    };
  };

  const bookingDetails = calculateBookingDetails();

  const handleInputChange = (field: keyof BookingForm, value: string | number) => {
    setForm(prev => ({
          ...prev,
      [field]: value,
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return form.event_title && form.event_type && form.start_date && form.start_time && form.end_date && form.end_time;
      case 2:
        return form.guest_count > 0 && form.contact_email && form.contact_phone;
      case 3:
        return bookingDetails !== null;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitBooking = async () => {
    if (!bookingDetails) {
      toast.error('Invalid booking details');
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${form.start_date}T${form.start_time}`);
      const endDateTime = new Date(`${form.end_date}T${form.end_time}`);

      const bookingData: Partial<VenueBooking> = {
        venue_id: venue.id,
        event_title: form.event_title,
        event_type: form.event_type,
        event_description: form.event_description,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        guest_count: form.guest_count,
        total_hours: bookingDetails.hours,
        base_cost: bookingDetails.baseAmount,
        additional_fees: bookingDetails.cleaningFee + bookingDetails.serviceFeeAmount,
        tax_amount: bookingDetails.taxAmount,
        total_amount: bookingDetails.totalAmount,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email,
        special_requests: form.special_requests,
        setup_requirements: form.setup_requirements,
        status: 'pending',
        payment_status: 'pending',
      };

      const { data, error } = await supabase
        .from('venue_bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Booking request submitted successfully!');
      onBookingSuccess?.(data);
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
          placeholder="What's the occasion?"
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
            {eventTypes.map(type => (
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
          onChange={(e) => handleInputChange('event_description', (e.target as HTMLInputElement).value)}
          placeholder="Tell us more about your event..."
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={form.start_date}
            onChange={(e) => handleInputChange('start_date', (e.target as HTMLInputElement).value)}
            min={new Date().toISOString().split('T')[0]}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="start_time">Start Time *</Label>
          <Input
            id="start_time"
            type="time"
            value={form.start_time}
            onChange={(e) => handleInputChange('start_time', (e.target as HTMLInputElement).value)}
            className="mt-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="end_date">End Date *</Label>
          <Input
            id="end_date"
            type="date"
            value={form.end_date}
            onChange={(e) => handleInputChange('end_date', (e.target as HTMLInputElement).value)}
            min={form.start_date || new Date().toISOString().split('T')[0]}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="end_time">End Time *</Label>
          <Input
            id="end_time"
            type="time"
            value={form.end_time}
            onChange={(e) => handleInputChange('end_time', (e.target as HTMLInputElement).value)}
            className="mt-2"
          />
        </div>
      </div>

      {venue.pricing.minimum_booking_hours > 1 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <Info className="h-4 w-4" />
          <span>Minimum booking: {venue.pricing.minimum_booking_hours} hours</span>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="guest_count">Number of Guests *</Label>
        <Input
          id="guest_count"
          type="number"
          value={form.guest_count}
          onChange={(e) => handleInputChange('guest_count', parseInt((e.target as HTMLInputElement).value) || 1)}
          min={1}
          max={venue.capacity}
          className="mt-2"
        />
        <p className="text-sm text-gray-600 mt-1">Maximum capacity: {venue.capacity} guests</p>
      </div>

      <div>
        <Label htmlFor="contact_email">Contact Email *</Label>
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
        <Label htmlFor="contact_phone">Contact Phone *</Label>
        <Input
          id="contact_phone"
          type="tel"
          value={form.contact_phone}
          onChange={(e) => handleInputChange('contact_phone', (e.target as HTMLInputElement).value)}
          placeholder="(555) 123-4567"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="special_requests">Special Requests</Label>
        <Textarea
          id="special_requests"
          value={form.special_requests}
          onChange={(e) => handleInputChange('special_requests', (e.target as HTMLInputElement).value)}
          placeholder="Any special requirements or requests..."
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="setup_requirements">Setup Requirements</Label>
        <Textarea
          id="setup_requirements"
          value={form.setup_requirements}
          onChange={(e) => handleInputChange('setup_requirements', (e.target as HTMLInputElement).value)}
          placeholder="Describe any setup needs..."
          className="mt-2"
        />
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (!bookingDetails) {
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
                <span className="text-gray-600">Duration:</span>
                <span>{bookingDetails.hours} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guests:</span>
                <span>{form.guest_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Date(form.start_date).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-[#2B2B2B] mb-4">Pricing Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Base rate ({bookingDetails.hours}h × ${venue.pricing.base_price_per_hour})</span>
                <span>${bookingDetails.baseAmount.toFixed(2)}</span>
              </div>
              {bookingDetails.cleaningFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cleaning fee</span>
                  <span>${bookingDetails.cleaningFee.toFixed(2)}</span>
                </div>
              )}
              {bookingDetails.serviceFeeAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Service fee</span>
                  <span>${bookingDetails.serviceFeeAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>${bookingDetails.taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${bookingDetails.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Schedule */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-[#2B2B2B] mb-4">Payment Schedule</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Due today (50% deposit)</span>
                <span className="font-medium">${bookingDetails.dueToday.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due at event</span>
                <span>${bookingDetails.dueAtEvent.toFixed(2)}</span>
              </div>
              {bookingDetails.securityDeposit > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Security deposit (refundable)</span>
                  <span>${bookingDetails.securityDeposit.toFixed(2)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Policies */}
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-[#2B2B2B] mb-4">Cancellation Policy</h3>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="capitalize">{venue.policies.cancellation_policy} cancellation policy</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {venue.policies.cancellation_policy === 'flexible' &&
                'Free cancellation up to 24 hours before the event.'}
              {venue.policies.cancellation_policy === 'moderate' &&
                'Free cancellation up to 5 days before the event.'}
              {venue.policies.cancellation_policy === 'strict' &&
                'Non-refundable after booking confirmation.'}
            </p>
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
            <Calendar className="h-5 w-5" />
            Book {venue.name}
          </DialogTitle>
        </DialogHeader>

        {/* Venue Info */}
        <Card className="border border-gray-200 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {venue.media.cover_image && (
                  <img
                    src={venue.media.cover_image}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#2B2B2B] mb-1">{venue.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{venue.location.city}, {venue.location.state}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>Up to {venue.capacity}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{venue.analytics.average_rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
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
              {step < 3 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-[#2B2B2B]' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
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

          {currentStep < 3 ? (
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
              disabled={isSubmitting || !bookingDetails}
              className="bg-[#2B2B2B] hover:bg-gray-800 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VenueBookingModal;