import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Info, Shield, Loader2, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { calculateFees } from '@/services/fees/feeCalculator';

// Comprehensive type definitions
interface CatererDetails {
  id: string;
  name: string;
  pricePerPerson: number;
  minimumGuests: number;
  maximumGuests: number;
  ownerId: string;
}

interface SelectedMenuDetails {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface CateringBookingPaymentProps {
  caterer: CatererDetails;
  selectedMenu: SelectedMenuDetails | null;
  selectedDate: Date | null;
  selectedTime: string;
  guestCount: number;
  eventLocation: string;
  onBookingComplete: (bookingId: string) => void;
  onCancel: () => void;
}

interface CateringBookingFormData {
  eventType: string;
  eventName: string;
  contactPhone: string;
  contactEmail: string;
  specialRequests: string;
  dietaryRestrictions: string[];
  setupRequirements: string;
  paymentMethod: 'card' | 'bank' | '';
  agreedToTerms: boolean;
}

interface CreatorProgramStatus {
  isActive: boolean;
  discountPercentage: number;
}

interface PricingBreakdown {
  subtotal: number;
  creatorDiscount: number;
  platformFee: number;
  processingFee: number;
  total: number;
}

const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Kosher',
  'Halal',
  'Low-Sodium',
  'Diabetic-Friendly',
] as const;

const EVENT_TYPES = [
  'Wedding',
  'Corporate Event',
  'Birthday Party',
  'Anniversary',
  'Graduation',
  'Baby Shower',
  'Holiday Party',
  'Fundraiser',
  'Conference',
  'Other',
] as const;

const CateringBookingPayment: React.FC<CateringBookingPaymentProps> = ({
  caterer,
  selectedMenu,
  selectedDate,
  selectedTime,
  guestCount,
  eventLocation,
  onBookingComplete,
  onCancel,
}) => {
  // State management with proper typing
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatorProgram, setCreatorProgram] = useState<CreatorProgramStatus>({
    isActive: false,
    discountPercentage: 0,
  });
  const [_isLoadingCreatorStatus, setIsLoadingCreatorStatus] = useState(true);

  const [formData, setFormData] = useState<CateringBookingFormData>({
    eventType: '',
    eventName: '',
    contactPhone: '',
    contactEmail: user?.email || '',
    specialRequests: '',
    dietaryRestrictions: [],
    setupRequirements: '',
    paymentMethod: '',
    agreedToTerms: false,
  });

  // Calculate pricing with Creator Program support

  const pricing = useMemo((): PricingBreakdown => {
    const pricePerPerson = selectedMenu ? selectedMenu.price : caterer.pricePerPerson;
    const subtotal = pricePerPerson * guestCount;

    const creatorDiscount = creatorProgram.isActive
      ? subtotal * (creatorProgram.discountPercentage / 100)
      : 0;

    const afterDiscount = subtotal - creatorDiscount;
    const fees = calculateFees(afterDiscount);

    return {
      subtotal,
      creatorDiscount,
      platformFee: fees.platformFee,
      processingFee: fees.stripeFee,
      total: afterDiscount + fees.platformFee + fees.stripeFee,
    };

  }, [selectedMenu, caterer.pricePerPerson, guestCount, creatorProgram]);

  // Fetch caterer's Creator Program status

  useEffect(() => {
    const checkCreatorProgramStatus = async () => {
      try {
        if (!caterer.ownerId) return;

        setIsLoadingCreatorStatus(true);
        const { data, error } = await supabase
          .from('creator_program')
          .select('status, discount_percentage')
          .eq('user_id', caterer.ownerId)
          .eq('status', 'active')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking creator program status:', error);
          return;
        }

        if (data) {
          const typedData = data as any;
          setCreatorProgram({
            isActive: true,
            discountPercentage: typedData.discount_percentage || 10,
          });
        }
      } catch (error) {
        console.error('Error checking creator program status:', error);
      } finally {
        setIsLoadingCreatorStatus(false);
      }
    };

    checkCreatorProgramStatus();

  }, [caterer.ownerId]);

  // Form update handlers
  const updateFormData = useCallback(<K extends keyof CateringBookingFormData>(
    key: K,
    value: CateringBookingFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleDietaryRestrictionToggle = useCallback((restriction: string) => {
    setFormData(prev => ({
          ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction],
    }));
  }, []);

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      formData.eventType &&
      formData.eventName &&
      formData.contactPhone &&
      formData.contactEmail &&
      formData.paymentMethod &&
      formData.agreedToTerms
    );
  }, [formData]);

  // Submit booking handler
  const handleSubmitBooking = async () => {
    if (!user || !selectedDate || !isFormValid) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      const bookingData = {
        caterer_id: caterer.id,
        customer_id: user.id,
        event_type: formData.eventType,
        event_name: formData.eventName,
        event_date: selectedDate.toISOString(),
        event_time: selectedTime,
        guest_count: guestCount,
        event_location: eventLocation,
          ...(selectedMenu ? { selected_menu_id: selectedMenu.id } : {}),
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail,
        special_requests: formData.specialRequests,
        dietary_restrictions: formData.dietaryRestrictions,
        setup_requirements: formData.setupRequirements,
        subtotal: pricing.subtotal,
        creator_discount: pricing.creatorDiscount,
        platform_fee: pricing.platformFee,
        processing_fee: pricing.processingFee,
        total_amount: pricing.total,
        payment_method: formData.paymentMethod,
        status: 'pending',
        created_at: new Date().toISOString(),

      };

      const { data: booking, error } = await supabase
        .from('catering_bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      const typedBooking = booking as any;
      toast.success('Booking submitted successfully!');
      onBookingComplete(typedBooking.id);
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#2B2B2B]">
            <ChefHat className="h-5 w-5" />
            Complete Your Catering Booking
          </CardTitle>
          <CardDescription>
            Please provide event details and payment information to finalize your booking with {caterer.name}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-[#2B2B2B]">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventType">Event Type *</Label>
                  <Select value={formData.eventType} onValueChange={(value) => updateFormData('eventType', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eventName">Event Name *</Label>
                  <Input
                    id="eventName"
                    value={formData.eventName}
                    onChange={(e) => updateFormData('eventName', (e.target as HTMLInputElement).value)}
                    placeholder="e.g., Sarah's Wedding Reception"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => updateFormData('specialRequests', (e.target as HTMLTextAreaElement).value)}
                  placeholder="Any specific requests or notes for the caterer..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label>Dietary Restrictions</Label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DIETARY_RESTRICTIONS.map((restriction) => (
                    <div key={restriction} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dietary-${restriction}`}
                        checked={formData.dietaryRestrictions.includes(restriction)}
                        onCheckedChange={() => handleDietaryRestrictionToggle(restriction)}
                      />
                      <Label htmlFor={`dietary-${restriction}`} className="text-sm">
                        {restriction}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="setupRequirements">Setup Requirements</Label>
                <Textarea
                  id="setupRequirements"
                  value={formData.setupRequirements}
                  onChange={(e) => updateFormData('setupRequirements', (e.target as HTMLTextAreaElement).value)}
                  placeholder="Describe any special setup needs, equipment requirements, etc."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-[#2B2B2B]">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone">Phone Number *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => updateFormData('contactPhone', (e.target as HTMLInputElement).value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email Address *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormData('contactEmail', (e.target as HTMLInputElement).value)}
                    placeholder="your@email.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#2B2B2B]">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.paymentMethod === 'card'
                      ? 'border-[#2B2B2B] bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateFormData('paymentMethod', 'card')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Credit/Debit Card</h4>
                      <p className="text-sm text-gray-600">Pay securely with your card</p>
                    </div>
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.paymentMethod === 'bank'
                      ? 'border-[#2B2B2B] bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateFormData('paymentMethod', 'bank')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Bank Transfer</h4>
                      <p className="text-sm text-gray-600">Direct bank transfer</p>
                    </div>
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => updateFormData('agreedToTerms', Boolean(checked))}
                />
                <Label htmlFor="terms" className="text-sm leading-5">
                  I agree to the{' '}
                  <a href="/terms" className="text-[#2B2B2B] hover:underline">
                    Terms of Service
                  </a>{' '}
                  and understand the cancellation policy for this booking.
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        <div className="space-y-6">
          <Card className="border border-gray-200 sticky top-4">
            <CardHeader>
              <CardTitle className="text-[#2B2B2B]">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Caterer:</span>
                  <span className="font-medium">{caterer.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span>{selectedDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Time:</span>
                  <span>{selectedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Guests:</span>
                  <span>{guestCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Location:</span>
                  <span className="text-right max-w-32 truncate">{eventLocation}</span>
                </div>
                {selectedMenu && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Menu:</span>
                    <span className="text-right max-w-32 truncate">{selectedMenu.name}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(pricing.subtotal)}</span>
                </div>

                {creatorProgram.isActive && pricing.creatorDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Creator Discount ({creatorProgram.discountPercentage}%):</span>
                    <span>-{formatCurrency(pricing.creatorDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Platform Fee:</span>
                  <span>{formatCurrency(pricing.platformFee)}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Processing Fee:</span>
                  <span>{formatCurrency(pricing.processingFee)}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(pricing.total)}</span>
                </div>
              </div>

              {/* Creator Program Badge */}
              {creatorProgram.isActive && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Creator Program</Badge>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    This caterer is part of our Creator Program. You save {creatorProgram.discountPercentage}%!
                  </p>
                </div>
              )}

              {/* Important Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Important</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• A deposit may be required to confirm your booking</li>
                      <li>• Final details will be confirmed by the caterer</li>
                      <li>• Cancellation policy applies as per terms</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleSubmitBooking}
                  disabled={!isFormValid || isSubmitting}
                  className="w-full bg-[#2B2B2B] hover:bg-gray-800 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Booking Request'
                  )}
                </Button>
                <Button onClick={onCancel} variant="outline" className="w-full">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

};

export default CateringBookingPayment;