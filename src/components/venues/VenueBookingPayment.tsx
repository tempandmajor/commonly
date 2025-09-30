import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  Info,
  Shield,
  Loader2,
  MapPin,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { calculateFees } from '@/services/fees/feeCalculator';

interface VenueBookingPaymentProps {
  venue: {
    id: string;
    name: string;
    pricePerHour: number;
    minimumHours: number;
    capacity: number;
    ownerId: string;
  };
  selectedDate: Date | null;
  selectedTime: string;
  duration: number;
  guestCount: number;
  onBookingComplete: (bookingId: string) => void;
  onCancel: () => void;
}

interface BookingFormData {
  eventType: string;
  eventName: string;
  contactPhone: string;
  specialRequests: string;
  paymentType: 'full' | 'deposit';
  agreeToTerms: boolean;
}

const VenueBookingPayment: React.FC<VenueBookingPaymentProps> = ({
  venue,
  selectedDate,
  selectedTime,
  duration,
  guestCount,
  onBookingComplete,
  onCancel,
}) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    eventType: '',
    eventName: '',
    contactPhone: '',
    specialRequests: '',
    paymentType: 'deposit',
    agreeToTerms: false,
  });

  // Calculate pricing with Creator Program support
  const subtotal = venue.pricePerHour * duration;

  // Fetch venue owner's Creator Program status
  const [isCreatorProgram, setIsCreatorProgram] = useState(false);
  const [isLoadingCreatorStatus, setIsLoadingCreatorStatus] = useState(true);

  useEffect(() => {
    const checkCreatorProgramStatus = async () => {
      try {
        if (!venue.ownerId) return;

        setIsLoadingCreatorStatus(true);
        const { data, error } = await supabase
          .from('creator_program_members')
          .select('status')
          .eq('user_id', venue.ownerId)
          .eq('status', 'active')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('Error checking creator program status:', error);
        }

        setIsCreatorProgram(!!data);
      } catch (error) {
        console.warn('Error checking creator program status:', error);
      } finally {
        setIsLoadingCreatorStatus(false);
      }
    };

    checkCreatorProgramStatus();
  }, [venue.ownerId]);

  // Use the centralized fee calculator with Creator Program support
  const feeBreakdown = useMemo(() => {
    return calculateFees({
      amount: subtotal,
      isPlatformFee: false,
      includeStripeFees: true,
      isCreatorProgram: isCreatorProgram,
    });
  }, [subtotal, isCreatorProgram]);

  const total = feeBreakdown.total;
  const depositAmount = total * 0.3; // 30% deposit
  const remainingAmount = total - depositAmount;
  const paymentAmount = formData.paymentType === 'full' ? total : depositAmount;

  const handleInputChange = (field: keyof BookingFormData, value: string | boolean) => {
    setFormData(prev => ({
          ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.eventType) {
      toast.error('Please select an event type');
      return false;
    }
    if (!formData.eventName.trim()) {
      toast.error('Please enter an event name');
      return false;
    }
    if (!formData.contactPhone.trim()) {
      toast.error('Please enter a contact phone number');
      return false;
    }
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return false;
    }
    if (!selectedDate) {
      toast.error('Please select a date');
      return false;
    }
    if (!selectedTime) {
      toast.error('Please select a time');
      return false;
    }
    if (guestCount > venue.capacity) {
      toast.error(`Guest count cannot exceed venue capacity of ${venue.capacity}`);
      return false;
    }
    return true;
  };

  const createBookingRecord = async (): Promise<string> => {
    if (!selectedDate || !user) {
      throw new Error('Missing required booking information');
    }

    const eventStartDate = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    eventStartDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const eventEndDate = new Date(eventStartDate);
    eventEndDate.setHours(eventStartDate.getHours() + duration);

    const bookingData = {
      title: formData.eventName,
      description: `Venue booking for ${venue.name}\n\nEvent Type: ${formData.eventType}\nGuests: ${guestCount}\nContact: ${formData.contactPhone}\n\nSpecial Requests: ${formData.specialRequests || 'None'}`,
      creator_id: user.id,
      start_date: eventStartDate.toISOString(),
      end_date: eventEndDate.toISOString(),
      location: venue.name,
      status: 'pending_payment',
      venue_id: venue.id,
      max_capacity: guestCount,
      is_public: false,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(bookingData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating booking record:', error);
      throw new Error('Failed to create booking record');
    }

    return data.id;
  };

  const processPayment = async (bookingId: string) => {
    try {
      if (!user || !selectedDate) {
        throw new Error('Missing required payment information');
      }

      // Call Stripe Connect payment via centralized helper
      const { createCheckoutSession } = await import('@/services/supabase/edge-functions');

      const sessionData = {
        userId: user.id,
        amount: paymentAmount,
        description: `Venue booking: ${venue.name} - ${formData.eventName}`,
        currency: 'usd',
        successUrl: window.location.origin + '/purchase-success',
        cancelUrl: window.location.origin + '/wallet',
        metadata: {
          bookingId,
          venueId: venue.id,
          eventName: formData.eventName,
          eventDate: selectedDate.toISOString().split('T')[0],
          paymentType: formData.paymentType,
          duration: duration.toString(),
          guestCount: guestCount.toString(),
          subtotal: subtotal.toString(),
          platformFee: feeBreakdown.platformFee.toString(),
          stripeFee: feeBreakdown.stripeFee.toString(),
          totalAmount: total.toString(),
          paymentAmount: paymentAmount.toString(),
          remainingAmount: formData.paymentType === 'deposit' ? remainingAmount.toString() : '0',
        },
      };

      const response = await createCheckoutSession(sessionData);

      if (!response?.url) {
        throw new Error('Payment processing failed - no checkout URL received');
      }

      // Update booking to pending_payment, then redirect to checkout
      await supabase
        .from('events')
        .update({ status: 'pending_payment' })
        .eq('id', bookingId);

      window.location.href = response.url;
      return { status: 'redirected' };
    } catch (error) {
      // Update booking status to failed
      await supabase
        .from('events')
        .update({ status: 'payment_failed' })
        .eq('id', bookingId);

      throw error;
    }
  };

  const handleBookingSubmit = async () => {
    if (!validateForm() || !user) return;

    setIsProcessing(true);

    try {
      // Create booking record
      const bookingId = await createBookingRecord();

      // Process payment
      const paymentResult = await processPayment(bookingId);

      if (paymentResult.status === 'succeeded') {
        toast.success('Booking confirmed!', {
          description: `Your ${formData.paymentType === 'full' ? 'payment' : 'deposit'} has been processed successfully.`,
        });

        onBookingComplete(bookingId);
      } else if (paymentResult.status === 'redirected') {
        // User is being redirected to Stripe checkout
        return;
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      toast.error('Booking failed', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDateTime = () => {
    if (!selectedDate) return '';
    const date = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) as string;
    const time = new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) as string;
    return `${date} at ${time}`;
  };

  return (
    <div className='space-y-6 max-w-4xl mx-auto'>
      {/* Header with venue info */}
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent'>
          Complete Your Booking
        </h1>
        <p className='text-muted-foreground'>
          You're just one step away from securing your venue
        </p>
      </div>

      {/* Booking Summary */}
      <Card className='border-0 shadow-lg bg-gradient-to-br from-card to-card/80'>
        <CardHeader className='pb-4'>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5 text-primary' />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-3'>
              <div>
                <Label className='text-sm font-medium text-muted-foreground'>Venue</Label>
                <p className='font-semibold text-lg'>{venue.name}</p>
              </div>
              <div>
                <Label className='text-sm font-medium text-muted-foreground'>Date & Time</Label>
                <p className='font-medium flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-primary' />
                  {formatDateTime()}
                </p>
              </div>
            </div>
            <div className='space-y-3'>
              <div>
                <Label className='text-sm font-medium text-muted-foreground'>Duration</Label>
                <p className='font-medium flex items-center gap-2'>
                  <Clock className='h-4 w-4 text-primary' />
                  {duration} hours
                </p>
              </div>
              <div>
                <Label className='text-sm font-medium text-muted-foreground'>Guests</Label>
                <p className='font-medium flex items-center gap-2'>
                  <Users className='h-4 w-4 text-primary' />
                  {guestCount} people
                </p>
              </div>
            </div>
          </div>

          {/* Creator Program Badge */}
          {isCreatorProgram && (
            <div className='flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg'>
              <Star className='h-4 w-4 text-amber-600' />
              <span className='text-sm font-medium text-amber-800'>
                Creator Program Member - Reduced platform fees applied
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Form */}
      <Card className='border-0 shadow-lg bg-gradient-to-br from-card to-card/80'>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Tell us about your event to help the venue owner prepare
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='eventType'>Event Type *</Label>
              <Select
                value={formData.eventType}
                onValueChange={value => handleInputChange('eventType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select event type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='wedding'>Wedding</SelectItem>
                  <SelectItem value='corporate'>Corporate Event</SelectItem>
                  <SelectItem value='birthday'>Birthday Party</SelectItem>
                  <SelectItem value='anniversary'>Anniversary</SelectItem>
                  <SelectItem value='conference'>Conference</SelectItem>
                  <SelectItem value='workshop'>Workshop</SelectItem>
                  <SelectItem value='networking'>Networking Event</SelectItem>
                  <SelectItem value='fundraiser'>Fundraiser</SelectItem>
                  <SelectItem value='other'>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='contactPhone'>Contact Phone *</Label>
              <Input
                id='contactPhone'
                type='tel'
                placeholder='(555) 123-4567'
                value={formData.contactPhone}
                onChange={e => handleInputChange('contactPhone', (e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='eventName'>Event Name *</Label>
            <Input
              id='eventName'
              placeholder="e.g., Sarah & John's Wedding Reception"
              value={formData.eventName}
              onChange={e => handleInputChange('eventName', (e.target as HTMLInputElement).value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='specialRequests'>Special Requests (Optional)</Label>
            <Textarea
              id='specialRequests'
              placeholder='Any special requirements, setup needs, or questions for the venue owner...'
              rows={3}
              value={formData.specialRequests}
              onChange={e => handleInputChange('specialRequests', (e.target as HTMLInputElement).value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card className='border-0 shadow-lg bg-gradient-to-br from-card to-card/80'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5 text-primary' />
            Payment Options
          </CardTitle>
          <CardDescription>Choose how you'd like to pay for your venue booking</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <label className='flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors'>
              <input
                type='radio'
                name='paymentType'
                checked={formData.paymentType === 'deposit'}
                onChange={() => handleInputChange('paymentType', 'deposit')}
                className='w-4 h-4 text-primary'
              />
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium'>Pay Deposit Now</p>
                    <p className='text-sm text-muted-foreground'>
                      Pay 30% now, remaining balance due 7 days before event
                    </p>
                  </div>
                  <Badge variant='secondary' className='bg-primary/10 text-primary'>
                    {formatCurrency(depositAmount)}
                  </Badge>
                </div>
              </div>
            </label>

            <label className='flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors'>
              <input
                type='radio'
                name='paymentType'
                checked={formData.paymentType === 'full'}
                onChange={() => handleInputChange('paymentType', 'full')}
                className='w-4 h-4 text-primary'
              />
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='font-medium'>Pay in Full</p>
                    <p className='text-sm text-muted-foreground'>
                      Pay the complete amount now and secure your booking
                    </p>
                  </div>
                  <Badge variant='secondary' className='bg-green-100 text-green-700'>
                    {formatCurrency(total)}
                  </Badge>
                </div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className='border-0 shadow-lg bg-gradient-to-br from-card to-card/80'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5 text-primary' />
            Price Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <span>
                Venue rental ({duration} hours × {formatCurrency(venue.pricePerHour)})
              </span>
              <span className='font-medium'>{formatCurrency(subtotal)}</span>
            </div>
            <div className='flex justify-between text-sm text-muted-foreground'>
              <span>Platform fee ({feeBreakdown.platformFeePercentage}%)</span>
              <span>{formatCurrency(feeBreakdown.platformFee)}</span>
            </div>
            <div className='flex justify-between text-sm text-muted-foreground'>
              <span>Payment processing fee</span>
              <span>{formatCurrency(feeBreakdown.stripeFee)}</span>
            </div>
            <Separator />
            <div className='flex justify-between font-semibold text-lg'>
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            {formData.paymentType === 'deposit' && (
              <>
                <Separator />
                <div className='space-y-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg'>
                  <div className='flex justify-between font-medium text-blue-800'>
                    <span>Deposit (30%)</span>
                    <span>{formatCurrency(depositAmount)}</span>
                  </div>
                  <div className='flex justify-between text-sm text-blue-600'>
                    <span>Remaining balance</span>
                    <span>{formatCurrency(remainingAmount)}</span>
                  </div>
                  <p className='text-xs text-blue-600'>
                    Remaining balance due 7 days before your event
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card className='border-0 shadow-lg bg-gradient-to-br from-card to-card/80'>
        <CardContent className='pt-6'>
          <div className='space-y-4'>
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='terms'
                checked={formData.agreeToTerms}
                onCheckedChange={checked => handleInputChange('agreeToTerms', !!checked)}
                className='mt-1'
              />
              <Label htmlFor='terms' className='text-sm cursor-pointer leading-relaxed'>
                I agree to the{' '}
                <a href='/terms' className='text-primary hover:underline font-medium'>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href='/privacy' className='text-primary hover:underline font-medium'>
                  Privacy Policy
                </a>
                . I understand that this booking is subject to venue owner approval and cancellation
                policies.
              </Label>
            </div>

            <div className='p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg'>
              <div className='flex items-start gap-3'>
                <Info className='h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0' />
                <div className='text-sm text-amber-800'>
                  <p className='font-medium mb-2'>Booking Process</p>
                  <ul className='space-y-1 text-xs'>
                    <li>• Your booking request will be sent to the venue owner</li>
                    <li>• Payment will be processed once the venue owner confirms availability</li>
                    <li>• You'll receive a confirmation email with booking details</li>
                    <li>• Cancellation policies apply as per venue terms</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex gap-4'>
        <Button
          variant='outline'
          onClick={onCancel}
          disabled={isProcessing}
          className='flex-1 h-12'
        >
          Cancel
        </Button>
        <Button
          onClick={handleBookingSubmit}
          disabled={isProcessing || !formData.agreeToTerms || isLoadingCreatorStatus}
          className='flex-1 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium'
        >
          {isProcessing ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Processing...
            </>
          ) : (
            <>
              <Shield className='mr-2 h-4 w-4' />
              Secure Booking - {formatCurrency(paymentAmount)}
            </>
          )}
        </Button>
      </div>

      <div className='text-center space-y-2'>
        <div className='flex items-center justify-center gap-2 text-xs text-muted-foreground'>
          <Shield className='h-3 w-3' />
          <span>Payments are processed securely through Stripe</span>
        </div>
        <p className='text-xs text-muted-foreground'>
          Your card information is never stored on our servers
        </p>
      </div>
    </div>
  );
};

export default VenueBookingPayment;