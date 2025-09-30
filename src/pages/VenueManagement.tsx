import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Plus,
  Edit3,
  Eye,
  BarChart3,
  Calendar,
  MessageSquare,
  Star,
  DollarSign,
  Clock,
  Image,
  MapPin,
  TrendingUp,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Trash2,
  Search,
} from 'lucide-react';
import { EnhancedVenue, VenueBooking } from '@/types/venue';

interface VenueManagementStats {
  totalVenues: number;
  activeVenues: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  responseRate: number;
}

const VenueManagement: React.FC = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<EnhancedVenue[]>([]);
  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const [stats, setStats] = useState<VenueManagementStats>({
    totalVenues: 0,
    activeVenues: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    responseRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchVenuesAndBookings();
  }, []);

  const fetchVenuesAndBookings = async () => {
    try {
      setIsLoading(true);

      const { data: venuesData, error: venuesError } = await supabase
        .from('venues')
        .select(`
          *,
          venue_locations(*),
          venue_pricing(*),
          venue_availability(*),
          venue_media(*),
          venue_amenities(*),
          venue_policies(*),
          venue_analytics(*)
        `);

      if (venuesError) throw venuesError;

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('venue_bookings')
        .select('*')
        .in('venue_id', venuesData?.map(v => v.id) || []);

      if (bookingsError) throw bookingsError;

      const enhancedVenues: EnhancedVenue[] = venuesData?.map(venue => ({
        id: venue.id,
        name: venue.name,
        description: venue.description,
        venue_type: venue.venue_type,
        capacity: venue.capacity,
        status: venue.status,
        featured: venue.featured,
        verified: venue.verified,
        created_at: venue.created_at,
        updated_at: venue.updated_at,
        location: venue.venue_locations?.[0] || {},
        pricing: venue.venue_pricing?.[0] || {},
        availability: venue.venue_availability?.[0] || {},
        media: venue.venue_media?.[0] || {},
        amenities: venue.venue_amenities?.[0] || {},
        policies: venue.venue_policies?.[0] || {},
        host: {
          id: venue.host_id,
          name: 'Host Name',
          avatar_url: '',
          bio: '',
          response_rate: 95,
          response_time_hours: 2,
          joined_date: venue.created_at,
          verified: true,
          total_venues: 1,
          total_bookings: 0,
        },
        reviews: [],
        analytics: venue.venue_analytics?.[0] || {
          total_views: 0,
          total_bookings: 0,
          booking_conversion_rate: 0,
          average_rating: 0,
          total_reviews: 0,
          revenue_last_30_days: 0,
          occupancy_rate: 0,
        },
      })) || [];

      setVenues(enhancedVenues);
      setBookings(bookingsData || []);

      // Calculate stats
      const totalRevenue = bookingsData?.reduce((sum, booking) => sum + booking.total_amount, 0) || 0;
      const activeVenues = enhancedVenues.filter(v => v.status === 'active').length;
      const totalRating = enhancedVenues.reduce((sum, v) => sum + v.analytics.average_rating, 0);

      setStats({
        totalVenues: enhancedVenues.length,
        activeVenues,
        ...(bookingsData && { totalBookings: bookingsData.length || 0 }),
        totalRevenue,
        averageRating: enhancedVenues.length > 0 ? totalRating / enhancedVenues.length : 0,
        responseRate: 95,

      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load venue data');
    } finally {
      setIsLoading(false);
    }

  };

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         venue.location.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || venue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (venueId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('venues')
        .update({ status: newStatus })
        .eq('id', venueId);

      if (error) throw error;

      setVenues(prev => prev.map(venue =>
        venue.id === venueId ? { ...venue, status: newStatus as any } : venue
      ));

      toast.success(`Venue ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update venue status');
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (!window.confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (error) throw error;

      setVenues(prev => prev.filter(venue => venue.id !== venueId));
      toast.success('Venue deleted successfully');
    } catch (error) {
      toast.error('Failed to delete venue');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { className: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { className: 'bg-gray-100 text-gray-800', icon: Pause },
      pending: { className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      suspended: { className: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const { className, icon: Icon } = config[status as keyof typeof config] || config.inactive;

    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <Card className="border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-[#2B2B2B]">{value}</p>
            {trend && (
              <p className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend > 0 ? '+' : ''}{trend}% from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2B2B2B]">Venue Management</h1>
            <p className="text-gray-600 mt-1">Manage your venues, bookings, and performance</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/venues/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Link to="/venue/list-your-venue">
              <Button className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Venue
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Venues"
            value={stats.totalVenues}
            icon={MapPin}
            trend={12}
            color="bg-blue-500"
          />
          <StatCard
            title="Active Venues"
            value={stats.activeVenues}
            icon={CheckCircle}
            trend={8}
            color="bg-green-500"
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Calendar}
            trend={15}
            color="bg-purple-500"
          />
          <StatCard
            title="Revenue (30d)"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={23}
            color="bg-[#2B2B2B]"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-gray-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="venues" className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white">
              My Venues
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-[#2B2B2B]">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Venue
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Calendar className="h-5 w-5" />
                    View Calendar
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Messages
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-[#2B2B2B]">Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.slice(0, 5).map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#2B2B2B] rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-[#2B2B2B]">{booking.event_title}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.start_datetime).toLocaleDateString()} • {booking.guest_count} guests
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#2B2B2B]">${booking.total_amount}</p>
                        <Badge className={
                          booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="venues" className="space-y-6">
            {/* Search and Filters */}
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search venues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Venues List */}
            <div className="space-y-4">
              {filteredVenues.map(venue => (
                <Card key={venue.id} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          {venue.media.cover_image ? (
                            <img
                              src={venue.media.cover_image}
                              alt={venue.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-[#2B2B2B]">{venue.name}</h3>
                            {getStatusBadge(venue.status)}
                            {venue.featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{venue.venue_type} • {venue.capacity} capacity</p>
                          <p className="text-sm text-gray-500">{venue.location.city}, {venue.location.state}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <p className="text-sm text-gray-600">Views: {venue.analytics.total_views}</p>
                          <p className="text-sm text-gray-600">Bookings: {venue.analytics.total_bookings}</p>
                          <p className="text-sm font-medium text-[#2B2B2B]">
                            ${venue.pricing.base_price_per_hour}/hr
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/venues/${venue.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/venue/edit/${venue.id}`)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(venue.id, venue.status === 'active' ? 'inactive' : 'active')}
                          >
                            {venue.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteVenue(venue.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredVenues.length === 0 && (
              <Card className="border border-gray-200">
                <CardContent className="p-12 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No venues found</h3>
                  <p className="text-gray-600 mb-6">
                    {venues.length === 0
                      ? "You haven't listed any venues yet. Get started by adding your first venue."
                      : "No venues match your search criteria. Try adjusting your filters."
                    }
                  </p>
                  {venues.length === 0 && (
                    <Link to="/venue/list-your-venue">
                      <Button className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        List Your First Venue
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-[#2B2B2B]">All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.map(booking => (
                    <div key={booking.id} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[#2B2B2B]">{booking.event_title}</h4>
                          <p className="text-sm text-gray-600">{booking.event_type}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.start_datetime).toLocaleDateString()} - {new Date(booking.end_datetime).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#2B2B2B]">${booking.total_amount}</p>
                          <Badge className={
                            booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-[#2B2B2B]">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="response-time">Default Response Time</Label>
                  <Select defaultValue="2">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Within 1 hour</SelectItem>
                      <SelectItem value="2">Within 2 hours</SelectItem>
                      <SelectItem value="4">Within 4 hours</SelectItem>
                      <SelectItem value="24">Within 24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="auto-accept">Auto-accept bookings</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Automatically accept bookings that meet your criteria
                  </p>
                  <Select defaultValue="disabled">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disabled">Disabled</SelectItem>
                      <SelectItem value="verified">For verified guests only</SelectItem>
                      <SelectItem value="all">For all guests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notification Preferences</Label>
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New booking requests</span>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Message notifications</span>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Payment confirmations</span>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default VenueManagement;