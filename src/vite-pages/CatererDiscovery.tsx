import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Users,
  DollarSign,
  ChefHat,
  Award,
  Grid3X3,
  List,
  Map,
  SlidersHorizontal,
  X,
  Calendar,
  Clock,
  Sparkles,
  Heart,
  Eye,
  TrendingUp,
  Plus,
} from 'lucide-react';
import {
  EnhancedCaterer,
  CatererSearchFilters,
  CUISINE_TYPES,
  SERVICE_TYPES,
  DIETARY_ACCOMMODATIONS,
  EVENT_TYPES,
} from '@/types/caterer';

interface CatererDiscoveryState {
  caterers: EnhancedCaterer[];
  filteredCaterers: EnhancedCaterer[];
  featuredCaterers: EnhancedCaterer[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
}

const CatererDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [state, setState] = useState<CatererDiscoveryState>({
    caterers: [],
    filteredCaterers: [],
    featuredCaterers: [],
    isLoading: true,
    error: null,
    totalCount: 0,
    hasMore: false,
  });

  const [filters, setFilters] = useState<CatererSearchFilters>({
    query: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    cuisine_types: [],
    service_types: [],
    dietary_accommodations: [],
    price_range: [],
    guest_count_min: 0,
    guest_count_max: 500,
    event_date: '',
    event_type: '',
    distance_km: 50,
    rating_min: 0,
    instant_booking: false,
    featured_only: false,
    verified_only: false,
    sort_by: 'relevance',
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchCaterers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, state.caterers]);

  const fetchCaterers = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data: caterersData, error: caterersError } = await supabase
        .from('caterers')
        .select(`
          *,
          caterer_locations(*),
          caterer_pricing(*),
          caterer_media(*),
          caterer_menus(*),
          caterer_reviews(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (caterersError) throw caterersError;

      const enhancedCaterers: EnhancedCaterer[] = caterersData?.map((caterer: any) => ({
        id: caterer.id,
        name: caterer.name,
        description: caterer.description,
        business_type: caterer.business_type || 'company',
        status: caterer.status,
        featured: caterer.featured || false,
        verified: caterer.verified || false,
        created_at: caterer.created_at,
        updated_at: caterer.updated_at,
        cuisine_types: caterer.cuisine_types || [],
        service_types: caterer.service_types || [],
        dietary_accommodations: caterer.dietary_accommodations || [],
        specialties: caterer.specialties || [],
        location: caterer.caterer_locations?.[0] || {
          id: '',
          address: caterer.address || '',
          city: caterer.city || '',
          state: caterer.state || '',
          country: 'US',
          postal_code: caterer.postal_code || '',
          service_radius_km: 25,
        },
        contact: {
          business_email: caterer.business_email || '',
          business_phone: caterer.business_phone || '',
          website_url: caterer.website_url,
        },
        pricing: caterer.caterer_pricing?.[0] || {
          base_price_per_person: caterer.base_price_per_person || 25,
          minimum_order_amount: caterer.minimum_order_amount || 250,
          maximum_guest_capacity: caterer.maximum_guest_capacity || 200,
          price_range: caterer.price_range || '$$',
          service_fee_percentage: 15,
          additional_fees: [],
          deposit_percentage: 50,
        },
        capacity: {
          minimum_guests: caterer.minimum_guests || 10,
          maximum_guests: caterer.maximum_guests || 200,
          recommended_group_size: 50,
          advance_booking_days: 7,
          preparation_time_hours: 4,
        },
        media: caterer.caterer_media?.[0] || {
          cover_image: caterer.cover_image,
          gallery_images: caterer.gallery_images || [],
          menu_images: [],
          portfolio_images: [],
        },
        menus: caterer.caterer_menus || [],
        availability: {
          operating_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          operating_hours: { start: '08:00', end: '22:00' },
          blackout_dates: [],
          holiday_availability: true,
          weekend_surcharge_percentage: 0,
          holiday_surcharge_percentage: 0,
          booking_lead_time_days: 7,
          same_day_booking_enabled: false,
          instant_booking_enabled: caterer.instant_booking || false,
        },
        policies: {
          cancellation_policy: caterer.cancellation_policy || 'moderate',
          deposit_policy: '50% deposit required',
          payment_terms: 'Net 30',
          dietary_accommodations: caterer.dietary_accommodations || [],
          allergen_policy: 'Please inform us of any allergies',
          alcohol_service: caterer.alcohol_service || false,
          setup_breakdown_included: true,
          additional_terms: '',
          liability_insurance: true,
          health_permit_number: caterer.health_permit_number,
        },
        verification: {
          business_license_verified: caterer.business_license_verified || false,
          insurance_verified: caterer.insurance_verified || false,
          health_permit_verified: caterer.health_permit_verified || false,
          identity_verified: caterer.identity_verified || false,
          background_check_completed: caterer.background_check_completed || false,
          verification_date: caterer.verification_date,
          trust_score: caterer.trust_score || 75,
        },
        owner: {
          id: caterer.owner_id || caterer.id,
          name: caterer.owner_name || 'Caterer',
          email: caterer.business_email || '',
          phone: caterer.business_phone || '',
          bio: caterer.owner_bio || '',
          avatar_url: caterer.owner_avatar,
          years_experience: caterer.years_experience || 5,
          certifications: caterer.certifications || [],
          response_rate: 95,
          response_time_hours: 2,
          joined_date: caterer.created_at,
          verified: caterer.verified || false,
          total_events: caterer.total_events || 0,
          total_revenue: 0,
        },
        reviews: caterer.caterer_reviews || [],
        analytics: {
          total_views: 0,
          total_inquiries: 0,
          total_bookings: caterer.total_events || 0,
          inquiry_conversion_rate: 0,
          booking_conversion_rate: 0,
          average_rating: caterer.average_rating || 0,
          total_reviews: caterer.caterer_reviews?.length || 0,
          revenue_last_30_days: 0,
          repeat_customer_rate: 0,
          average_order_value: 0,
          peak_booking_months: [],
        },
      })) || [];

      const featuredCaterers = enhancedCaterers.filter(c => c.featured);

      setState(prev => ({
          ...prev,
        caterers: enhancedCaterers,
        featuredCaterers,
        totalCount: enhancedCaterers.length,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching caterers:', error);
      setState(prev => ({
          ...prev,
        error: 'Failed to load caterers',
        isLoading: false,
      }));
      toast.error('Failed to load caterers');
    }
  };

  const applyFilters = () => {
    let filtered = [...state.caterers];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(caterer =>
        caterer.name.toLowerCase().includes(query) ||
        caterer.description.toLowerCase().includes(query) ||
        caterer.cuisine_types.some(cuisine => cuisine.toLowerCase().includes(query)) ||
        caterer.specialties.some(specialty => specialty.toLowerCase().includes(query))
      );
    }

    // Location filter
    if (filters.location) {
      const location = filters.location.toLowerCase();
      filtered = filtered.filter(caterer =>
        caterer.location.city.toLowerCase().includes(location) ||
        caterer.location.state.toLowerCase().includes(location)
      );
    }

    // Cuisine types
    if (filters.cuisine_types.length > 0) {
      filtered = filtered.filter(caterer =>
        filters.cuisine_types.some(cuisine =>
          caterer.cuisine_types.includes(cuisine)
        )
      );
    }

    // Service types
    if (filters.service_types.length > 0) {
      filtered = filtered.filter(caterer =>
        filters.service_types.some(service =>
          caterer.service_types.includes(service)
        )
      );
    }

    // Dietary accommodations
    if (filters.dietary_accommodations.length > 0) {
      filtered = filtered.filter(caterer =>
        filters.dietary_accommodations.some(diet =>
          caterer.dietary_accommodations.includes(diet)
        )
      );
    }

    // Price range
    if (filters.price_range.length > 0) {
      filtered = filtered.filter(caterer =>
        filters.price_range.includes(caterer.pricing.price_range)
      );
    }

    // Guest count
    if (filters.guest_count_min > 0 || filters.guest_count_max < 500) {
      filtered = filtered.filter(caterer =>
        caterer.capacity.minimum_guests <= filters.guest_count_max &&
        caterer.capacity.maximum_guests >= filters.guest_count_min
      );
    }

    // Rating filter
    if (filters.rating_min > 0) {
      filtered = filtered.filter(caterer =>
        caterer.analytics.average_rating >= filters.rating_min
      );
    }

    // Feature filters
    if (filters.featured_only) {
      filtered = filtered.filter(caterer => caterer.featured);
    }

    if (filters.verified_only) {
      filtered = filtered.filter(caterer => caterer.verified);
    }

    if (filters.instant_booking) {
      filtered = filtered.filter(caterer => caterer.availability.instant_booking_enabled);
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (filters.sort_by) {
        case 'price_low':
          return a.pricing.base_price_per_person - b.pricing.base_price_per_person;
        case 'price_high':
          return b.pricing.base_price_per_person - a.pricing.base_price_per_person;
        case 'rating':
          return b.analytics.average_rating - a.analytics.average_rating;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popular':
          return b.analytics.total_bookings - a.analytics.total_bookings;
        default:
          return 0;
      }
    });

    setState(prev => ({ ...prev, filteredCaterers: filtered }));
  };

  const updateFilter = (key: keyof CatererSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterChange = (
    type: 'cuisine_types' | 'service_types' | 'dietary_accommodations' | 'price_range',
    value: string,
    checked: boolean
  ) => {
    const current = filters[type] as string[];
    const updated = checked
      ? [...current, value]
      : current.filter(item => item !== value);

    updateFilter(type, updated);
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      location: '',
      cuisine_types: [],
      service_types: [],
      dietary_accommodations: [],
      price_range: [],
      guest_count_min: 0,
      guest_count_max: 500,
      event_date: '',
      event_type: '',
      distance_km: 50,
      rating_min: 0,
      instant_booking: false,
      featured_only: false,
      verified_only: false,
      sort_by: 'relevance',
    });
  };

  const activeFiltersCount =
    filters.cuisine_types.length +
    filters.service_types.length +
    filters.dietary_accommodations.length +
    filters.price_range.length +
    (filters.guest_count_min > 0 ? 1 : 0) +
    (filters.guest_count_max < 500 ? 1 : 0) +
    (filters.rating_min > 0 ? 1 : 0) +
    (filters.featured_only ? 1 : 0) +
    (filters.verified_only ? 1 : 0) +
    (filters.instant_booking ? 1 : 0);

  const getTabCaterers = () => {
    const base = state.filteredCaterers;
    switch (activeTab) {
      case 'featured':
        return base.filter(c => c.featured);
      case 'verified':
        return base.filter(c => c.verified);
      case 'instant':
        return base.filter(c => c.availability.instant_booking_enabled);
      default:
        return base;
    }
  };

  const tabCaterers = getTabCaterers();

  const CatererCard: React.FC<{ caterer: EnhancedCaterer; variant?: 'default' | 'featured' }> = ({
    caterer,
    variant = 'default'
  }) => (
    <Link to={`/caterers/${caterer.id}`}>
      <Card className={`group hover:shadow-lg transition-all duration-300 border border-gray-200 ${
        variant === 'featured' ? 'ring-2 ring-[#2B2B2B]/10' : ''
      }`}>
        <div className="relative">
          <div className="aspect-[4/3] bg-gray-200 rounded-t-lg overflow-hidden">
            {caterer.media.cover_image ? (
              <img
                src={caterer.media.cover_image}
                alt={caterer.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#2B2B2B] to-gray-600 flex items-center justify-center">
                <ChefHat className="h-12 w-12 text-white/70" />
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {caterer.featured && (
              <Badge className="bg-[#2B2B2B] text-white">
                <Award className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {caterer.verified && (
              <Badge className="bg-green-600 text-white">
                <Star className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          {/* Price range */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 text-[#2B2B2B]">
              {caterer.pricing.price_range}
            </Badge>
          </div>

          {/* Quick actions */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 bg-white hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Handle favorite
                }}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h3 className="text-xl font-semibold text-[#2B2B2B] group-hover:text-gray-800 transition-colors">
                {caterer.name}
              </h3>
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                {caterer.description}
              </p>
            </div>

            {/* Rating and location */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {caterer.analytics.average_rating > 0 && (
                  <>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium">
                        {caterer.analytics.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({caterer.analytics.total_reviews} reviews)
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-3 w-3 mr-1" />
                {caterer.location.city}, {caterer.location.state}
              </div>
            </div>

            {/* Capacity and pricing */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                {caterer.capacity.minimum_guests}-{caterer.capacity.maximum_guests} guests
              </div>
              <div className="flex items-center text-sm font-semibold text-[#2B2B2B]">
                <DollarSign className="h-4 w-4 mr-1" />
                ${caterer.pricing.base_price_per_person}/person
              </div>
            </div>

            {/* Cuisine types */}
            <div className="flex flex-wrap gap-1">
              {caterer.cuisine_types.slice(0, 3).map(cuisine => (
                <Badge key={cuisine} variant="outline" className="text-xs">
                  {cuisine}
                </Badge>
              ))}
              {caterer.cuisine_types.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{caterer.cuisine_types.length - 3} more
                </Badge>
              )}
            </div>

            {/* CTA */}
            <div className="pt-2">
              <Button className="w-full bg-[#2B2B2B] hover:bg-gray-800 text-white">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const FilterSection: React.FC = () => (
    <div className="space-y-6">
      {/* Clear filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{activeFiltersCount} active filters</span>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      )}

      {/* Location */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Location</Label>
        <Input
          placeholder="City or zip code"
          value={filters.location}
          onChange={(e) => updateFilter('location', (e.target as HTMLInputElement).value)}
        />
      </div>

      {/* Event details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">Event Date</Label>
          <Input
            type="date"
            value={filters.event_date}
            onChange={(e) => updateFilter('event_date', (e.target as HTMLInputElement).value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <Label className="text-sm font-medium mb-2 block">Event Type</Label>
          <Select value={filters.event_type} onValueChange={(value) => updateFilter('event_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Guest count */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Guest Count: {filters.guest_count_min}-{filters.guest_count_max === 500 ? '500+' : filters.guest_count_max}
        </Label>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-gray-500">Minimum</Label>
            <Slider
              value={[filters.guest_count_min]}
              onValueChange={(value) => updateFilter('guest_count_min', value[0])}
              max={500}
              step={10}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Maximum</Label>
            <Slider
              value={[filters.guest_count_max]}
              onValueChange={(value) => updateFilter('guest_count_max', value[0])}
              max={500}
              step={10}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Cuisine types */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Cuisine Types</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {CUISINE_TYPES.slice(0, 12).map(cuisine => (
            <div key={cuisine} className="flex items-center space-x-2">
              <Checkbox
                id={`cuisine-${cuisine}`}
                checked={filters.cuisine_types.includes(cuisine)}
                onCheckedChange={(checked) =>
                  handleFilterChange('cuisine_types', cuisine, checked as boolean)
                }
              />
              <Label htmlFor={`cuisine-${cuisine}`} className="text-sm">
                {cuisine}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Service types */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Service Types</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {SERVICE_TYPES.slice(0, 10).map(service => (
            <div key={service} className="flex items-center space-x-2">
              <Checkbox
                id={`service-${service}`}
                checked={filters.service_types.includes(service)}
                onCheckedChange={(checked) =>
                  handleFilterChange('service_types', service, checked as boolean)
                }
              />
              <Label htmlFor={`service-${service}`} className="text-sm">
                {service}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Price Range</Label>
        <div className="space-y-2">
          {['$', '$$', '$$$', '$$$$'].map(range => (
            <div key={range} className="flex items-center space-x-2">
              <Checkbox
                id={`price-${range}`}
                checked={filters.price_range.includes(range)}
                onCheckedChange={(checked) =>
                  handleFilterChange('price_range', range, checked as boolean)
                }
              />
              <Label htmlFor={`price-${range}`} className="text-sm">
                {range}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Minimum Rating: {filters.rating_min > 0 ? `${filters.rating_min}+ stars` : 'Any'}
        </Label>
        <Slider
          value={[filters.rating_min]}
          onValueChange={(value) => updateFilter('rating_min', value[0])}
          max={5}
          step={0.5}
          className="mt-1"
        />
      </div>

      {/* Special filters */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="featured-only"
            checked={filters.featured_only}
            onCheckedChange={(checked) => updateFilter('featured_only', checked)}
          />
          <Label htmlFor="featured-only" className="text-sm">
            Featured caterers only
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="verified-only"
            checked={filters.verified_only}
            onCheckedChange={(checked) => updateFilter('verified_only', checked)}
          />
          <Label htmlFor="verified-only" className="text-sm">
            Verified caterers only
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="instant-booking"
            checked={filters.instant_booking}
            onCheckedChange={(checked) => updateFilter('instant_booking', checked)}
          />
          <Label htmlFor="instant-booking" className="text-sm">
            Instant booking available
          </Label>
        </div>
      </div>
    </div>
  );

  if (state.isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2B2B2B] mb-4">Find Amazing Caterers</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover professional caterers for your next event. From intimate gatherings to large
            celebrations, find the perfect catering service that matches your style and budget.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#2B2B2B]" />
              <span>{state.totalCount} caterers available</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#2B2B2B]" />
              <span>Verified professionals</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#2B2B2B]" />
              <span>Instant booking</span>
            </div>
          </div>
        </div>

        {/* Search and controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search caterers, cuisines, or specialties..."
                value={filters.query}
                onChange={(e) => updateFilter('query', (e.target as HTMLInputElement).value)}
                className="pl-10"
              />
            </div>
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 bg-[#2B2B2B] text-white">{activeFiltersCount}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSection />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/caterers/list-your-business">
              <Button className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                List Your Business
              </Button>
            </Link>
            <Select value={filters.sort_by} onValueChange={(value: any) => updateFilter('sort_by', value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most Relevant</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border border-gray-200 rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-[#2B2B2B] text-white' : ''}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#2B2B2B] text-white' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Featured section */}
        {!filters.query && !filters.location && activeFiltersCount === 0 && state.featuredCaterers.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2B2B2B]">Featured Caterers</h2>
              <Badge className="bg-[#2B2B2B] text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                Handpicked
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.featuredCaterers.slice(0, 3).map(caterer => (
                <CatererCard key={caterer.id} caterer={caterer} variant="featured" />
              ))}
            </div>
            <Separator className="mt-12" />
          </div>
        )}

        {/* Browse sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-gray-100">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
              >
                All ({state.filteredCaterers.length})
              </TabsTrigger>
              <TabsTrigger
                value="featured"
                className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Featured ({state.filteredCaterers.filter(c => c.featured).length})
              </TabsTrigger>
              <TabsTrigger
                value="verified"
                className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
              >
                <Star className="h-4 w-4 mr-1" />
                Verified ({state.filteredCaterers.filter(c => c.verified).length})
              </TabsTrigger>
              <TabsTrigger
                value="instant"
                className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
              >
                <Clock className="h-4 w-4 mr-1" />
                Instant ({state.filteredCaterers.filter(c => c.availability.instant_booking_enabled).length})
              </TabsTrigger>
            </TabsList>
            <Badge className="bg-gray-100 text-gray-800">
              {tabCaterers.length} results
            </Badge>
          </div>

          <TabsContent value={activeTab} className="space-y-6">
            {tabCaterers.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              }`}>
                {tabCaterers.map(caterer => (
                  <CatererCard key={caterer.id} caterer={caterer} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ChefHat className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">No caterers found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or filters to see more results.
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-[#2B2B2B] text-[#2B2B2B] hover:bg-[#2B2B2B] hover:text-white"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#2B2B2B] mb-2">{state.totalCount}</div>
              <div className="text-gray-600">Total Caterers</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#2B2B2B] mb-2">
                {state.caterers.filter(c => c.verified).length}
              </div>
              <div className="text-gray-600">Verified Professionals</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#2B2B2B] mb-2">4.8</div>
              <div className="text-gray-600">Average Rating</div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#2B2B2B] mb-2">
                {state.caterers.filter(c => c.availability.instant_booking_enabled).length}
              </div>
              <div className="text-gray-600">Instant Booking</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default CatererDiscovery;