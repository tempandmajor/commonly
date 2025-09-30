import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ReservationModal from './reservation/ReservationModal';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TicketIcon, CreditCard, AlertCircle, Clock } from 'lucide-react';
import { checkUserPaymentMethods } from '@/utils/payments/paymentMethodValidation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface PurchaseTicketButtonProps {
  eventId: string;
  eventTitle: string;
  eventDescription: string;
  ticketPrice: number;
  allOrNothing?: boolean | undefined;
  deadline?: string | undefined; // Campaign deadline
  goalReached?: boolean | undefined; // Whether the event has reached its funding goal
  className?: string | undefined;
  availableTickets?: number | undefined; // Available tickets count
  totalTickets?: number | undefined; // Total tickets for the event
  goalAmount?: number | undefined; // The funding goal amount
  currentAmount?: number | undefined; // Current amount raised
}

const PurchaseTicketButton: React.FC<PurchaseTicketButtonProps> = ({
  eventId,
  eventTitle,
  eventDescription,
  ticketPrice,
  allOrNothing = false,
  deadline = '',
  goalReached = false,
  className = '',
  availableTickets,
  totalTickets,
  goalAmount,
  currentAmount = 0,
}) => {
  const [showReservation, setShowReservation] = useState(false);
  const [isCheckingPaymentMethod, setIsCheckingPaymentMethod] = useState(false);
  const [showNoPaymentMethodDialog, setShowNoPaymentMethodDialog] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReserveClick = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/events/${eventId}`));
      return;
    }

    // Check if tickets are available
    if (availableTickets !== undefined && availableTickets <= 0) {
      toast.error('Sorry, this event is sold out.');
      return;
    }

    // Check if deadline has passed
    if (deadline && new Date(deadline) <= new Date()) {
      toast.error('The reservation deadline for this event has passed.');
      return;
    }

    // For ALL event types that require payment, validate payment method first
    if (ticketPrice > 0) {
      setIsCheckingPaymentMethod(true);
      try {
        const result = await checkUserPaymentMethods(user.id);
        setIsCheckingPaymentMethod(false);

        if (!result.hasPaymentMethods) {
          setShowNoPaymentMethodDialog(true);
          return;
        }

        // User has a payment method, proceed to reservation
        setShowReservation(true);
      } catch (error) {
        setIsCheckingPaymentMethod(false);
        toast.error('Something went wrong. Please try again.');
      }
    } else {
      // Free tickets still need reservation
      setShowReservation(true);
    }
  };

  const handleSuccess = () => {
    toast.success(
      "Ticket reserved successfully! You'll only be charged if the event reaches its goal before the deadline.",
      { duration: 6000 }
    );
    setShowReservation(false);
  };

  const handleError = (error: Error) => {
    toast.error(`Failed to reserve ticket: ${error.message}`);
    setShowReservation(false);
  };

  const getButtonText = () => {
    if (isCheckingPaymentMethod) {
      return (
        <>
          <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
          Checking...
        </>
      );
    }

    if (allOrNothing) {
      if (goalReached) {
        return (
          <>
            <TicketIcon className='mr-2 h-4 w-4' />
            Event Confirmed
            {ticketPrice > 0 && ` - $${ticketPrice.toFixed(2)}`}
          </>
        );
      }
      return (
        <>
          <Clock className='mr-2 h-4 w-4' />
          Reserve Ticket
          {ticketPrice > 0 && ` - $${ticketPrice.toFixed(2)}`}
        </>
      );
    }

    return (
      <>
        <TicketIcon className='mr-2 h-4 w-4' />
        Reserve Ticket
        {ticketPrice > 0 && ` - $${ticketPrice.toFixed(2)}`}
      </>
    );
  };

  const handleAddPaymentMethod = () => {
    setShowNoPaymentMethodDialog(false);
    navigate('/wallet/add-payment-method?redirect=' + encodeURIComponent(`/events/${eventId}`));
  };

  // Show sold out state if no tickets available
  const isSoldOut = availableTickets !== undefined && availableTickets <= 0;
  const isDeadlinePassed = deadline && new Date(deadline) <= new Date();

  return (
    <>
      <Button
        onClick={handleReserveClick}
        className={`${className} ${allOrNothing && !goalReached ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
        disabled={ticketPrice < 0 || isSoldOut || isCheckingPaymentMethod || isDeadlinePassed}
      >
        {isSoldOut ? (
          <>
            <AlertCircle className='mr-2 h-4 w-4' />
            Sold Out
          </>
        ) : isDeadlinePassed ? (
          <>
            <AlertCircle className='mr-2 h-4 w-4' />
            Deadline Passed
          </>
        ) : (
          getButtonText()
        )}
      </Button>

      <ReservationModal
        open={showReservation}
        onOpenChange={setShowReservation}
        eventId={eventId}
        eventTitle={eventTitle}
        eventDescription={eventDescription}
        ticketPrice={ticketPrice}
        availableTickets={availableTickets}
        deadline={deadline}
        goalAmount={goalAmount}
        currentAmount={currentAmount}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      <Dialog open={showNoPaymentMethodDialog} onOpenChange={setShowNoPaymentMethodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Method Required</DialogTitle>
            <DialogDescription>
              To reserve tickets for this event, you need to have a valid payment method on file.
              <br />
              <br />
              <strong>Important:</strong> You will only be charged if the event reaches its funding
              goal before
              {deadline ? ` ${new Date(deadline).toLocaleDateString()}` : ' the deadline'}. If the
              goal isn't reached, the event will be cancelled and you won't be charged.
            </DialogDescription>
          </DialogHeader>
          <div className='flex items-center justify-center py-4'>
            <CreditCard size={48} className='text-muted-foreground' />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowNoPaymentMethodDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPaymentMethod}>Add Payment Method</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PurchaseTicketButton;
