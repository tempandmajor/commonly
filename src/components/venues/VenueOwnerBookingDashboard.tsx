import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  MessageSquare,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VenueBooking {
  id: string;
  venue_id: string;
  user_id: string;
  event_title: string;
  event_type: string;
  event_description: string;
  start_datetime: string;
  end_datetime: string;
  guest_count: number;
  contact_phone: string;
  contact_email: string;
  special_requests: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  total_amount_cents: number;
  deposit_amount_cents: number;
  payment_status: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
  owner_response: string;
  responded_at: string;
  created_at: string;
  updated_at: string;
  user: {
    display_name: string;
    email: string;
    avatar_url: string;
  };
  venue: {
    name: string;
  };
}

interface VenueOwnerBookingDashboardProps {
  venueId?: string | undefined;
}

const VenueOwnerBookingDashboard: React.FC<VenueOwnerBookingDashboardProps> = ({ venueId }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, venueId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const query = supabase
        .from('venue_bookings')
        .select(
          `
          *,
          user:users!venue_bookings_user_id_fkey(display_name, email, avatar_url),
          venue:venues!venue_bookings_venue_id_fkey(name)
        `
        )
        .in('venue_id', venueId ? [venueId] : await getUserVenues())
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getUserVenues = async (): Promise<string[]> => {
    const { data, error } = await supabase.from('venues').select('id').eq('owner_id', user?.id);

    if (error) throw error;
    return data?.map(venue => venue.id) || [];
  };

  const handleBookingResponse = async (
    bookingId: string,
    status: 'approved' | 'rejected',
    response: string
  ) => {
    if (!response.trim()) {
      toast.error('Please provide a response message');
      return;
    }

    setProcessingBookingId(bookingId);

    try {
      const { error } = await supabase
        .from('venue_bookings')
        .update({
          status,
          owner_response: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Send notification to user (would implement notification system)
      toast.success(`Booking ${status} successfully`);

      // Clear response message
      setResponseMessage(prev => ({
          ...prev,
        [bookingId]: '',
      }));

      // Refresh bookings
      await fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const formatCurrency = (amountCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amountCents / 100);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }) as string,
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }) as string,
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, color: 'bg-yellow-500', label: 'Pending Review' },
      approved: { variant: 'default' as const, color: 'bg-green-500', label: 'Approved' },
      rejected: { variant: 'destructive' as const, color: 'bg-red-500', label: 'Rejected' },
      cancelled: { variant: 'outline' as const, color: 'bg-gray-500', label: 'Cancelled' },
      completed: { variant: 'default' as const, color: 'bg-blue-500', label: 'Completed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Payment Pending' },
      deposit_paid: { variant: 'default' as const, label: 'Deposit Paid' },
      fully_paid: { variant: 'default' as const, label: 'Fully Paid' },
      refunded: { variant: 'outline' as const, label: 'Refunded' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const completedBookings = bookings.filter(b =>
    ['rejected', 'cancelled', 'completed'].includes(b.status)
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
          <p className='mt-2 text-muted-foreground'>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold'>Venue Bookings</h2>
        <div className='flex gap-2'>
          <Badge variant='secondary'>{pendingBookings.length} Pending</Badge>
          <Badge variant='default'>{approvedBookings.length} Approved</Badge>
        </div>
      </div>

      <Tabs defaultValue='pending' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='pending'>Pending ({pendingBookings.length})</TabsTrigger>
          <TabsTrigger value='approved'>Approved ({approvedBookings.length})</TabsTrigger>
          <TabsTrigger value='completed'>History ({completedBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value='pending' className='space-y-4'>
          {pendingBookings.length === 0 ? (
            <Card>
              <CardContent className='py-8 text-center'>
                <AlertCircle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <p className='text-muted-foreground'>No pending bookings</p>
              </CardContent>
            </Card>
          ) : (
            pendingBookings.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                showActions={true}
                responseMessage={responseMessage[booking.id] || ''}
                onResponseChange={message =>
                  setResponseMessage(prev => ({ ...prev, [booking.id]: message }))
                }
                onApprove={response => handleBookingResponse(booking.id, 'approved', response)}
                onReject={response => handleBookingResponse(booking.id, 'rejected', response)}
                processing={processingBookingId === booking.id}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value='approved' className='space-y-4'>
          {approvedBookings.length === 0 ? (
            <Card>
              <CardContent className='py-8 text-center'>
                <CheckCircle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <p className='text-muted-foreground'>No approved bookings</p>
              </CardContent>
            </Card>
          ) : (
            approvedBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} showActions={false} />
            ))
          )}
        </TabsContent>

        <TabsContent value='completed' className='space-y-4'>
          {completedBookings.length === 0 ? (
            <Card>
              <CardContent className='py-8 text-center'>
                <Calendar className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <p className='text-muted-foreground'>No completed bookings</p>
              </CardContent>
            </Card>
          ) : (
            completedBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} showActions={false} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface BookingCardProps {
  booking: VenueBooking;
  showActions: boolean;
  responseMessage?: string | undefined;
  onResponseChange?: (message: string) => void | undefined;
  onApprove?: (response: string) => void | undefined;
  onReject?: (response: string) => void | undefined;
  processing?: boolean | undefined;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  showActions,
  responseMessage = '',
  onResponseChange,
  onApprove,
  onReject,
  processing = false,
}) => {
  const startDateTime = formatDateTime(booking.start_datetime);
  const endDateTime = formatDateTime(booking.end_datetime);

  return (
    <Card>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div>
            <CardTitle className='text-xl'>{booking.event_title}</CardTitle>
            <p className='text-muted-foreground'>{booking.venue.name}</p>
          </div>
          <div className='flex flex-col gap-2 items-end'>
            {getStatusBadge(booking.status)}
            {getPaymentStatusBadge(booking.payment_status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Event Details */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='font-medium'>{startDateTime.date}</p>
                <p className='text-sm text-muted-foreground'>
                  {startDateTime.time} - {endDateTime.time}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span>{booking.guest_count} guests</span>
            </div>

            <div className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
              <span>{formatCurrency(booking.total_amount_cents)}</span>
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>{booking.contact_email}</span>
            </div>

            {booking.contact_phone && (
              <div className='flex items-center gap-2'>
                <Phone className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>{booking.contact_phone}</span>
              </div>
            )}

            <div>
              <p className='text-sm font-medium'>Event Type:</p>
              <p className='text-sm text-muted-foreground'>{booking.event_type}</p>
            </div>
          </div>
        </div>

        {/* Event Description */}
        {booking.event_description && (
          <div>
            <p className='text-sm font-medium mb-1'>Event Description:</p>
            <p className='text-sm text-muted-foreground'>{booking.event_description}</p>
          </div>
        )}

        {/* Special Requests */}
        {booking.special_requests && (
          <div>
            <p className='text-sm font-medium mb-1'>Special Requests:</p>
            <p className='text-sm text-muted-foreground'>{booking.special_requests}</p>
          </div>
        )}

        {/* Owner Response */}
        {booking.owner_response && (
          <div className='bg-muted p-3 rounded-lg'>
            <p className='text-sm font-medium mb-1 flex items-center gap-2'>
              <MessageSquare className='h-4 w-4' />
              Your Response:
            </p>
            <p className='text-sm'>{booking.owner_response}</p>
            {booking.responded_at && (
              <p className='text-xs text-muted-foreground mt-1'>
                Responded on {formatDateTime(booking.responded_at).date}
              </p>
            )}
          </div>
        )}

        {/* Actions for pending bookings */}
        {showActions && (
          <div className='space-y-3 pt-4 border-t'>
            <div>
              <Label htmlFor={`response-${booking.id}`}>Response to customer:</Label>
              <Textarea
                id={`response-${booking.id}`}
                value={responseMessage}
                onChange={e => onResponseChange?.((e.target as HTMLInputElement).value)}
                placeholder='Provide details about your decision...'
                rows={3}
              />
            </div>

            <div className='flex gap-2'>
              <Button
                onClick={() => onApprove?.(responseMessage)}
                disabled={processing || !responseMessage.trim()}
                className='flex-1 bg-green-600 hover:bg-green-700'
              >
                <CheckCircle className='h-4 w-4 mr-2' />
                {processing ? 'Processing...' : 'Approve Booking'}
              </Button>

              <Button
                variant='destructive'
                onClick={() => onReject?.(responseMessage)}
                disabled={processing || !responseMessage.trim()}
                className='flex-1'
              >
                <XCircle className='h-4 w-4 mr-2' />
                {processing ? 'Processing...' : 'Reject Booking'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VenueOwnerBookingDashboard;
