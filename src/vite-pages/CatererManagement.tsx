import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Trash2,
  Search,
  ChefHat,
  Utensils,
  Shield,
  Package,
} from 'lucide-react';
import { EnhancedCaterer, CatererBooking } from '@/types/caterer';

interface CatererManagementStats {
  totalCaterers: number;
  activeCaterers: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  responseRate: number;
}

const CatererManagement: React.FC = () => {
  const navigate = useNavigate();
  const [caterers, setCaterers] = useState<EnhancedCaterer[]>([]);
  const [bookings, setBookings] = useState<CatererBooking[]>([]);
  const [stats, setStats] = useState<CatererManagementStats>({
    totalCaterers: 0,
    activeCaterers: 0,
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
    fetchCaterersAndBookings();
  }, []);

  const fetchCaterersAndBookings = async () => {
    try {
      setIsLoading(true);

      // Mock data for caterers
      const mockCaterers: EnhancedCaterer[] = [
        {
          id: '1',
          name: 'Delicious Delights Catering',
          description: 'Premium wedding and corporate catering with over 15 years of experience. We specialize in elegant presentations and exceptional service.',
          business_type: 'company',
          status: 'active',
          featured: true,
          verified: true,
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-09-25T00:00:00Z',
          location: {
            address: '123 Culinary Lane',
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94102',
            country: 'US',
            service_radius_km: 50,
          },
          contact: {
            business_email: 'info@deliciousdelights.com',
            business_phone: '(415) 555-0123',
            website_url: 'https://deliciousdelights.com',
          },
          cuisine_types: ['Italian', 'Mediterranean', 'American', 'Vegetarian'],
          service_types: ['Wedding Catering', 'Corporate Events', 'Private Dinners', 'Buffet Service'],
          dietary_accommodations: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Kosher'],
          pricing: {
            minimum_guests: 25,
            maximum_guests: 500,
            base_price_per_person: 45.00,
            minimum_order_amount: 1125.00,
            price_range: '$$$',
            advance_booking_days: 14,
            deposit_percentage: 30,
            cancellation_policy: 'moderate',
          },
          sample_menus: [
            {
              id: 'menu-1',
              name: 'Elegant Wedding Package',
              menu_type: 'plated',
              description: 'Three-course plated dinner with appetizer station and champagne toast',
              price_per_person: 65.00,
            },
            {
              id: 'menu-2',
              name: 'Corporate Lunch Buffet',
              menu_type: 'buffet',
              description: 'Professional lunch spread with salads, entrees, and desserts',
              price_per_person: 28.00,
            },
          ],
          media: {
            cover_image: '/api/placeholder/800/600',
            gallery_images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
            menu_images: ['/api/placeholder/400/300'],
          },
          owner: {
            id: 'owner-1',
            name: 'Maria Rodriguez',
            avatar_url: '/api/placeholder/100/100',
            bio: 'Executive Chef with 20+ years experience in fine dining and catering',
            response_rate: 98,
            response_time_hours: 2,
            joined_date: '2024-01-15T00:00:00Z',
            verified: true,
            total_caterers: 1,
            total_bookings: 156,
          },
          reviews: [
            {
              id: 'review-1',
              user_name: 'Sarah Johnson',
              user_avatar: '/api/placeholder/50/50',
              rating: 5,
              comment: 'Absolutely phenomenal service! The food was exquisite and presentation perfect.',
              created_at: '2024-09-15T00:00:00Z',
              event_type: 'Wedding',
            },
          ],
          analytics: {
            total_views: 1247,
            total_bookings: 156,
            booking_conversion_rate: 12.5,
            average_rating: 4.8,
            total_reviews: 89,
            revenue_last_30_days: 45600,
            repeat_customer_rate: 35,
          },
        },
        {
          id: '2',
          name: 'Urban Eats Food Truck',
          description: 'Gourmet street food for events and parties. Fresh, creative dishes served from our mobile kitchen.',
          business_type: 'food_truck',
          status: 'active',
          featured: false,
          verified: true,
          created_at: '2024-03-01T00:00:00Z',
          updated_at: '2024-09-20T00:00:00Z',
          location: {
            address: '456 Food Street',
            city: 'Oakland',
            state: 'CA',
            postal_code: '94607',
            country: 'US',
            service_radius_km: 30,
          },
          contact: {
            business_email: 'orders@urbaneats.com',
            business_phone: '(510) 555-0456',
            website_url: 'https://urbaneats.com',
          },
          cuisine_types: ['Street Food', 'Mexican', 'Asian Fusion', 'BBQ'],
          service_types: ['Food Truck Service', 'Festival Catering', 'Corporate Events'],
          dietary_accommodations: ['Vegetarian', 'Vegan'],
          pricing: {
            minimum_guests: 15,
            maximum_guests: 200,
            base_price_per_person: 18.00,
            minimum_order_amount: 270.00,
            price_range: '$$',
            advance_booking_days: 7,
            deposit_percentage: 25,
            cancellation_policy: 'flexible',
          },
          sample_menus: [
            {
              id: 'menu-3',
              name: 'Street Taco Fiesta',
              menu_type: 'buffet',
              description: 'Assorted tacos with sides and sauces',
              price_per_person: 22.00,
            },
          ],
          media: {
            cover_image: '/api/placeholder/800/600',
            gallery_images: ['/api/placeholder/400/300'],
            menu_images: ['/api/placeholder/400/300'],
          },
          owner: {
            id: 'owner-2',
            name: 'Alex Chen',
            avatar_url: '/api/placeholder/100/100',
            bio: 'Food truck entrepreneur passionate about street food culture',
            response_rate: 95,
            response_time_hours: 1,
            joined_date: '2024-03-01T00:00:00Z',
            verified: true,
            total_caterers: 1,
            total_bookings: 78,
          },
          reviews: [],
          analytics: {
            total_views: 892,
            total_bookings: 78,
            booking_conversion_rate: 8.7,
            average_rating: 4.6,
            total_reviews: 34,
            revenue_last_30_days: 12400,
            repeat_customer_rate: 28,
          },
        },
      ];

      // Mock data for bookings
      const mockBookings: CatererBooking[] = [
        {
          id: 'booking-1',
          caterer_id: '1',
          event_title: 'Johnson Wedding Reception',
          event_type: 'Wedding',
          event_date: '2024-10-15T17:00:00Z',
          guest_count: 150,
          total_amount: 9750.00,
          deposit_amount: 2925.00,
          status: 'confirmed',
          special_requests: 'Vegetarian options for 20 guests',
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-15T00:00:00Z',
        },
        {
          id: 'booking-2',
          caterer_id: '2',
          event_title: 'Tech Company Lunch',
          event_type: 'Corporate Event',
          event_date: '2024-10-05T12:00:00Z',
          guest_count: 80,
          total_amount: 1760.00,
          deposit_amount: 440.00,
          status: 'pending',
          special_requests: 'Outdoor setup required',
          created_at: '2024-09-20T00:00:00Z',
          updated_at: '2024-09-20T00:00:00Z',
        },
      ];

      setCaterers(mockCaterers);
      setBookings(mockBookings);

      // Calculate stats
      const totalRevenue = mockBookings.reduce((sum, booking) => sum + booking.total_amount, 0);
      const activeCaterers = mockCaterers.filter(c => c.status === 'active').length;
      const totalRating = mockCaterers.reduce((sum, c) => sum + c.analytics.average_rating, 0);

      setStats({
        totalCaterers: mockCaterers.length,
        activeCaterers,
        totalBookings: mockBookings.length,
        totalRevenue,
        averageRating: mockCaterers.length > 0 ? totalRating / mockCaterers.length : 0,
        responseRate: 96,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load catering data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCaterers = caterers.filter(caterer => {
    const matchesSearch = caterer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         caterer.location.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caterer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (catererId: string, newStatus: string) => {
    try {
      setCaterers(prev => prev.map(caterer =>
        caterer.id === catererId ? { ...caterer, status: newStatus as any } : caterer
      ));

      toast.success(`Catering business ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update catering business status');
    }
  };

  const handleDeleteCaterer = async (catererId: string) => {
    if (!window.confirm('Are you sure you want to delete this catering business? This action cannot be undone.')) {
      return;
    }

    try {
      setCaterers(prev => prev.filter(caterer => caterer.id !== catererId));
      toast.success('Catering business deleted successfully');
    } catch (error) {
      toast.error('Failed to delete catering business');
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

  const getBusinessTypeBadge = (type: string) => {
    const config = {
      individual: { className: 'bg-blue-100 text-blue-800', icon: Users },
      company: { className: 'bg-purple-100 text-purple-800', icon: Package },
      restaurant: { className: 'bg-orange-100 text-orange-800', icon: Utensils },
      food_truck: { className: 'bg-green-100 text-green-800', icon: ChefHat },
    };

    const { className, icon: Icon } = config[type as keyof typeof config] || config.individual;

    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
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
            <h1 className="text-3xl font-bold text-[#2B2B2B]">Catering Management</h1>
            <p className="text-gray-600 mt-1">Manage your catering business, bookings, and performance</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/caterers/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Link to="/caterers/list-your-business">
              <Button className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Catering Business
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Businesses"
            value={stats.totalCaterers}
            icon={ChefHat}
            trend={18}
            color="bg-blue-500"
          />
          <StatCard
            title="Active Businesses"
            value={stats.activeCaterers}
            icon={CheckCircle}
            trend={12}
            color="bg-green-500"
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Calendar}
            trend={25}
            color="bg-purple-500"
          />
          <StatCard
            title="Revenue (30d)"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={31}
            color="bg-[#2B2B2B]"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-gray-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="businesses" className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white">
              My Businesses
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
                  <Link to="/caterers/list-your-business">
                    <Button variant="outline" className="h-20 flex-col gap-2 w-full">
                      <Plus className="h-5 w-5" />
                      Add Business
                    </Button>
                  </Link>
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
                          <ChefHat className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-[#2B2B2B]">{booking.event_title}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(booking.event_date).toLocaleDateString()} • {booking.guest_count} guests
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#2B2B2B]">${booking.total_amount.toLocaleString()}</p>
                        <Badge className={
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
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

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-[#2B2B2B]">Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{stats.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="font-medium">{stats.responseRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Booking Conversion</span>
                    <span className="font-medium">12.1%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-[#2B2B2B]">Popular Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Wedding Catering</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Corporate Events</span>
                    <span className="text-sm font-medium">32%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Private Dinners</span>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Other Events</span>
                    <span className="text-sm font-medium">8%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="businesses" className="space-y-6">
            {/* Search and Filters */}
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search catering businesses..."
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

            {/* Businesses List */}
            <div className="space-y-4">
              {filteredCaterers.map(caterer => (
                <Card key={caterer.id} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          {caterer.media.cover_image ? (
                            <img
                              src={caterer.media.cover_image}
                              alt={caterer.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ChefHat className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-[#2B2B2B]">{caterer.name}</h3>
                            {getStatusBadge(caterer.status)}
                            {getBusinessTypeBadge(caterer.business_type)}
                            {caterer.featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {caterer.verified && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {caterer.cuisine_types.slice(0, 3).join(', ')}
                            {caterer.cuisine_types.length > 3 && ` +${caterer.cuisine_types.length - 3} more`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {caterer.location.city}, {caterer.location.state} •
                            {caterer.pricing.minimum_guests}-{caterer.pricing.maximum_guests} guests
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <p className="text-sm text-gray-600">Views: {caterer.analytics.total_views}</p>
                          <p className="text-sm text-gray-600">Bookings: {caterer.analytics.total_bookings}</p>
                          <p className="text-sm font-medium text-[#2B2B2B]">
                            ${caterer.pricing.base_price_per_person}/person
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/caterers/${caterer.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/caterer/edit/${caterer.id}`)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(caterer.id, caterer.status === 'active' ? 'inactive' : 'active')}
                          >
                            {caterer.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCaterer(caterer.id)}
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

            {filteredCaterers.length === 0 && (
              <Card className="border border-gray-200">
                <CardContent className="p-12 text-center">
                  <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No catering businesses found</h3>
                  <p className="text-gray-600 mb-6">
                    {caterers.length === 0
                      ? "You haven't listed any catering businesses yet. Get started by adding your first business."
                      : "No businesses match your search criteria. Try adjusting your filters."
                    }
                  </p>
                  {caterers.length === 0 && (
                    <Link to="/caterers/list-your-business">
                      <Button className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        List Your First Business
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
                            {new Date(booking.event_date).toLocaleDateString()} • {booking.guest_count} guests
                          </p>
                          {booking.special_requests && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Special requests:</span> {booking.special_requests}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#2B2B2B]">${booking.total_amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Deposit: ${booking.deposit_amount.toLocaleString()}</p>
                          <Badge className={
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
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
                <CardTitle className="text-[#2B2B2B]">Business Settings</CardTitle>
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
                      <SelectItem value="verified">For verified clients only</SelectItem>
                      <SelectItem value="all">For all clients</SelectItem>
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
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Review notifications</span>
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

export default CatererManagement;