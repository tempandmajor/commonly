import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Users, CreditCard, ChefHat, Calendar } from 'lucide-react';
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
import { safeSupabaseQuery } from '@/utils/supabaseHelpers';

interface CatererBookingSettings {
  requires_approval?: boolean | undefined;
  response_time_hours?: number | undefined;
  weekend_pricing_multiplier?: number | undefined;
  service_fee_percentage?: number | undefined;
}

interface CatererData {
  id: string;
  name: string;
  price_per_person?: number | undefined;
  minimum_guests?: number | undefined;
  maximum_guests?: number | undefined;
  advance_booking_days?: number | undefined;
  simultaneous_bookings_allowed?: boolean | undefined;
  max_simultaneous_bookings?: number | undefined;
  booking_settings?: CatererBookingSettings | undefined;
}

interface SelectedMenu {
  id: string;
  name: string;
  price: number;
  description?: string | undefined;
}

interface CatererBookingFormProps {
  caterer: CatererData;
  selectedMenu?: SelectedMenu | undefined;
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
  event_location: string;
  setup_requirements: string;
  dietary_restrictions: string;
  service_style: string;
  contact_phone: string;
  contact_email: string;
  special_requests: string;
}

interface AvailabilityInfo {
  available: boolean;
  message?: string | undefined;
  warning?: string | undefined;
  conflicts?: any[] | undefined;
}

interface ConflictingBooking {
  id: string;
  start_datetime: string;
  end_datetime: string;
  booking_status: string;
}

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'birthday', label: 'Birthday Party' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'holiday', label: 'Holiday Party' },
  { value: 'other', label: 'Other' },
] as const;

const SERVICE_STYLES = [
  { value: 'buffet', label: 'Buffet' },
  { value: 'plated', label: 'Plated Service' },
  { value: 'family-style', label: 'Family Style' },
  { value: 'cocktail', label: 'Cocktail Reception' },
  { value: 'stations', label: 'Food Stations' },
] as const;

const EnhancedCatererBookingForm: React.FC<CatererBookingFormProps> = ({
  caterer,
  selectedMenu,
  onClose,
  onBookingSubmitted,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityInfo, setAvailabilityInfo] = useState<AvailabilityInfo | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const initialFormData: BookingFormData = useMemo(() => ({
    event_title: '',
    event_type: 'wedding',
    event_description: '',
    start_date: '',
    start_time: '',
    duration_hours: 4,
    guest_count: caterer.minimum_guests || 10,
    event_location: '',
    setup_requirements: '',
    dietary_restrictions: '',
    service_style: 'buffet',
    contact_phone: '',
    contact_email: user?.email || '',
    special_requests: '',
  }), [caterer.minimum_guests, user?.email]);

  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});

  const calculateEstimatedCost = useCallback(() => {
    let baseCost = 0;

    if (selectedMenu) {
      baseCost = selectedMenu.price * formData.guest_count;
    } else if (caterer.price_per_person) {
      baseCost = caterer.price_per_person * formData.guest_count;
    }

    if (caterer.booking_settings?.service_fee_percentage) {
      baseCost *= 1 + caterer.booking_settings.service_fee_percentage / 100;
    }

    if (formData.start_date) {
      const date = new Date(formData.start_date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      if (isWeekend && caterer.booking_settings?.weekend_pricing_multiplier) {
        baseCost *= caterer.booking_settings.weekend_pricing_multiplier;
      }
    }

    setEstimatedCost(Math.round(baseCost));
  }, [formData.guest_count, formData.start_date, selectedMenu, caterer]);

  const checkAvailability = useCallback(async () => {
    if (!formData.start_date || !formData.start_time) return;

    try {
      setCheckingAvailability(true);
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(
        startDateTime.getTime() + formData.duration_hours * 60 * 60 * 1000
      );

      const { data: conflictingBookings, error } = await supabase
        .from('caterer_bookings')
        .select('id, start_datetime, end_datetime, booking_status')
        .eq('caterer_id', caterer.id)
        .neq('booking_status', 'cancelled')
        .or(
          `start_datetime.lt.${endDateTime.toISOString()},end_datetime.gt.${startDateTime.toISOString()}`
        );

      if (error) {
        console.error('Error checking availability:', error);
        setAvailabilityInfo({
          available: true,
          warning: 'Could not verify availability - booking may be subject to confirmation',
        });
        return;
      }

      const hasConflicts = (conflictingBookings || []).length > 0;

      if (hasConflicts) {
        setAvailabilityInfo({
          available: false,
          conflicts: conflictingBookings,
          message: 'Time slot not available. The caterer has existing bookings during this time.',
        });
      } else {
        const daysDifference = Math.ceil(
          (startDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        const minDays = caterer.advance_booking_days || 1;

        if (daysDifference < minDays) {
          setAvailabilityInfo({
            available: false,
            message: `This caterer requires at least ${minDays} days advance booking.`,
          });
        } else {
          setAvailabilityInfo({
            available: true,
            message: 'Time slot is available for booking!',
          });
        }
      }
    } catch (error) {
      console.error('Availability check failed:', error);
      setAvailabilityInfo({
        available: true,
        warning: 'Could not verify availability - booking may be subject to confirmation',
      });
    } finally {
      setCheckingAvailability(false);
    }
  }, [formData.start_date, formData.start_time, formData.duration_hours, caterer]);

  useEffect(() => {
    calculateEstimatedCost();
  }, [calculateEstimatedCost]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};

    if (!formData.event_title.trim()) newErrors.event_title = 'Event title is required';
    if (!formData.start_date) newErrors.start_date = 'Event date is required';
    if (!formData.start_time) newErrors.start_time = 'Event time is required';
    if (!formData.event_location.trim()) newErrors.event_location = 'Event location is required';
    if (!formData.contact_phone.trim()) newErrors.contact_phone = 'Contact phone is required';
    if (!formData.contact_email.trim()) newErrors.contact_email = 'Contact email is required';

    if (caterer.minimum_guests && formData.guest_count < caterer.minimum_guests) {
      newErrors.guest_count = `Minimum guests: ${caterer.minimum_guests}`;
    }
    if (caterer.maximum_guests && formData.guest_count > caterer.maximum_guests) {
      newErrors.guest_count = `Maximum guests: ${caterer.maximum_guests}`;
    }

    if (formData.start_date) {
      const selectedDate = new Date(`${formData.start_date}T${formData.start_time || '00:00'}`);
      if (selectedDate <= new Date()) {
        newErrors.start_date = 'Event date must be in the future';
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [formData, caterer]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    if (!user) {
      toast.error('Please sign in to submit a booking request');
      return;
    }

    if (availabilityInfo && !availabilityInfo.available) {
      toast.error('Selected time slot is not available');
      return;
    }

    try {
      setLoading(true);

      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(
        startDateTime.getTime() + formData.duration_hours * 60 * 60 * 1000
      );

      const bookingData = {
        caterer_id: caterer.id,
        user_id: user.id,
        event_title: formData.event_title,
        event_type: formData.event_type,
        event_description: formData.event_description,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        guest_count: formData.guest_count,
        ...(selectedMenu ? { selected_menu_id: selectedMenu.id } : {}),
        event_location: formData.event_location,
        setup_requirements: formData.setup_requirements,
        dietary_restrictions: formData.dietary_restrictions,
        service_style: formData.service_style,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        special_requests: formData.special_requests,
        estimated_cost: estimatedCost,
        booking_status: caterer.booking_settings?.requires_approval ? 'pending' : 'confirmed',
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('caterer_bookings').insert(bookingData);

      if (error) {
        console.error('Booking submission error:', error);
        toast.error('Failed to submit booking request. Please try again.');
        return;
      }

      toast.success(
        caterer.booking_settings?.requires_approval
          ? 'Booking request submitted! The caterer will review and respond within 24 hours.'
          : 'Booking confirmed! You will receive a confirmation email shortly.'
      );

      onBookingSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Failed to submit booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, user, availabilityInfo, caterer, selectedMenu, estimatedCost, onBookingSubmitted, onClose]);

  const handleInputChange = useCallback((field: keyof BookingFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <Card className="card-hover">
        <CardHeader className="text-center border-b">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl">
            <ChefHat className="h-7 w-7 text-primary" />
            Book {caterer.name}
          </CardTitle>
          {selectedMenu && (
            <div className="flex items-center justify-center gap-3 pt-3">
              <Badge className="text-sm px-3 py-1">
                {selectedMenu.name}
              </Badge>
              <span className="text-base font-medium text-muted-foreground">
                {formatCurrency(selectedMenu.price)} per person
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            <section className="space-y-6 animate-slide-in">
              <h3 className="text-xl font-semibold text-foreground border-b pb-2">
                Event Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="event_title" className="text-sm font-medium">
                    Event Title *
                  </Label>
                  <Input
                    id="event_title"
                    value={formData.event_title}
                    onChange={e => handleInputChange('event_title', (e.target as HTMLInputElement).value)}
                    placeholder="e.g., Wedding Reception"
                    className="input-ring"
                  />
                  {errors.event_title && (
                    <p className="text-sm text-destructive">{errors.event_title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_type" className="text-sm font-medium">
                    Event Type
                  </Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={value => handleInputChange('event_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_description" className="text-sm font-medium">
                  Event Description
                </Label>
                <Textarea
                  id="event_description"
                  value={formData.event_description}
                  onChange={e => handleInputChange('event_description', (e.target as HTMLTextAreaElement).value)}
                  placeholder="Describe your event and any special requirements"
                  rows={3}
                  className="input-ring resize-none"
                />
              </div>
            </section>

            <section className="space-y-6 animate-slide-in-delay-1">
              <h3 className="text-xl font-semibold text-foreground border-b pb-2 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                Date & Time
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm font-medium">
                    Event Date *
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={e => handleInputChange('start_date', (e.target as HTMLInputElement).value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-ring"
                  />
                  {errors.start_date && (
                    <p className="text-sm text-destructive">{errors.start_date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time" className="text-sm font-medium">
                    Start Time *
                  </Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={e => handleInputChange('start_time', (e.target as HTMLInputElement).value)}
                    className="input-ring"
                  />
                  {errors.start_time && (
                    <p className="text-sm text-destructive">{errors.start_time}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_hours" className="text-sm font-medium">
                    Duration (hours)
                  </Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.duration_hours}
                    onChange={e => handleInputChange('duration_hours', parseInt((e.target as HTMLInputElement).value) || 4)}
                    className="input-ring"
                  />
                </div>
              </div>

              {checkingAvailability && (
                <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                  <Clock className="h-4 w-4 animate-spin" />
                  Checking availability...
                </div>
              )}

              {availabilityInfo && (
                <Alert className={!availabilityInfo.available ? 'border-destructive/50 bg-destructive/10' : ''}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {availabilityInfo.message || availabilityInfo.warning}
                  </AlertDescription>
                </Alert>
              )}
            </section>

            <section className="space-y-6 animate-slide-in-delay-2">
              <h3 className="text-xl font-semibold text-foreground border-b pb-2 flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                Guests & Location
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="guest_count" className="text-sm font-medium">
                    Number of Guests *
                  </Label>
                  <Input
                    id="guest_count"
                    type="number"
                    min={caterer.minimum_guests || 1}
                    max={caterer.maximum_guests || 1000}
                    value={formData.guest_count}
                    onChange={e => handleInputChange('guest_count', parseInt((e.target as HTMLInputElement).value) || 1)}
                    className="input-ring"
                  />
                  {caterer.minimum_guests && (
                    <p className="text-xs text-muted-foreground">
                      Minimum: {caterer.minimum_guests} guests
                    </p>
                  )}
                  {errors.guest_count && (
                    <p className="text-sm text-destructive">{errors.guest_count}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_style" className="text-sm font-medium">
                    Service Style
                  </Label>
                  <Select
                    value={formData.service_style}
                    onValueChange={value => handleInputChange('service_style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_STYLES.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_location" className="text-sm font-medium">
                  Event Location *
                </Label>
                <Input
                  id="event_location"
                  value={formData.event_location}
                  onChange={e => handleInputChange('event_location', (e.target as HTMLInputElement).value)}
                  placeholder="Full address or venue name"
                  className="input-ring"
                />
                {errors.event_location && (
                  <p className="text-sm text-destructive">{errors.event_location}</p>
                )}
              </div>
            </section>

            <section className="space-y-6 animate-slide-in-delay-3">
              <h3 className="text-xl font-semibold text-foreground border-b pb-2">
                Additional Requirements
              </h3>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dietary_restrictions" className="text-sm font-medium">
                    Dietary Restrictions
                  </Label>
                  <Textarea
                    id="dietary_restrictions"
                    value={formData.dietary_restrictions}
                    onChange={e => handleInputChange('dietary_restrictions', (e.target as HTMLTextAreaElement).value)}
                    placeholder="Allergies, vegetarian, vegan, gluten-free, etc."
                    rows={2}
                    className="input-ring resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setup_requirements" className="text-sm font-medium">
                    Setup Requirements
                  </Label>
                  <Textarea
                    id="setup_requirements"
                    value={formData.setup_requirements}
                    onChange={e => handleInputChange('setup_requirements', (e.target as HTMLTextAreaElement).value)}
                    placeholder="Tables, chairs, linens, decorations, etc."
                    rows={2}
                    className="input-ring resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_requests" className="text-sm font-medium">
                    Special Requests
                  </Label>
                  <Textarea
                    id="special_requests"
                    value={formData.special_requests}
                    onChange={e => handleInputChange('special_requests', (e.target as HTMLTextAreaElement).value)}
                    placeholder="Any special requests or notes for the caterer"
                    rows={2}
                    className="input-ring resize-none"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6 animate-slide-in-delay-3">
              <h3 className="text-xl font-semibold text-foreground border-b pb-2">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact_phone" className="text-sm font-medium">
                    Phone Number *
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={e => handleInputChange('contact_phone', (e.target as HTMLInputElement).value)}
                    placeholder="(555) 123-4567"
                    className="input-ring"
                  />
                  {errors.contact_phone && (
                    <p className="text-sm text-destructive">{errors.contact_phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="text-sm font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={e => handleInputChange('contact_email', (e.target as HTMLInputElement).value)}
                    placeholder="your@email.com"
                    className="input-ring"
                  />
                  {errors.contact_email && (
                    <p className="text-sm text-destructive">{errors.contact_email}</p>
                  )}
                </div>
              </div>
            </section>

            {estimatedCost > 0 && (
              <section className="bg-muted/50 p-6 rounded-lg border animate-scale-in">
                <h3 className="text-xl font-semibold flex items-center gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Estimated Cost
                </h3>
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatCurrency(estimatedCost)}
                </div>
                <p className="text-sm text-muted-foreground">
                  *Final cost may vary based on final menu selection and requirements
                </p>
              </section>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 text-base transition-all duration-300 hover-scale border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading || checkingAvailability || (!!availabilityInfo && !availabilityInfo.available)
                }
                className="flex-1 h-12 text-base font-medium transition-all duration-300 hover-scale"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  'Submit Booking Request'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCatererBookingForm;