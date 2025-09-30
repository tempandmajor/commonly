import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/providers/AuthProvider';
import { LoadingSpinner } from '@/components/ui/loading';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  AlertCircle,
  Search,
  MapPin,
  Calendar,
  Users,
  Plus,
  Clock,
  Grid,
  List,
  Filter,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { safeToast } from '@/services/api/utils/safeToast';
import { searchEvents, getTrendingEvents, getFeaturedEvents } from '@/services/search/entity/event';
import { SearchFilters, SearchOptions } from '@/services/search/types';

interface Event {
  id: string;
  title: string;
  description: string | null;
  creator_id: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  status: string | null;
  venue_id: string | null;
  is_public: boolean | null;
  image_url: string | null;
  max_capacity: number | null;
  price: number | null;
  is_free: boolean | null;
  category?: string | undefined| null;
  created_at: string;
  updated_at: string;
  attendee_count?: number | undefined;
  creator_name?: string | undefined;
}

const FETCH_THROTTLE = 1000; // Reduced from 2000ms to 1000ms
const MAX_RETRY_ATTEMPTS = 2; // Reduced from 3 to 2
const LOADING_TIMEOUT = 10000; // Reduced from 15000ms to 10000ms

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { locationInfo, getLocation, setManualLocation } = useGeolocation();
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // State management
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [events, setEvents] = useState<Event[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [priceFilter, setPriceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCategories, setShowCategories] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Refs for better loading control
  const mounted = useRef(true);
  const isLoading = useRef(false);
  const lastFetch = useRef<number>(0);
  const retryCount = useRef<number>(0);
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null);

  const pageSize = 12;

  // Enhanced search filters
  const searchFilters = useMemo((): SearchFilters => {
    const filters: SearchFilters = {};

    if (categoryFilter !== 'all') {
      filters.category = categoryFilter;
    }

    // Priority order for location filtering:
    // 1. Use coordinates if available for precise distance-based filtering
    // 2. Fall back to city name for general area filtering
    if (locationInfo?.coordinates?.latitude && locationInfo?.coordinates?.longitude) {
      filters.coordinates = {
        latitude: locationInfo.coordinates.latitude,
        longitude: locationInfo.coordinates.longitude,
        radius: 25, // 25km radius for nearby events
      };
    } else if (locationInfo?.city) {
      filters.location = locationInfo.city;
    }

    if (priceFilter !== 'all') {
      switch (priceFilter) {
        case 'free':
          filters.priceRange = { min: 0, max: 0 };
          break;
        case 'low':
          filters.priceRange = { min: 0, max: 25 };
          break;
        case 'medium':
          filters.priceRange = { min: 25, max: 100 };
          break;
        case 'high':
          filters.priceRange = { min: 100, max: 999999 }; // Set a high max value
          break;
      }
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      switch (dateFilter) {
        case 'today':
          filters.dateRange = {
            start: now,
            end: tomorrow,
          };
          break;
        case 'this_week':
          filters.dateRange = {
            start: now,
            end: nextWeek,
          };
          break;
        case 'upcoming':
          filters.dateRange = {
            start: now,
            end: nextMonth,
          };
          break;
      }
    }

    return filters;
  }, [categoryFilter, locationInfo?.city, locationInfo?.coordinates, priceFilter, dateFilter]);

  // Enhanced search options
  const searchOptions = useMemo((): SearchOptions => {
    const options: SearchOptions = {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    };

    switch (sortBy) {
      case 'oldest':
        options.sortBy = 'created_at';
        options.sortOrder = 'asc';
        break;
      case 'price_low':
        options.sortBy = 'price';
        options.sortOrder = 'asc';
        break;
      case 'price_high':
        options.sortBy = 'price';
        options.sortOrder = 'desc';
        break;
      case 'popular':
        options.sortBy = 'attendee_count';
        options.sortOrder = 'desc';
        break;
      case 'date':
        options.sortBy = 'start_date';
        options.sortOrder = 'asc';
        break;
      default:
        options.sortBy = 'created_at';
        options.sortOrder = 'desc';
    }

    return options;
  }, [sortBy, currentPage, pageSize]);

  // Enhanced fetch function with advanced search
  const fetchEvents = useCallback(
    async (forceRefresh = false) => {
      // Prevent multiple simultaneous calls
      if (isLoading.current && !forceRefresh) {
        return;
      }

      // Throttle API calls
      const now = Date.now();
      if (!forceRefresh && now - lastFetch.current < FETCH_THROTTLE) {
        return;
      }

      // Check retry limit
      if (retryCount.current >= MAX_RETRY_ATTEMPTS && !forceRefresh) {
        setError('Unable to load events after multiple attempts. Please refresh the page.');
        setLoading(false);
        return;
      }

      try {
        isLoading.current = true;
        lastFetch.current = now;

        if (!forceRefresh) {
          retryCount.current += 1;
        } else {
          retryCount.current = 0;
        }

        if (mounted.current) {
          setLoading(true);
          setError(null);
        }

        // Set loading timeout
        if (loadingTimeout.current) {
          clearTimeout(loadingTimeout.current);
        }

        loadingTimeout.current = setTimeout(() => {
          if (mounted.current && isLoading.current) {
            setLoading(false);
            setError('Request timed out. Please try again.');
            isLoading.current = false;
          }
        }, LOADING_TIMEOUT);

        // Use advanced search service
        const searchResult = await searchEvents(searchTerm, searchFilters, searchOptions);

        if (mounted.current) {
          // Transform the search result events to match our local Event interface
          const transformedEvents: Event[] = searchResult.items.map(event => ({
            id: event.id,
            title: event.title,
            description: event.description,
            creator_id: event.creator_id,
            start_date: event.date,
            end_date: null,
            location: event.location,
            status: event.status,
            venue_id: null,
            is_public: true,
            image_url: event.image_url || null,
            max_capacity: event.max_attendees || null,
            price: event.price,
            is_free: event.price === 0,
            category: event.category,
            created_at: event.created_at,
            updated_at: event.updated_at,
            attendee_count: event.attendee_count,
            creator_name: event.creator_name,
          }));

          setEvents(transformedEvents);
          setTotalResults(searchResult.total);
          setHasMore(searchResult.hasMore);
          setError(null);
          retryCount.current = 0; // Reset on success
        }
      } catch (err) {
        if (mounted.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load events';
          setError(errorMessage);

          // Show toast only on first attempt
          if (retryCount.current === 1) {
            safeToast.error('Failed to load events');
          }
        }
      } finally {
        if (loadingTimeout.current) {
          clearTimeout(loadingTimeout.current);
          loadingTimeout.current = null;
        }

        if (mounted.current) {
          setLoading(false);
        }
        isLoading.current = false;
      }
    },
    [searchTerm, searchFilters, searchOptions]
  );

  // Fetch trending and featured events
  const fetchTrendingAndFeatured = useCallback(async () => {
    try {
      const [trending, featured] = await Promise.all([getTrendingEvents(6), getFeaturedEvents(6)]);

      if (mounted.current) {
        // Transform trending events
        const transformedTrending: Event[] = trending.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          creator_id: event.creator_id,
          start_date: event.date,
          end_date: null,
          location: event.location,
          status: event.status,
          venue_id: null,
          is_public: true,
          image_url: event.image_url || null,
          max_capacity: event.max_attendees || null,
          price: event.price,
          is_free: event.price === 0,
          category: event.category,
          created_at: event.created_at,
          updated_at: event.updated_at,
          attendee_count: event.attendee_count,
          creator_name: event.creator_name,
        }));

        // Transform featured events
        const transformedFeatured: Event[] = featured.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          creator_id: event.creator_id,
          start_date: event.date,
          end_date: null,
          location: event.location,
          status: event.status,
          venue_id: null,
          is_public: true,
          image_url: event.image_url || null,
          max_capacity: event.max_attendees || null,
          price: event.price,
          is_free: event.price === 0,
          category: event.category,
          created_at: event.created_at,
          updated_at: event.updated_at,
          attendee_count: event.attendee_count,
          creator_name: event.creator_name,
        }));

        setTrendingEvents(transformedTrending);
        setFeaturedEvents(transformedFeatured);
      }
    } catch (error) {
      console.error('Error fetching trending/featured events:', error);
    }
  }, []);

  // Initialize component
  useEffect(() => {
    mounted.current = true;
    retryCount.current = 0;

    // Initial fetch with delay to prevent immediate loading issues
    const timer = setTimeout(() => {
      if (mounted.current) {
        fetchEvents(true);
        fetchTrendingAndFeatured();
      }
    }, 500);

    return () => {
      mounted.current = false;
      isLoading.current = false;
      retryCount.current = 0;

      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
      clearTimeout(timer);
    };
  }, []); // Remove fetchEvents from dependency array

  // Refetch when search criteria change
  useEffect(() => {
    if (mounted.current && !isLoading.current) {
      setCurrentPage(1); // Reset to first page
      fetchEvents(true);
    }
  }, [searchTerm, searchFilters, searchOptions.sortBy, searchOptions.sortOrder]);

  // Update URL when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if the current search param is already what we want
      const currentSearchParam = searchParams.get('search');
      if (currentSearchParam === searchTerm) {
        return; // Don't update if already the same
      }

      const newParams = new URLSearchParams(searchParams);
      if (searchTerm) {
        newParams.set('search', searchTerm);
      } else {
        newParams.delete('search');
      }
      setSearchParams(newParams);
    }, 500); // Debounce URL updates

    return () => clearTimeout(timer);
  }, [searchTerm, searchParams, setSearchParams]);

  // Load search term from URL on mount
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl && searchFromUrl !== searchTerm) {
      setSearchTerm(searchFromUrl);
    }
  }, [searchParams]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handlePriceFilterChange = (value: string) => {
    setPriceFilter(value);
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleLocationSelect = (location: string) => {
    setManualLocation(location);
  };

  const handleRefreshLocation = async () => {
    await getLocation();
  };

  const handleRetry = () => {
    retryCount.current = 0;
    setError(null);
    fetchEvents(true);
  };

  const handleCreateEventClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!user) {
      safeToast.error('Please log in to create an event');
      navigate('/login');
      return;
    }

    navigate('/create-event');
  };

  const formatEventDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'TBD';
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) as string;
    } catch (error) {
      return 'TBD';
    }
  };

  const renderEventCard = (event: Event) => (
    <Card
      key={event.id}
      className='border-gray-200 hover:shadow-md transition-shadow cursor-pointer group'
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div className='aspect-video bg-gray-100 rounded-t-lg overflow-hidden'>
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center'>
            <Calendar className='h-12 w-12 text-gray-400' />
          </div>
        )}
      </div>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between mb-2'>
          <h3 className='font-semibold text-lg text-gray-900 line-clamp-1 flex-1'>{event.title}</h3>
          {event.is_free ? (
            <Badge variant='secondary' className='bg-green-100 text-green-800 ml-2'>
              Free
            </Badge>
          ) : (
            <Badge variant='secondary' className='bg-blue-100 text-blue-800 ml-2'>
              ${event.price}
            </Badge>
          )}
        </div>

        {event.description && (
          <p className='text-sm text-gray-600 mb-3 line-clamp-2'>{event.description}</p>
        )}

        <div className='space-y-2 text-xs text-gray-500'>
          {event.location && (
            <div className='flex items-center gap-1'>
              <MapPin className='h-3 w-3' />
              <span className='truncate'>{event.location}</span>
            </div>
          )}

          <div className='flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            <span>{formatEventDate(event.start_date)}</span>
          </div>

          {event.attendee_count !== undefined && event.max_capacity && (
            <div className='flex items-center gap-1'>
              <Users className='h-3 w-3' />
              <span>
                {event.attendee_count}/{event.max_capacity} attendees
              </span>
            </div>
          )}

          {event.creator_name && (
            <div className='flex items-center gap-1'>
              <span>by {event.creator_name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderTrendingSection = () => {
    if (trendingEvents.length === 0) return null;

    return (
      <div className='mb-8'>
        <h2 className='text-2xl font-bold mb-4 text-gray-900'>Trending Events</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {trendingEvents.map(event => renderEventCard(event))}
        </div>
      </div>
    );
  };

  const renderFeaturedSection = () => {
    if (featuredEvents.length === 0) return null;

    return (
      <div className='mb-8'>
        <h2 className='text-2xl font-bold mb-4 text-gray-900'>Featured Events</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {featuredEvents.map(event => renderEventCard(event))}
        </div>
      </div>
    );
  };

  const renderFilters = () => (
    <div className='bg-white border border-gray-200 rounded-lg p-4 mb-6'>
      <div className='flex flex-wrap items-center gap-4'>
        {/* Search Input - REMOVED - moved to header */}

        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className='w-[140px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>Newest</SelectItem>
            <SelectItem value='oldest'>Oldest</SelectItem>
            <SelectItem value='price_low'>Price: Low to High</SelectItem>
            <SelectItem value='price_high'>Price: High to Low</SelectItem>
            <SelectItem value='popular'>Most Popular</SelectItem>
            <SelectItem value='date'>Date</SelectItem>
          </SelectContent>
        </Select>

        {/* Price Filter */}
        <Select value={priceFilter} onValueChange={handlePriceFilterChange}>
          <SelectTrigger className='w-[120px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Prices</SelectItem>
            <SelectItem value='free'>Free</SelectItem>
            <SelectItem value='low'>Under $25</SelectItem>
            <SelectItem value='medium'>$25 - $100</SelectItem>
            <SelectItem value='high'>Over $100</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Select value={dateFilter} onValueChange={handleDateFilterChange}>
          <SelectTrigger className='w-[120px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Dates</SelectItem>
            <SelectItem value='today'>Today</SelectItem>
            <SelectItem value='this_week'>This Week</SelectItem>
            <SelectItem value='upcoming'>Upcoming</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
          <SelectTrigger className='w-[140px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Categories</SelectItem>
            <SelectItem value='music'>Music</SelectItem>
            <SelectItem value='technology'>Technology</SelectItem>
            <SelectItem value='business'>Business</SelectItem>
            <SelectItem value='education'>Education</SelectItem>
            <SelectItem value='entertainment'>Entertainment</SelectItem>
            <SelectItem value='sports'>Sports</SelectItem>
            <SelectItem value='food'>Food & Drink</SelectItem>
            <SelectItem value='health'>Health & Wellness</SelectItem>
            <SelectItem value='other'>Other</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className='flex border border-gray-200 rounded-md'>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => handleViewModeChange('grid')}
            className='rounded-r-none'
          >
            <Grid className='h-4 w-4' />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => handleViewModeChange('list')}
            className='rounded-l-none'
          >
            <List className='h-4 w-4' />
          </Button>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className='flex items-center gap-2'
        >
          <SlidersHorizontal className='h-4 w-4' />
          Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className='mt-4 pt-4 border-t border-gray-200'>
          <div className='flex flex-wrap items-center gap-4'>
            {/* Location */}
            <div className='flex items-center gap-2'>
              <MapPin className='h-4 w-4 text-gray-400' />
              <span className='text-sm text-gray-600'>Location:</span>
              <Input
                placeholder='Enter location...'
                value={locationInfo?.city || ''}
                onChange={e => handleLocationSelect((e.target as HTMLInputElement).value)}
                className='w-48'
              />
              <Button variant='ghost' size='sm' onClick={handleRefreshLocation} className='p-1'>
                <RefreshCw className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading && events.length === 0) {
    return (
      <AppLayout>
        <div className='flex min-h-screen flex-col bg-gray-50 text-gray-900'>
          <main className='flex-1 container mx-auto px-4 py-8'>
            <div className='flex justify-center items-center h-64'>
              <div className='text-center'>
                <LoadingSpinner className='mx-auto mb-4' />
                <p className='text-gray-600'>Loading events...</p>
              </div>
            </div>
          </main>
        </div>
      </AppLayout>
    );
  }

  if (error && events.length === 0) {
    return (
      <AppLayout>
        <div className='flex min-h-screen flex-col bg-gray-50 text-gray-900'>
          <main className='flex-1 container mx-auto px-4 py-8'>
            <Alert className='max-w-md mx-auto border-red-200 bg-red-50'>
              <AlertCircle className='h-4 w-4 text-red-600' />
              <AlertDescription className='text-red-800'>
                {error}
                <Button
                  variant='link'
                  className='p-0 h-auto ml-2 text-red-600 hover:text-red-800'
                  onClick={handleRetry}
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className='flex min-h-screen flex-col bg-gray-50 text-gray-900'>
        <main className='flex-1 container mx-auto px-4 py-8'>
          {/* Header */}
          <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-8'>
            <div className='flex-1'>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>Explore Events</h1>
              <p className='text-gray-600 mb-4'>
                {totalResults > 0 ? `${totalResults} events found` : 'No events found'}
                {locationInfo?.city && ` near ${locationInfo.city}`}
              </p>

              {/* Search Bar */}
              <div className='relative max-w-md'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search events...'
                  value={searchTerm}
                  onChange={e => handleSearch((e.target as HTMLInputElement).value)}
                  className='pl-10'
                />
              </div>
            </div>

            <Button
              onClick={handleCreateEventClick}
              className='mt-4 md:mt-0 bg-black text-white hover:bg-gray-800'
            >
              <Plus className='h-4 w-4 mr-2' />
              Create Event
            </Button>
          </div>

          {/* Filters */}
          {renderFilters()}

          {/* Trending Section */}
          {!searchTerm && events.length > 0 && renderTrendingSection()}

          {/* Featured Section */}
          {!searchTerm && events.length > 0 && renderFeaturedSection()}

          {/* Main Events Grid */}
          <div className='mb-8'>
            {searchTerm && (
              <h2 className='text-2xl font-bold mb-4 text-gray-900'>
                Search Results for "{searchTerm}"
              </h2>
            )}

            {events.length > 0 ? (
              <div
                className={cn(
                  'gap-6',
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-4'
                )}
              >
                {events.map(event => renderEventCard(event))}
              </div>
            ) : (
              <Card className='border-gray-200'>
                <CardContent className='text-center py-12'>
                  <Search className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                  <h3 className='text-lg font-semibold mb-2 text-gray-900'>
                    {searchTerm ? 'No events found' : 'No events available'}
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    {searchTerm
                      ? `No events match your search for "${searchTerm}". Try adjusting your filters.`
                      : 'Check back later for new events in your area.'}
                  </p>
                  {searchTerm && (
                    <Button variant='outline' onClick={() => setSearchTerm('')}>
                      Clear Search
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className='text-center'>
              <Button
                variant='outline'
                onClick={handleLoadMore}
                disabled={loading}
                className='px-8'
              >
                {loading ? (
                  <>
                    <LoadingSpinner className='h-4 w-4 mr-2' />
                    Loading...
                  </>
                ) : (
                  'Load More Events'
                )}
              </Button>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
};

export default Explore;
