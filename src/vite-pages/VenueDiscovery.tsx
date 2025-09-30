import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  MapPin,
  Users,
  Star,
  Heart,
  Share2,
  Filter,
  Grid3X3,
  List,
  Map,
  Sparkles,
  Eye,
  Calendar,
  Plus,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/ui/loading';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { EnhancedVenue, VenueSearchFilters } from '@/types/venue';
import AppLayout from '@/components/layout/AppLayout';

const VENUE_TYPES = [
  'All Types',
  'Event Hall',
  'Conference Room',
  'Outdoor Space',
  'Restaurant',
  'Gallery',
  'Theater',
  'Studio',
  'Warehouse',
  'Rooftop',
  'Community Center',
];

const AMENITIES = [
  'WiFi',
  'Parking',
  'Sound System',
  'Lighting',
  'Catering',
  'Bar',
  'Stage',
  'A/V Equipment',
  'Wheelchair Accessible',
  'Climate Control',
];

const CAPACITY_RANGES = [
  { label: 'Any Capacity', min: 0, max: 10000 },
  { label: 'Intimate (1-25)', min: 1, max: 25 },
  { label: 'Small (26-75)', min: 26, max: 75 },
  { label: 'Medium (76-200)', min: 76, max: 200 },
  { label: 'Large (201-500)', min: 201, max: 500 },
  { label: 'Extra Large (500+)', min: 501, max: 10000 },
];

const PRICE_RANGES = [
  { label: 'Any Price', min: 0, max: 10000 },
  { label: 'Under $100/hr', min: 0, max: 100 },
  { label: '$100-300/hr', min: 100, max: 300 },
  { label: '$300-500/hr', min: 300, max: 500 },
  { label: '$500+/hr', min: 500, max: 10000 },
];

const VenueDiscovery: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [venues, setVenues] = useState<EnhancedVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [favoriteVenues, setFavoriteVenues] = useState<Set<string>>(new Set());

  // Search filters
  const [filters, setFilters] = useState<VenueSearchFilters>({
    query: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    venue_type: searchParams.get('type') || 'All Types',
    capacity_min: parseInt(searchParams.get('capacity_min') || '0'),
    capacity_max: parseInt(searchParams.get('capacity_max') || '10000'),
    price_min: parseInt(searchParams.get('price_min') || '0'),
    price_max: parseInt(searchParams.get('price_max') || '10000'),
    amenities: searchParams.get('amenities')?.split(',') || [],
    available_date: searchParams.get('date') || '',
    instant_booking: searchParams.get('instant') === 'true',
    sort_by: (searchParams.get('sort') as unknown as VenueearchFilters['sort_by']) || 'relevance',
    radius_km: parseInt(searchParams.get('radius') || '25'),
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.location) params.set('location', filters.location);
    if (filters.venue_type !== 'All Types') params.set('type', filters.venue_type);
    if (filters.capacity_min > 0) params.set('capacity_min', filters.capacity_min.toString());
    if (filters.capacity_max < 10000) params.set('capacity_max', filters.capacity_max.toString());
    if (filters.price_min > 0) params.set('price_min', filters.price_min.toString());
    if (filters.price_max < 10000) params.set('price_max', filters.price_max.toString());
    if (filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
    if (filters.available_date) params.set('date', filters.available_date);
    if (filters.instant_booking) params.set('instant', 'true');
    if (filters.sort_by !== 'relevance') params.set('sort', filters.sort_by);
    if (filters.radius_km !== 25) params.set('radius', filters.radius_km.toString());

    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Fetch venues
  useEffect(() => {
    fetchVenues();
  }, [filters]);

  const fetchVenues = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('venues')
        .select(`
          *,
          location:locations(*),
          host:users!venues_owner_id_fkey(
            id,
            name,
            display_name,
            avatar_url,
            created_at
          )
        `)
        .eq('status', 'active');

      // Apply filters
      if (filters.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters.venue_type !== 'All Types') {
        query = query.eq('venue_type', filters.venue_type);
      }

      if (filters.capacity_min > 0 || filters.capacity_max < 10000) {
        query = query.gte('capacity', filters.capacity_min).lte('capacity', filters.capacity_max);
      }

      // Apply sorting
      switch (filters.sort_by) {
        case 'price_low':
          query = query.order('base_price_per_hour', { ascending: true });
          break;
        case 'price_high':
          query = query.order('base_price_per_hour', { ascending: false });
          break;
        case 'rating':
          query = query.order('average_rating', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Transform data to match our enhanced types
      const transformedVenues: EnhancedVenue[] = (data || []).map((venue: any) => ({
        id: venue.id,
        name: venue.name || 'Unnamed Venue',
        description: venue.description || 'Professional venue space',
        venue_type: venue.venue_type || 'Event Space',
        capacity: venue.capacity || 50,
        status: venue.status || 'active',
        featured: venue.featured || false,
        verified: venue.verified || false,
        created_at: venue.created_at,
        updated_at: venue.updated_at,

        location: {
          id: venue.location?.id || '',
          address: venue.location?.address || 'Address not available',
          city: venue.location?.city || 'Unknown City',
          state: venue.location?.state || 'Unknown State',
          country: venue.location?.country || 'Unknown Country',
          postal_code: venue.location?.postal_code || '',
        },

        pricing: {
          base_price_per_hour: venue.base_price_per_hour || Math.max(50, venue.capacity * 2),
          minimum_booking_hours: venue.minimum_booking_hours || 2,
          maximum_booking_hours: venue.maximum_booking_hours || 12,
          weekend_multiplier: 1.2,
          holiday_multiplier: 1.5,
          security_deposit: venue.security_deposit || 200,
          cleaning_fee: venue.cleaning_fee || 50,
          service_fee_percentage: 0.08,
        },

        media: {
          cover_image: venue.cover_image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
          gallery_images: venue.gallery_images || [
            'https://images.unsplash.com/photo-1519167758481-83f29c1fe8c0?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
          ],
        },

        amenities: {
          basic: venue.amenities || ['WiFi', 'Parking', 'Climate Control'],
          premium: [],
          accessibility: [],
          technology: [],
          catering: [],
        },

        host: {
          id: venue.host?.id || '',
          name: venue.host?.display_name || venue.host?.name || 'Venue Host',
          avatar_url: venue.host?.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
          bio: '',
          response_rate: 95,
          response_time_hours: 2,
          joined_date: venue.host?.created_at || venue.created_at,
          verified: true,
          total_venues: 1,
          total_bookings: 0,
        },

        analytics: {
          total_views: Math.floor(Math.random() * 1000) + 100,
          total_bookings: Math.floor(Math.random() * 50),
          booking_conversion_rate: 0.15,
          average_rating: 4.2 + Math.random() * 0.8,
          total_reviews: Math.floor(Math.random() * 25) + 5,
          revenue_last_30_days: 0,
          occupancy_rate: 0.6,
        },

        availability: {
          available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          available_hours: { start: '08:00', end: '22:00' },
          blackout_dates: [],
          advance_booking_days: 1,
          instant_booking_enabled: venue.instant_booking_enabled || false,
        },

        policies: {
          cancellation_policy: 'moderate',
          house_rules: ['No smoking indoors', 'Respect noise levels', 'Clean up after event'],
          additional_terms: '',
          smoking_allowed: false,
          pets_allowed: false,
          children_welcome: true,
        },

        reviews: [],
      }));

      setVenues(transformedVenues);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  // Filter venues based on client-side filters
  const filteredVenues = useMemo(() => {
    return venues.filter(venue => {
      // Price filter
      if (venue.pricing.base_price_per_hour < filters.price_min ||
          venue.pricing.base_price_per_hour > filters.price_max) {
        return false;
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const venueAmenities = venue.amenities.basic;
        const hasAllAmenities = filters.amenities.every(amenity =>
          venueAmenities.some(va => va.toLowerCase().includes(amenity.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }

      // Instant booking filter
      if (filters.instant_booking && !venue.availability.instant_booking_enabled) {
        return false;
      }

      return true;
    });
  }, [venues, filters]);

  const handleFilterChange = (key: keyof VenueSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleFavorite = (venueId: string) => {
    setFavoriteVenues(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(venueId)) {
        newFavorites.delete(venueId);
        toast.success('Removed from favorites');
      } else {
        newFavorites.add(venueId);
        toast.success('Added to favorites');
      }
      return newFavorites;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      location: '',
      venue_type: 'All Types',
      capacity_min: 0,
      capacity_max: 10000,
      price_min: 0,
      price_max: 10000,
      amenities: [],
      available_date: '',
      instant_booking: false,
      sort_by: 'relevance',
      radius_km: 25,
    });
  };

  const activeFilterCount = [
    filters.venue_type !== 'All Types',
    filters.capacity_min > 0 || filters.capacity_max < 10000,
    filters.price_min > 0 || filters.price_max < 10000,
    filters.amenities.length > 0,
    filters.instant_booking,
    filters.available_date,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <LoadingSkeleton skeletonType="text" skeletonCount={2} />
          </div>
          <LoadingSkeleton skeletonType="card" className="mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} skeletonType="card" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#2B2B2B] to-gray-800 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Find Your Perfect Venue
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                Discover amazing spaces for weddings, corporate events, parties, and more.
                Book directly with venue owners and save on fees.
              </p>

              {/* Main Search Bar */}
              <div className="bg-white rounded-lg p-6 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search venues..."
                      value={filters.query}
                      onChange={(e) => handleFilterChange('query', (e.target as HTMLInputElement).value)}
                      className="pl-10 h-12 border-gray-300 text-[#2B2B2B]"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Location"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', (e.target as HTMLInputElement).value)}
                      className="pl-10 h-12 border-gray-300 text-[#2B2B2B]"
                    />
                  </div>

                  <Input
                    type="date"
                    value={filters.available_date}
                    onChange={(e) => handleFilterChange('available_date', (e.target as HTMLInputElement).value)}
                    className="h-12 border-gray-300 text-[#2B2B2B]"
                  />

                  <Button
                    size="lg"
                    className="h-12 bg-[#2B2B2B] hover:bg-gray-800 text-white"
                    onClick={fetchVenues}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Stats and Actions Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="flex items-center gap-6 mb-4 lg:mb-0">
              <div>
                <h2 className="text-2xl font-bold text-[#2B2B2B]">
                  {filteredVenues.length} Venues Available
                </h2>
                <div className="flex items-center gap-6 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#2B2B2B]" />
                    <span>{venues.filter(v => v.featured).length} featured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[#2B2B2B]" />
                    <span>Virtual tours available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#2B2B2B]" />
                    <span>Instant booking</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/venue/list-your-venue">
                <Button className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  List Your Venue
                </Button>
              </Link>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-gray-300 text-[#2B2B2B]"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-[#2B2B2B] text-white">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              <div className="flex border rounded-lg border-gray-300">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-r-none ${
                    viewMode === 'grid'
                      ? 'bg-[#2B2B2B] text-white hover:bg-gray-800'
                      : 'text-[#2B2B2B] hover:bg-gray-50'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-none ${
                    viewMode === 'list'
                      ? 'bg-[#2B2B2B] text-white hover:bg-gray-800'
                      : 'text-[#2B2B2B] hover:bg-gray-50'
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className={`rounded-l-none ${
                    viewMode === 'map'
                      ? 'bg-[#2B2B2B] text-white hover:bg-gray-800'
                      : 'text-[#2B2B2B] hover:bg-gray-50'
                  }`}
                >
                  <Map className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mb-8 border border-gray-200">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                      Venue Type
                    </label>
                    <Select
                      value={filters.venue_type}
                      onValueChange={(value) => handleFilterChange('venue_type', value)}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VENUE_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                      Capacity
                    </label>
                    <Select
                      value={`${filters.capacity_min}-${filters.capacity_max}`}
                      onValueChange={(value) => {
                        const range = CAPACITY_RANGES.find(r => `${r.min}-${r.max}` === value);
                        if (range) {
                          handleFilterChange('capacity_min', range.min);
                          handleFilterChange('capacity_max', range.max);
                        }
                      }}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAPACITY_RANGES.map(range => (
                          <SelectItem key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                      Price Range
                    </label>
                    <Select
                      value={`${filters.price_min}-${filters.price_max}`}
                      onValueChange={(value) => {
                        const range = PRICE_RANGES.find(r => `${r.min}-${r.max}` === value);
                        if (range) {
                          handleFilterChange('price_min', range.min);
                          handleFilterChange('price_max', range.max);
                        }
                      }}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICE_RANGES.map(range => (
                          <SelectItem key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                      Sort By
                    </label>
                    <Select
                      value={filters.sort_by}
                      onValueChange={(value) => handleFilterChange('sort_by', value)}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Most Relevant</SelectItem>
                        <SelectItem value="price_low">Price: Low to High</SelectItem>
                        <SelectItem value="price_high">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Amenities Filter */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-[#2B2B2B] mb-3">
                    Amenities
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(amenity => (
                      <button
                        key={amenity}
                        onClick={() => {
                          const newAmenities = filters.amenities.includes(amenity)
                            ? filters.amenities.filter(a => a !== amenity)
                            : [...filters.amenities, amenity];
                          handleFilterChange('amenities', newAmenities);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          filters.amenities.includes(amenity)
                            ? 'bg-[#2B2B2B] text-white border-[#2B2B2B]'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#2B2B2B]'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Actions */}
                {activeFilterCount > 0 && (
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
                    <div className="flex flex-wrap gap-2">
                      {filters.venue_type !== 'All Types' && (
                        <Badge className="bg-gray-100 text-gray-800">
                          Type: {filters.venue_type}
                          <button
                            onClick={() => handleFilterChange('venue_type', 'All Types')}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.amenities.map(amenity => (
                        <Badge key={amenity} className="bg-gray-100 text-gray-800">
                          {amenity}
                          <button
                            onClick={() => {
                              const newAmenities = filters.amenities.filter(a => a !== amenity);
                              handleFilterChange('amenities', newAmenities);
                            }}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear all filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {viewMode === 'map' ? (
            <Card className="h-96 border border-gray-200">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Map className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-[#2B2B2B] mb-2">
                    Interactive Map Coming Soon
                  </h3>
                  <p className="text-gray-600">
                    We're working on an interactive map view to help you find venues by location.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : filteredVenues.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            }`}>
              {filteredVenues.map(venue => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  viewMode={viewMode}
                  isFavorited={favoriteVenues.has(venue.id)}
                  onToggleFavorite={() => handleToggleFavorite(venue.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-16 border border-gray-200">
              <CardContent>
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-xl font-bold text-[#2B2B2B] mb-2">
                  No venues found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or filters to see more results.
                </p>
                <Button onClick={clearAllFilters} variant="outline">
                  Clear all filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

// Venue Card Component
interface VenueCardProps {
  venue: EnhancedVenue;
  viewMode: 'grid' | 'list';
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  viewMode,
  isFavorited,
  onToggleFavorite
}) => {
  const handleShare = () => {
    const url = `${window.location.origin}/venues/${venue.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Venue link copied to clipboard');
    });
  };

  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white">
        <Link to={`/venues/${venue.id}`} className="block">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="relative w-48 h-32 flex-shrink-0">
                <img
                  src={venue.media.cover_image}
                  alt={venue.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                {venue.featured && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-[#2B2B2B] text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xl text-[#2B2B2B] group-hover:text-gray-800 transition-colors truncate">
                      {venue.name}
                    </h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="text-sm truncate">
                        {venue.location.city}, {venue.location.state}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleFavorite();
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleShare();
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Share2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(venue.analytics.average_rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm font-medium">
                      {venue.analytics.average_rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    ({venue.analytics.total_reviews} reviews)
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {venue.venue_type}
                  </Badge>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {venue.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>Up to {venue.capacity.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center font-semibold text-[#2B2B2B]">
                      <span>${venue.pricing.base_price_per_hour}/hour</span>
                    </div>
                  </div>

                  {venue.availability.instant_booking_enabled && (
                    <Badge className="bg-green-100 text-green-800">
                      Instant Book
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-96 flex flex-col border border-gray-200 bg-white">
      <div className="relative h-48 overflow-hidden">
        <Link to={`/venues/${venue.id}`}>
          <img
            src={venue.media.cover_image}
            alt={venue.name}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
          />

          {venue.featured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-[#2B2B2B] text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            </div>
          )}

          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleShare();
              }}
              className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
            >
              <Share2 className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {venue.availability.instant_booking_enabled && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-green-500 text-white">
                Instant Book
              </Badge>
            </div>
          )}
        </Link>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <Link to={`/venues/${venue.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-[#2B2B2B] group-hover:text-gray-800 transition-colors">
              {venue.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="text-sm truncate">
            {venue.location.city}, {venue.location.state}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(venue.analytics.average_rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-1 text-sm font-medium">
              {venue.analytics.average_rating.toFixed(1)}
            </span>
          </div>
          <span className="text-sm text-gray-600">
            ({venue.analytics.total_reviews})
          </span>
        </div>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            <span>Up to {venue.capacity.toLocaleString()}</span>
          </div>
          <div className="flex items-center font-semibold text-[#2B2B2B]">
            <span>${venue.pricing.base_price_per_hour}/hour</span>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 border-gray-300" asChild>
              <Link to={`/venues/${venue.id}`}>View Details</Link>
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-[#2B2B2B] hover:bg-gray-800 text-white"
              asChild
            >
              <Link to={`/venues/${venue.id}?booking=true`}>
                <Calendar className="h-4 w-4 mr-2" />
                Book Now
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VenueDiscovery;