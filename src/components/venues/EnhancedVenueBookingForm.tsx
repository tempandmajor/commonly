import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Users, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VenueBookingFormProps {
  venue: {
    id: string;
    name: string;
    price_per_hour?: number | undefined;
    minimum_booking_hours?: number | undefined;
    maximum_booking_hours?: number | undefined;
    advance_booking_days?: number | undefined;
    instant_booking?: boolean | undefined;
    booking_settings?: {
      requires_approval?: boolean | undefined;
      response_time_hours?: number | undefined;
      weekend_pricing_multiplier?: number | undefined;
    };
    capacity: number;
  };
  onClose: () => void;
  onBookingSubmitted: () => void;
}

interface BookingFormData {
  event_title: string;
  event_type: string;
  event_description: string;
  start_date: string;
  start_time: string;
  duration_hours: number;
  guest_count: number;
  contact_phone: string;
  contact_email: string;
  special_requests: string;
}

const EVENT_TYPES = [
  'Wedding',
  'Corporate Event',
  'Birthday Party',
  'Conference',
  'Workshop',
  'Networking Event',
  'Product Launch',
  'Art Exhibition',
  'Fundraiser',
  'Concert/Performance',
  'Private Dinner',
  'Other',
];

const EnhancedVenueBookingForm: React.FC<VenueBookingFormProps> = ({
  venue,
  onClose,
  onBookingSubmitted,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<BookingFormData>({
    event_title: '',
    event_type: '',
    event_description: '',
    start_date: '',
    start_time: '',
    duration_hours: venue.minimum_booking_hours || 2,
    guest_count: 1,
    contact_phone: '',
    contact_email: user?.email || '',
    special_requests: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [conflictCheck, setConflictCheck] = useState<{
    checking: boolean;
    hasConflict: boolean;
    message: string;

  }>({ checking: false, hasConflict: false, message: '' });

  const [pricing, setPricing] = useState({
    baseAmount: 0,
    weekendMultiplier: 1,
    totalAmount: 0,

  });

  // Calculate pricing whenever duration or date changes

  useEffect(() => {
    if (venue.price_per_hour && formData.duration_hours > 0) {
      const baseAmount = venue.price_per_hour * formData.duration_hours;
      let multiplier = 1;

      // Apply weekend pricing if applicable
      if (formData.start_date) {
        const selectedDate = new Date(formData.start_date);
        const dayOfWeek = selectedDate.getDay();
        if (
          (dayOfWeek === 0 || dayOfWeek === 6) &&
          venue.booking_settings?.weekend_pricing_multiplier
        ) {
          multiplier = venue.booking_settings.weekend_pricing_multiplier;
        }
      }

      setPricing({
        baseAmount,
        weekendMultiplier: multiplier,
        totalAmount: Math.round(baseAmount * multiplier),
      });
    }

  }, [venue.price_per_hour, formData.duration_hours, formData.start_date, venue.booking_settings]);

  // Check for conflicts when date/time changes
  useEffect(() => {
    if (formData.start_date && formData.start_time && formData.duration_hours > 0) {
      checkForConflicts();
    }
  }, [formData.start_date, formData.start_time, formData.duration_hours]);

  const checkForConflicts = async () => {
    setConflictCheck({ checking: true, hasConflict: false, message: '' });

    try {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(
        startDateTime.getTime() + formData.duration_hours * 60 * 60 * 1000
      );

      const { data, error } = await supabase.rpc('check_booking_conflicts', {
        p_venue_id: venue.id,
        p_start_datetime: startDateTime.toISOString(),
        p_end_datetime: endDateTime.toISOString(),
      });

      if (error) throw error;

      if (!data) {
        setConflictCheck({
          checking: false,
          hasConflict: true,
          message:
            'This time slot conflicts with an existing booking. Please choose a different time.',
        });
      } else {
        setConflictCheck({
          checking: false,
          hasConflict: false,
          message: 'Time slot is available!',
        });
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
      setConflictCheck({
        checking: false,
        hasConflict: false,
        message: 'Unable to verify availability. Please proceed with caution.',
      });
    }
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      'event_title',
      'event_type',
      'start_date',
      'start_time',
      'contact_email',
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof BookingFormData]) {
        toast.error(`Please fill in the ${field.replace('_', ' ')}`);
        return false;
      }
    }

    if (formData.guest_count > venue.capacity) {
      toast.error(`Guest count cannot exceed venue capacity of ${venue.capacity}`);
      return false;
    }

    if (formData.duration_hours < (venue.minimum_booking_hours || 1)) {
      toast.error(`Minimum booking duration is ${venue.minimum_booking_hours || 1} hours`);
      return false;
    }

    if (formData.duration_hours > (venue.maximum_booking_hours || 12)) {
      toast.error(`Maximum booking duration is ${venue.maximum_booking_hours || 12} hours`);
      return false;
    }

    if (conflictCheck.hasConflict) {
      toast.error('Please resolve the time slot conflict before submitting');
      return false;
    }

    // Check advance booking requirement
    if (venue.advance_booking_days) {
      const selectedDate = new Date(formData.start_date);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + venue.advance_booking_days);

      if (selectedDate < minDate) {
        toast.error(`Bookings must be made at least ${venue.advance_booking_days} days in advance`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to make a booking');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(
        startDateTime.getTime() + formData.duration_hours * 60 * 60 * 1000
      );

      const bookingData = {
        venue_id: venue.id,
        user_id: user.id,
        event_title: formData.event_title,
        event_type: formData.event_type,
        event_description: formData.event_description,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        guest_count: formData.guest_count,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        special_requests: formData.special_requests,
        total_amount_cents: pricing.totalAmount * 100, // Convert to cents
        deposit_amount_cents: Math.round(pricing.totalAmount * 0.3 * 100), // 30% deposit
        status: venue.instant_booking ? 'approved' : 'pending',
      };

      const { data, error } = await supabase
        .from('venue_bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      if (venue.instant_booking) {
        toast.success('Booking confirmed instantly!', {
          description: 'You can now proceed with payment.',
        });
      } else {
        toast.success('Booking request submitted!', {
          description: `The venue owner will respond within ${venue.booking_settings?.response_time_hours || 24} hours.`,
        });
      }

      onBookingSubmitted();
      onClose();
    } catch (error) {
      console.error('Booking submission error:', error);
      toast.error('Failed to submit booking request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MapPin className='h-5 w-5' />
          Book {venue.name}
        </CardTitle>
        <div className='flex items-center gap-2'>
          {venue.instant_booking ? (
            <Badge variant='default' className='bg-green-500'>
              <CheckCircle className='h-3 w-3 mr-1' />
              Instant Booking
            </Badge>
          ) : (
            <Badge variant='secondary'>
              <Clock className='h-3 w-3 mr-1' />
              Requires Approval
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Event Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Event Information</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='event_title'>Event Title *</Label>
                <Input
                  id='event_title'
                  value={formData.event_title}
                  onChange={e => setFormData(prev => ({ ...prev, event_title: (e.target as HTMLInputElement).value }))}
                  placeholder='My Amazing Event'
                  required
                />
              </div>

              <div>
                <Label htmlFor='event_type'>Event Type *</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={value => setFormData(prev => ({ ...prev, event_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select event type' />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor='event_description'>Event Description</Label>
              <Textarea
                id='event_description'
                value={formData.event_description}
                onChange={e =>
                  setFormData(prev => ({ ...prev, event_description: (e.target as HTMLInputElement).value }))
                }
                placeholder='Describe your event, including any special requirements...'
                rows={3}
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Date & Time
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='start_date'>Date *</Label>
                <Input
                  id='start_date'
                  type='date'
                  value={formData.start_date}
                  onChange={e => setFormData(prev => ({ ...prev, start_date: (e.target as HTMLInputElement).value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor='start_time'>Start Time *</Label>
                <Input
                  id='start_time'
                  type='time'
                  value={formData.start_time}
                  onChange={e => setFormData(prev => ({ ...prev, start_time: (e.target as HTMLInputElement).value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor='duration_hours'>Duration (hours) *</Label>
                <Input
                  id='duration_hours'
                  type='number'
                  value={formData.duration_hours}
                  onChange={e =>
                    setFormData(prev => ({
          ...prev,
                      duration_hours: parseInt((e.target as HTMLInputElement).value) || 1,
                    }))
                  }
                  min={venue.minimum_booking_hours || 1}
                  max={venue.maximum_booking_hours || 12}
                  required
                />
              </div>
            </div>

            {/* Conflict Check */}
            {formData.start_date && formData.start_time && (
              <Alert
                className={
                  conflictCheck.hasConflict
                    ? 'border-red-200 bg-red-50'
                    : 'border-green-200 bg-green-50'
                }
              >
                <AlertCircle
                  className={`h-4 w-4 ${conflictCheck.hasConflict ? 'text-red-600' : 'text-green-600'}`}
                />
                <AlertDescription
                  className={conflictCheck.hasConflict ? 'text-red-700' : 'text-green-700'}
                >
                  {conflictCheck.checking ? 'Checking availability...' : conflictCheck.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Guest Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Guest Information
            </h3>

            <div>
              <Label htmlFor='guest_count'>Number of Guests *</Label>
              <Input
                id='guest_count'
                type='number'
                value={formData.guest_count}
                onChange={e =>
                  setFormData(prev => ({ ...prev, guest_count: parseInt((e.target as HTMLInputElement).value) || 1 }))
                }
                min={1}
                max={venue.capacity}
                required
              />
              <p className='text-sm text-muted-foreground mt-1'>
                Maximum capacity: {venue.capacity} guests
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Contact Information</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='contact_email'>Email *</Label>
                <Input
                  id='contact_email'
                  type='email'
                  value={formData.contact_email}
                  onChange={e => setFormData(prev => ({ ...prev, contact_email: (e.target as HTMLInputElement).value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor='contact_phone'>Phone Number</Label>
                <Input
                  id='contact_phone'
                  type='tel'
                  value={formData.contact_phone}
                  onChange={e => setFormData(prev => ({ ...prev, contact_phone: (e.target as HTMLInputElement).value }))}
                  placeholder='(555) 123-4567'
                />
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <Label htmlFor='special_requests'>Special Requests</Label>
            <Textarea
              id='special_requests'
              value={formData.special_requests}
              onChange={e => setFormData(prev => ({ ...prev, special_requests: (e.target as HTMLInputElement).value }))}
              placeholder='Any special requirements, setup needs, or questions for the venue owner...'
              rows={3}
            />
          </div>

          {/* Pricing Summary */}
          {venue.price_per_hour && (
            <Card className='border-2 border-primary/20'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <CreditCard className='h-5 w-5' />
                  Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex justify-between'>
                  <span>
                    Base Rate ({formData.duration_hours} hours ×{' '}
                    {formatCurrency(venue.price_per_hour * 100)}):
                  </span>
                  <span>{formatCurrency(pricing.baseAmount * 100)}</span>
                </div>
                {pricing.weekendMultiplier > 1 && (
                  <div className='flex justify-between text-sm text-muted-foreground'>
                    <span>Weekend Multiplier ({pricing.weekendMultiplier}x):</span>
                    <span>+{formatCurrency((pricing.totalAmount - pricing.baseAmount) * 100)}</span>
                  </div>
                )}
                <div className='border-t pt-2 flex justify-between font-semibold text-lg'>
                  <span>Total:</span>
                  <span>{formatCurrency(pricing.totalAmount * 100)}</span>
                </div>
                {!venue.instant_booking && (
                  <p className='text-sm text-muted-foreground'>
                    A 30% deposit ({formatCurrency(pricing.totalAmount * 0.3 * 100)}) will be
                    required upon approval.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className='flex gap-3 pt-4'>
            <Button type='button' variant='outline' onClick={onClose} className='flex-1'>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || conflictCheck.hasConflict || conflictCheck.checking}
              className='flex-1'
            >
              {isSubmitting
                ? 'Submitting...'
                : venue.instant_booking
                  ? 'Book Now'
                  : 'Request Booking'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

};

export default EnhancedVenueBookingForm;
