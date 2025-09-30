import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, AlertCircle, CheckCircle, CreditCard, Calendar } from 'lucide-react';
import { ReservationService } from '@/services/reservationService';
import { StripeService } from '@/services/stripe';
import { useAuth } from '@/providers/AuthProvider';
import { formatDistanceToNow } from 'date-fns';

interface ReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  eventDescription: string;
  ticketPrice: number;
  availableTickets?: number | undefined;
  deadline?: string | undefined;
  goalAmount?: number | undefined;
  currentAmount?: number | undefined;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  eventDescription,
  ticketPrice,
  availableTickets,
  deadline,
  goalAmount,
  currentAmount = 0,
  onSuccess,
  onError,
}) => {
  const { user } = useAuth();
  const [isReserving, setIsReserving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  const quantity = 1; // For now, we'll keep it simple with 1 ticket per reservation
  const totalAmount = ticketPrice * quantity;
  const progressPercentage = goalAmount ? Math.min((currentAmount / goalAmount) * 100, 100) : 0;

  useEffect(() => {
    if (open && user) {
      loadPaymentMethods();
    }
  }, [open, user]);

  const loadPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const result = await StripeService.getPaymentMethods();
      setPaymentMethods(result.paymentMethods);
      if (result.paymentMethods.length > 0) {
        // Select the first payment method by default
        setSelectedPaymentMethod(result.paymentMethods[0].id);
      }
    } catch (_error) {
      // Error handling silently ignored
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const handleReserve = async () => {
    if (!selectedPaymentMethod) {
      onError(new Error('Please select a payment method'));
      return;
    }

    setIsReserving(true);
    try {
      const result = await ReservationService.reserveTickets({
        eventId,
        quantity,
        totalAmount,
        paymentMethodId: selectedPaymentMethod,
      });

      if (result.success) {
        onSuccess();
      } else {
        onError(new Error(result.error || 'Failed to reserve tickets'));
      }
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsReserving(false);
    }
  };

  const formatDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const timeRemaining = formatDistanceToNow(deadlineDate, { addSuffix: true });
    return {
      formatted: deadlineDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) as string,
      timeRemaining,
    };
  };

  const deadlineInfo = deadline ? formatDeadline(deadline) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5 text-blue-600' />
            Reserve Your Ticket
          </DialogTitle>
          <DialogDescription>
            Reserve your spot for {eventTitle}. You'll only be charged if the event reaches its
            funding goal.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Event Progress */}
          {goalAmount && (
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Funding Progress</span>
                <span className='font-medium'>
                  ${currentAmount.toLocaleString()} / ${goalAmount.toLocaleString()}
                </span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className='text-xs text-muted-foreground'>
                {progressPercentage.toFixed(1)}% funded
              </div>
            </div>
          )}

          {/* Deadline Info */}
          {deadlineInfo && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
              <div className='flex items-start gap-2'>
                <Calendar className='h-4 w-4 text-blue-600 mt-0.5' />
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-blue-900'>Funding Deadline</p>
                  <p className='text-xs text-blue-700'>{deadlineInfo.formatted}</p>
                  <p className='text-xs text-blue-600'>{deadlineInfo.timeRemaining}</p>
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-3'>
            <div className='flex items-start gap-2'>
              <AlertCircle className='h-4 w-4 text-amber-600 mt-0.5' />
              <div className='space-y-1'>
                <p className='text-sm font-medium text-amber-900'>How Reservations Work</p>
                <ul className='text-xs text-amber-700 space-y-1'>
                  <li>• Your payment method will be authorized but not charged</li>
                  <li>• You'll only be charged if the event reaches its funding goal</li>
                  <li>
                    • If the goal isn't reached, the event is cancelled and you're not charged
                  </li>
                  <li>• You'll be notified either way before the deadline</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          {loadingPaymentMethods ? (
            <div className='text-center py-4'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto'></div>
              <p className='text-sm text-muted-foreground mt-2'>Loading payment methods...</p>
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Payment Method</label>
              <div className='space-y-2'>
                {paymentMethods.map(method => (
                  <div
                    key={method.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <div className='flex items-center gap-3'>
                      <CreditCard className='h-4 w-4' />
                      <div className='flex-1'>
                        <p className='text-sm font-medium'>
                          {method.card?.brand?.toUpperCase()} •••• {method.card?.last4}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          Expires {method.card?.exp_month}/{method.card?.exp_year}
                        </p>
                      </div>
                      {method.isDefault && (
                        <Badge variant='secondary' className='text-xs'>
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className='text-center py-4'>
              <CreditCard className='h-8 w-8 text-muted-foreground mx-auto mb-2' />
              <p className='text-sm text-muted-foreground'>No payment methods found</p>
            </div>
          )}

          <Separator />

          {/* Ticket Summary */}
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Ticket Price</span>
              <span>${ticketPrice.toFixed(2)}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span>Quantity</span>
              <span>{quantity}</span>
            </div>
            <Separator />
            <div className='flex justify-between font-medium'>
              <span>Total (Reserved Amount)</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-2'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isReserving}
              className='flex-1'
            >
              Cancel
            </Button>
            <Button
              onClick={handleReserve}
              disabled={isReserving || !selectedPaymentMethod || paymentMethods.length === 0}
              className='flex-1 bg-blue-600 hover:bg-blue-700'
            >
              {isReserving ? (
                <>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                  Reserving...
                </>
              ) : (
                <>
                  <CheckCircle className='mr-2 h-4 w-4' />
                  Reserve Ticket
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationModal;
