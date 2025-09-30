import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Users,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  MessageSquare,
  DollarSign,
  AlertCircle,
  ChefHat,
  MapPin,
  Utensils,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency as formatCurrencyUSD, formatLongDate } from '@/lib/utils';
import { safeSupabaseQuery } from '@/utils/supabaseHelpers';

// Centralized formatting helpers (module scope)
const formatCurrencyCents = (amountCents: number) => {
  return formatCurrencyUSD(amountCents / 100);
};

const formatDateTimeParts = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: formatLongDate(date),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }) as string,
  };
};

interface CatererBooking {
  id: string;
  caterer_id: string;
  user_id: string;
  event_title: string;
  event_type: string;
  event_description: string;
  start_datetime: string;
  end_datetime: string;
  guest_count: number;
  selected_menu_id: string;
  dietary_restrictions: string;
  service_style: string;
  event_location: string;
  setup_requirements: string;
  contact_phone: string;
  contact_email: string;
  booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  special_requests?: string | undefined;
  total_cost?: number | undefined;
  payment_status?: 'pending' | undefined| 'paid' | 'refunded';
  user?: {
    name: string | undefined;
    email: string;
    avatar_url?: string | undefined;
  } | undefined;
}

interface CatererOwnerBookingDashboardProps {
  catererId: string;
}

const CatererOwnerBookingDashboard: React.FC<CatererOwnerBookingDashboardProps> = ({
  catererId,
}) => {
  const [bookings, setBookings] = useState<CatererBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<CatererBooking | null>(null);
  const [response, setResponse] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (catererId) {
      fetchBookings();
    }
  }, [catererId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const query = supabase
        .from('caterer_bookings')
        .select(
          `
          *,
          users!user_id (
            name,
            email,
            avatar_url
          )
        `
        )
        .eq('caterer_id', catererId)
        .order('created_at', { ascending: false });

      const { data: bookingsData, error } = await safeSupabaseQuery(query, []);

      if (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load bookings');
        return;
      }

      // Transform data safely
      const formattedBookings: CatererBooking[] = (bookingsData || [])
        .filter((item: any) => item && typeof item === 'object' && !item.error)
        .map((booking: any) => ({
          id: booking.id || '',
          caterer_id: booking.caterer_id || '',
          user_id: booking.user_id || '',
          event_title: booking.event_title || '',
          event_type: booking.event_type || '',
          event_description: booking.event_description || '',
          start_datetime: booking.start_datetime || new Date().toISOString(),
          end_datetime: booking.end_datetime || new Date().toISOString(),
          guest_count: Number(booking.guest_count) as number || 0,
          selected_menu_id: booking.selected_menu_id || '',
          dietary_restrictions: booking.dietary_restrictions || '',
          service_style: booking.service_style || '',
          event_location: booking.event_location || '',
          setup_requirements: booking.setup_requirements || '',
          contact_phone: booking.contact_phone || '',
          contact_email: booking.contact_email || '',
          booking_status: booking.booking_status || 'pending',
          created_at: booking.created_at || new Date().toISOString(),
          special_requests: booking.special_requests || '',
          total_cost: Number(booking.total_cost) as number || 0,
          payment_status: booking.payment_status || 'pending',
          user: booking.users
            ? {
                name: booking.users.name || 'Unknown',
                email: booking.users.email || '',
                avatar_url: booking.users.avatar_url || '',
              }
            : undefined,
        }));

      setBookings(formattedBookings);
    } catch (error) {
      console.error('Error in fetchBookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const query = supabase
        .from('caterer_bookings')
        .update({ booking_status: status })
        .eq('id', bookingId);

      const { error } = await safeSupabaseQuery(query, null);

      if (error) {
        toast.error('Failed to update booking status');
        return;
      }

      toast.success(`Booking ${status} successfully`);
      await fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const sendResponse = async () => {
    if (!selectedBooking || !response.trim()) {
      toast.error('Please enter a response message');
      return;
    }

    try {
      // For now, just show success - implement actual messaging later
      toast.success('Response sent to customer');
      setResponse('');
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Failed to send response');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'outline' as const, color: 'text-yellow-600', icon: AlertCircle },
      confirmed: { variant: 'default' as const, color: 'text-green-600', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, color: 'text-red-600', icon: XCircle },
      completed: { variant: 'secondary' as const, color: 'text-blue-600', icon: CheckCircle },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className='flex items-center gap-1'>
        <IconComponent className='h-3 w-3' />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filterBookings = (status: string) => {
    if (status === 'all') return bookings;
    return bookings.filter(booking => booking.booking_status === status);
  };

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {[1, 2, 3].map(i => (
            <Card key={i} className='animate-pulse'>
              <CardContent className='p-4'>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                <div className='h-6 bg-gray-200 rounded w-1/2'></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const pendingCount = bookings.filter(b => b.booking_status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.booking_status === 'confirmed').length;
  const completedCount = bookings.filter(b => b.booking_status === 'completed').length;

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <AlertCircle className='h-8 w-8 text-yellow-500' />
              <div>
                <p className='text-2xl font-bold'>{pendingCount}</p>
                <p className='text-sm text-gray-600'>Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <CheckCircle className='h-8 w-8 text-green-500' />
              <div>
                <p className='text-2xl font-bold'>{confirmedCount}</p>
                <p className='text-sm text-gray-600'>Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <CheckCircle className='h-8 w-8 text-blue-500' />
              <div>
                <p className='text-2xl font-bold'>{completedCount}</p>
                <p className='text-sm text-gray-600'>Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <DollarSign className='h-8 w-8 text-green-600' />
              <div>
                <p className='text-2xl font-bold'>
                  {formatCurrencyCents(
                    bookings
                      .filter(b => b.booking_status === 'completed')
                      .reduce((sum, b) => sum + (b.total_cost || 0), 0)
                  )}
                </p>
                <p className='text-sm text-gray-600'>Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='pending'>Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value='confirmed'>Confirmed ({confirmedCount})</TabsTrigger>
          <TabsTrigger value='completed'>Completed ({completedCount})</TabsTrigger>
          <TabsTrigger value='all'>All Bookings ({bookings.length})</TabsTrigger>
        </TabsList>

        {['pending', 'confirmed', 'completed', 'all'].map(status => (
          <TabsContent key={status} value={status} className='space-y-4'>
            {filterBookings(status).length === 0 ? (
              <Card>
                <CardContent className='p-8 text-center'>
                  <ChefHat className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-600'>
                    No {status === 'all' ? '' : status} bookings found
                  </p>
                </CardContent>
              </Card>
            ) : (
              filterBookings(status).map(booking => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg'>{booking.event_title}</CardTitle>
                      {getStatusBadge(booking.booking_status)}
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <div className='flex items-center space-x-2'>
                          <Calendar className='h-4 w-4 text-gray-500' />
                          <span className='text-sm'>
                            {formatDateTimeParts(booking.start_datetime).date}
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Users className='h-4 w-4 text-gray-500' />
                          <span className='text-sm'>{booking.guest_count} guests</span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <MapPin className='h-4 w-4 text-gray-500' />
                          <span className='text-sm'>{booking.event_location}</span>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <div className='flex items-center space-x-2'>
                          <Mail className='h-4 w-4 text-gray-500' />
                          <span className='text-sm'>{booking.contact_email}</span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Phone className='h-4 w-4 text-gray-500' />
                          <span className='text-sm'>{booking.contact_phone}</span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Utensils className='h-4 w-4 text-gray-500' />
                          <span className='text-sm'>{booking.service_style}</span>
                        </div>
                      </div>
                    </div>

                    {booking.event_description && (
                      <div>
                        <p className='text-sm font-medium mb-1'>Event Description:</p>
                        <p className='text-sm text-gray-600'>{booking.event_description}</p>
                      </div>
                    )}

                    {booking.dietary_restrictions && (
                      <div>
                        <p className='text-sm font-medium mb-1'>Dietary Restrictions:</p>
                        <p className='text-sm text-gray-600'>{booking.dietary_restrictions}</p>
                      </div>
                    )}

                    <div className='flex space-x-2 pt-4'>
                      {booking.booking_status === 'pending' && (
                        <>
                          <Button
                            size='sm'
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className='bg-green-600 hover:bg-green-700'
                          >
                            <CheckCircle className='h-4 w-4 mr-2' />
                            Confirm
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          >
                            <XCircle className='h-4 w-4 mr-2' />
                            Decline
                          </Button>
                        </>
                      )}

                      {booking.booking_status === 'confirmed' && (
                        <Button
                          size='sm'
                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                          className='bg-blue-600 hover:bg-blue-700'
                        >
                          <CheckCircle className='h-4 w-4 mr-2' />
                          Mark Complete
                        </Button>
                      )}

                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <MessageSquare className='h-4 w-4 mr-2' />
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Response Modal */}
      {selectedBooking && (
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Send Message to {selectedBooking.user?.name || 'Customer'}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='response'>Your Message</Label>
              <Textarea
                id='response'
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder='Type your message to the customer...'
                rows={4}
              />
            </div>
            <div className='flex space-x-2'>
              <Button onClick={sendResponse}>Send Message</Button>
              <Button variant='outline' onClick={() => setSelectedBooking(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CatererOwnerBookingDashboard;
