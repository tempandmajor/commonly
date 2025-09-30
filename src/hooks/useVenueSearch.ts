import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VenueSearchFilters {
  searchQuery: string;
  venueType: string;
  capacity: string;
  priceRange: string;
  location: string;
  amenities: string[];
  sortBy: 'rating' | 'price_low' | 'price_high' | 'capacity' | 'newest' | 'popular';
  currentPage: number;
  availableDate?: string | undefined;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  capacity: number;
  location: {
    address: string;
    city: string;
    state: string;
  };
  amenities: string[];
  status: string;
  metadata?: {
    venueType?: string;
    pricePerHour?: number;
    contactEmail?: string;
    contactPhone?: string;
  };
  created_at: string;
}

export const useVenueSearch = () => {
  const [filters, setFilters] = useState<VenueSearchFilters>({
    searchQuery: '',
    venueType: 'all',
    capacity: 'all',
    priceRange: 'all',
    location: '',
    amenities: [],
    sortBy: 'rating',
    currentPage: 1,
  });

  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  const searchVenues = useCallback(async (resetPage = false) => {
    try {
      setIsLoading(true);

      const page = resetPage ? 1 : filters.currentPage;
      const pageSize = 12;
      const offset = (page - 1) * pageSize;

      let query = supabase
        .from('venues')
        .select(`
          *,
          location:locations(*)
        `, { count: 'exact' })
        .eq('status', 'active')
        .range(offset, offset + pageSize - 1);

      // Apply search filter
      if (debouncedSearchQuery) {
        query = query.or(`name.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`);
      }

      // Apply capacity filter
      if (filters.capacity !== 'all') {
        const capacityRanges = {
          small: [0, 50],
          medium: [51, 150],
          large: [151, 500],
          xlarge: [501, 999999],
        };

        const range = capacityRanges[filters.capacity as keyof typeof capacityRanges];
        if (range) {
          query = query.gte('capacity', range[0]).lte('capacity', range[1]);
        }
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'capacity':
          query = query.order('capacity', { ascending: false });
          break;
        case 'rating':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const transformedVenues = (data || []).map(venue => ({
          ...venue,
        location: venue.location || { address: 'Address not available', city: 'Unknown', state: 'Unknown' }
      }));

      if (resetPage || page === 1) {
        setVenues(transformedVenues);
      } else {
        setVenues(prev => [...prev, ...transformedVenues]);
      }

      setTotalCount(count || 0);
      setHasMore((data?.length || 0) === pageSize);

      if (resetPage) {
        setFilters(prev => ({ ...prev, currentPage: 1 }));
      }

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search venues');
    } finally {
      setIsLoading(false);
    }
  }, [filters, debouncedSearchQuery]);

  const updateSearch = useCallback((query: string) => {
    setFilters(prev => ({
          ...prev,
      searchQuery: query,
      currentPage: 1,
    }));
  }, []);

  const updateVenueType = useCallback((venueType: string) => {
    setFilters(prev => ({
          ...prev,
      venueType,
      currentPage: 1,
    }));
  }, []);

  const updateCapacity = useCallback((capacity: string) => {
    setFilters(prev => ({
          ...prev,
      capacity,
      currentPage: 1,
    }));
  }, []);

  const updatePriceRange = useCallback((priceRange: string) => {
    setFilters(prev => ({
          ...prev,
      priceRange,
      currentPage: 1,
    }));
  }, []);

  const updateSort = useCallback((sortBy: VenueSearchFilters['sortBy']) => {
    setFilters(prev => ({
          ...prev,
      sortBy,
      currentPage: 1,
    }));
  }, []);

  const updateAmenities = useCallback((amenities: string[]) => {
    setFilters(prev => ({
          ...prev,
      amenities,
      currentPage: 1,
    }));
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setFilters(prev => ({
          ...prev,
        currentPage: prev.currentPage + 1,
      }));
    }
  }, [hasMore, isLoading]);

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      venueType: 'all',
      capacity: 'all',
      priceRange: 'all',
      location: '',
      amenities: [],
      sortBy: 'rating',
      currentPage: 1,
    });
    setVenues([]);
    setTotalCount(0);
    setHasMore(false);
  }, []);

  // Trigger search when filters change
  useMemo(() => {
    searchVenues(true);
  }, [debouncedSearchQuery, filters.venueType, filters.capacity, filters.priceRange, filters.sortBy, filters.amenities]);

  // Load more when page changes
  useMemo(() => {
    if (filters.currentPage > 1) {
      searchVenues(false);
    }
  }, [filters.currentPage]);

  return {
    filters,
    venues,
    isLoading,
    totalCount,
    hasMore,
    updateSearch,
    updateVenueType,
    updateCapacity,
    updatePriceRange,
    updateSort,
    updateAmenities,
    loadMore,
    resetFilters,
    searchVenues,
  };
};