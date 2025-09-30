import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  QrCode,
  Download,
  Share2,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  ExternalLink,
  Users,
  Star,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatTimestamp } from '@/utils/dates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

interface TicketData {
  id: string;
  event_id: string;
  user_id: string;
  status: 'valid' | 'used' | 'cancelled' | 'expired';
  ticket_type: string;
  price: number;
  currency: string;
  purchase_date: string;
  qr_code: string;
  metadata?: {
    seat_number?: string | undefined;
    section?: string | undefined;
    special_access?: string[] | undefined;
  };
  event: {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    location: string;
    image_url?: string;
    organizer_name: string;
    venue_name?: string;
  };
}

interface TicketStats {
  total: number;
  valid: number;
  used: number;
  cancelled: number;
  expired: number;
  totalSpent: number;
}

const AccountTickets = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('valid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  // Fetch tickets
  const {
    data: tickets = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['user-tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          event:events (
            id,
            title,
            description,
            start_date,
            end_date,
            location,
            image_url,
            organizer_name,
            venue_name
          )
        `)
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      return data as TicketData[];
    },
    enabled: !!user?.id,
  });

  // Calculate ticket statistics
  const ticketStats: TicketStats = tickets.reduce(
    (acc, ticket) => {
      acc.total++;
      acc[ticket.status]++;
      acc.totalSpent += ticket.price;
      return acc;
    },
    { total: 0, valid: 0, used: 0, cancelled: 0, expired: 0, totalSpent: 0 }
  );

  // Filter tickets based on active tab and search
  const filteredTickets = tickets.filter((ticket) => {
    // Tab filter
    if (activeTab !== 'all' && ticket.status !== activeTab) return false;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        ticket.event.title.toLowerCase().includes(searchLower) ||
        ticket.event.location.toLowerCase().includes(searchLower) ||
        ticket.ticket_type.toLowerCase().includes(searchLower) ||
        ticket.event.organizer_name.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'used':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Ticket className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'used':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isEventUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const handleDownloadTicket = (ticket: TicketData) => {
    // TODO: Implement ticket PDF download
    toast.success('Ticket download started');
  };

  const handleShareTicket = (ticket: TicketData) => {
    if (navigator.share) {
      navigator.share({
        title: ticket.event.title,
        text: `Check out this event: ${ticket.event.title}`,
        url: `/events/${ticket.event.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/events/${ticket.event.id}`);
      toast.success('Event link copied to clipboard');
    }
  };

  const tabsConfig = [
    { value: 'all', label: 'All Tickets', count: ticketStats.total },
    { value: 'valid', label: 'Valid', count: ticketStats.valid },
    { value: 'used', label: 'Used', count: ticketStats.used },
    { value: 'cancelled', label: 'Cancelled', count: ticketStats.cancelled },
    { value: 'expired', label: 'Expired', count: ticketStats.expired },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
        <p className="text-muted-foreground">
          View and manage your event tickets and reservations
        </p>
      </div>

      {/* Ticket Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all events and timeframes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.valid}</div>
            <p className="text-xs text-muted-foreground">
              Ready for upcoming events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.used}</div>
            <p className="text-xs text-muted-foreground">
              Completed experiences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${ticketStats.totalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              On event tickets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-1 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets by event, location, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          {tabsConfig.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="relative">
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {tab.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <div className="aspect-video bg-gray-200 animate-pulse rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'all'
                    ? "You don't have any tickets yet."
                    : `No ${activeTab} tickets found.`}
                </p>
                {activeTab === 'all' && (
                  <Button className="mt-4" asChild>
                    <a href="/explore">Explore Events</a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Event Image */}
                  <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
                    {ticket.event.image_url ? (
                      <img
                        src={ticket.event.image_url}
                        alt={ticket.event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-white/80" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className={`${getStatusColor(ticket.status)} border`}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1 capitalize">{ticket.status}</span>
                      </Badge>
                    </div>

                    {/* Upcoming Event Indicator */}
                    {ticket.status === 'valid' && isEventUpcoming(ticket.event.start_date) && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-blue-600 text-white">
                          <Clock className="mr-1 h-3 w-3" />
                          Upcoming
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    {/* Event Details */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-2">{ticket.event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          by {ticket.event.organizer_name}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatTimestamp(ticket.event.start_date)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="line-clamp-1">{ticket.event.location}</span>
                        </div>

                        {ticket.metadata?.seat_number && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {ticket.metadata.section && `${ticket.metadata.section}, `}
                              Seat {ticket.metadata.seat_number}
                            </span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Ticket Info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{ticket.ticket_type}</p>
                          <p className="text-lg font-bold">
                            ${ticket.price.toFixed(2)} {ticket.currency}
                          </p>
                        </div>

                        <div className="flex gap-1">
                          {ticket.status === 'valid' && (
                            <Dialog open={showQRCode && selectedTicket?.id === ticket.id} onOpenChange={(open) => {
                              setShowQRCode(open);
                              if (!open) setSelectedTicket(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedTicket(ticket)}
                                >
                                  <QrCode className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Ticket QR Code</DialogTitle>
                                  <DialogDescription>
                                    Show this QR code at the event entrance
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col items-center space-y-4">
                                  <div className="p-4 bg-white rounded-lg">
                                    <QRCodeSVG
                                      value={ticket.qr_code}
                                      size={200}
                                      level="M"
                                      includeMargin
                                    />
                                  </div>
                                  <div className="text-center">
                                    <p className="font-medium">{ticket.event.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatTimestamp(ticket.event.start_date)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Ticket ID: {ticket.id.slice(0, 8)}...
                                    </p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a href={`/events/${ticket.event.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Event
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadTicket(ticket)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareTicket(ticket)}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Event
                              </DropdownMenuItem>
                              {ticket.event.venue_name && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Venue Details
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Special Access */}
                      {ticket.metadata?.special_access && ticket.metadata.special_access.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1">
                            {ticket.metadata.special_access.map((access, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {access}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountTickets;