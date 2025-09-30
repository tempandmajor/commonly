import { useState } from 'react';
import { DayPicker, DayModifiers } from 'react-day-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';
import { useCatererPrice } from '@/hooks/useCatererPrice';
import CateringBookingPayment from '@/components/caterers/CateringBookingPayment';
import { UnifiedCaterer } from '@/types/unifiedCaterer';

interface CatererBookingCardProps {
  caterer: UnifiedCaterer;
  isAuthenticated: boolean;
  selectedMenu: string | null;
  guestCount: number;
  date: Date | null;
  onDateSelect: (date: Date | null) => void;
  onGuestCountChange: (count: number) => void;
}

const CatererBookingCard = ({
  caterer,
  isAuthenticated,
  selectedMenu,
  guestCount,
  date,
  onDateSelect,
  onGuestCountChange,
}: CatererBookingCardProps) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedTime, setSelectedTime] = useState('18:00'); // Default 6 PM
  const [eventLocation, setEventLocation] = useState('');

  const { pricePerPerson, totalPrice, selectedMenuDetails } = useCatererPrice(
    caterer,
    selectedMenu,
    guestCount
  );

  // Check if caterer has Stripe Connect configured
  const catererHasStripeConnect = caterer.stripe_connect_account_id !== null;

  const handleBookCaterer = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book a caterer');
      return;
    }

    if (!date) {
      toast.error('Please select a date for your booking');
      return;
    }

    if (!selectedMenu && caterer.menu?.length) {
      toast.error('Please select a menu for your event');
      return;
    }

    if (guestCount < (caterer.capacity?.min || 0) || guestCount > (caterer.capacity?.max || 0)) {
      toast.error(
        `Guest count must be between ${caterer.capacity?.min} and ${caterer.capacity?.max}`
      );
      return;
    }

    if (!eventLocation.trim()) {
      toast.error('Please enter the event location');
      return;
    }

    setShowPaymentForm(true);
  };

  const handleBookingComplete = (_bookingId: string) => {
    setShowPaymentForm(false);
    toast.success('Catering booking confirmed!', {
      description: "You'll receive a confirmation email shortly.",
    });
    // Navigate to booking confirmation page or reset form
  };

  const handleCancelPayment = () => {
    setShowPaymentForm(false);
  };

  const modifiers: DayModifiers = {
    before: new Date(),
    disabled: () => false,
  };

  // Show Stripe Connect requirement if caterer doesn't have it set up
  if (!catererHasStripeConnect) {
    return (
      <div className='sticky top-24'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CreditCard className='h-5 w-5' />
              Payment Setup Required
            </CardTitle>
            <CardDescription>
              This caterer needs to complete payment setup before accepting bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='h-4 w-4 text-amber-600 mt-0.5' />
                <div className='text-sm text-amber-800'>
                  <p className='font-medium mb-1'>Payment Setup Pending</p>
                  <p>
                    This caterer is still setting up their payment processing. Please check back
                    later or contact them directly.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show payment form if user is proceeding with booking
  if (showPaymentForm) {
    const transformedCaterer = {
      id: caterer.id,
      name: caterer.name,
      pricePerPerson: pricePerPerson,
      minimumGuests: caterer.capacity?.min || 10,
      maximumGuests: caterer.capacity?.max || 500,
      ownerId: caterer.id,
    };

    const transformedMenu = selectedMenuDetails
      ? {
          id: selectedMenuDetails.id || selectedMenu || '1',
          name: selectedMenuDetails.name,
          price: selectedMenuDetails.price,
          description: selectedMenuDetails.description || '',
        }
      : null;

    return (
      <CateringBookingPayment
        caterer={transformedCaterer}
        selectedMenu={transformedMenu}
        selectedDate={date}
        selectedTime={selectedTime}
        guestCount={guestCount}
        eventLocation={eventLocation}
        onBookingComplete={handleBookingComplete}
        onCancel={handleCancelPayment}
      />
    );
  }

  return (
    <div className='sticky top-24'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Book this caterer
          </CardTitle>
          <CardDescription>
            {selectedMenuDetails
              ? `${selectedMenuDetails.name} - ${formatCurrency(selectedMenuDetails.price)}/person`
              : `Starting at ${formatCurrency(Number(selectedMenuDetails?.price || 0) as number)}/person`}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Event Date</label>
            <DayPicker
              mode='single'
              selected={date || undefined}
              onSelect={selectedDate => onDateSelect(selectedDate || null)}
              modifiers={modifiers}
              className='border rounded-md'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Event Time</label>
            <select
              value={selectedTime}
              onChange={e => setSelectedTime((e.target as HTMLInputElement).value)}
              className='w-full p-2 border rounded-md text-sm'
            >
              <option value='11:00'>11:00 AM</option>
              <option value='12:00'>12:00 PM</option>
              <option value='13:00'>1:00 PM</option>
              <option value='17:00'>5:00 PM</option>
              <option value='18:00'>6:00 PM</option>
              <option value='19:00'>7:00 PM</option>
              <option value='20:00'>8:00 PM</option>
            </select>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Number of Guests</label>
            <Input
              type='number'
              value={guestCount}
              onChange={e => onGuestCountChange(Number((e.target as HTMLInputElement) as number.value) as number)}
              min={caterer.capacity?.min}
              max={caterer.capacity?.max}
            />
            <p className='text-xs text-muted-foreground'>
              This caterer serves {caterer.capacity?.min}-{caterer.capacity?.max} guests
            </p>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Event Location *</label>
            <Input
              type='text'
              placeholder='Enter event address...'
              value={eventLocation}
              onChange={e => setEventLocation((e.target as HTMLInputElement).value)}
            />
            <p className='text-xs text-muted-foreground'>
              Full address where catering will be provided
            </p>
          </div>

          {/* Pricing Summary */}
          <div className='p-3 bg-gray-50 rounded-lg space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Price per person:</span>
              <span>{formatCurrency(pricePerPerson)}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span>Guests:</span>
              <span>{guestCount}</span>
            </div>
            <div className='flex justify-between font-medium'>
              <span>Subtotal:</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <p className='text-xs text-muted-foreground'>
              Final pricing includes platform and processing fees
            </p>
          </div>

          {/* Payment Security Badge */}
          <div className='flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <span className='text-sm text-green-800'>Secure payment with Stripe</span>
          </div>

          <Button
            onClick={handleBookCaterer}
            disabled={!isAuthenticated || !date || !eventLocation.trim()}
            className='w-full'
            size='lg'
          >
            {!isAuthenticated ? (
              'Sign in to book'
            ) : !date ? (
              'Select a date'
            ) : !eventLocation.trim() ? (
              'Enter event location'
            ) : (
              <>
                <CalendarIcon className='mr-2 h-4 w-4' />
                Continue to Payment
              </>
            )}
          </Button>

          {isAuthenticated && (
            <p className='text-xs text-center text-muted-foreground'>
              You'll review all details before payment
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CatererBookingCard;
