import { supabase } from '@/integrations/supabase/client';
import { SearchFilters, SearchResult, SearchOptions } from '../types';
import { searchCache } from '../cache';

export interface VenueSearchResult {
  id: string;
  name: string;
  description: string;
  address: string;
  capacity: number;
  amenities: string[];
  images: string[];
  rating: number;
  availability: boolean;
  location: {
    city: string;
    state: string;
    country: string;
  };
  owner_id: string;
  status: string;
  featured: boolean;
  metadata: Record<string, any>;
}

export const searchVenues = async (
  query: string,
  filters?: SearchFilters,
  options?: SearchOptions
): Promise<SearchResult<VenueSearchResult>> => {
  const cacheKey = `venues:${query}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;

  // Check cache first
  const cached = searchCache.get<SearchResult<VenueSearchResult>>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Build the query
    let dbQuery = supabase.from('venues').select(`
        id,
        name,
        description,
        capacity,
        amenities,
        owner_id,
        status,
        featured,
        metadata,
        locations (
          address,
          city,
          state,
          country
        )
      `);

    // Add search filter
    if (query.trim()) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Add status filter (only show active venues by default)
    dbQuery = dbQuery.eq('status', 'active');

    // Add capacity filter if specified
    if (filters?.capacity) {
      dbQuery = dbQuery.gte('capacity', filters.capacity);
    }

    // Add location filter if specified
    if (filters?.location) {
      dbQuery = dbQuery.or(
        `locations.city.ilike.%${filters.location}%,locations.state.ilike.%${filters.location}%`
      );
    }

    // Add featured filter if specified
    if (filters?.featured !== undefined) {
      dbQuery = dbQuery.eq('featured', filters.featured);
    }

    // Add sorting
    const sortBy = options?.sortBy || 'name';
    const sortOrder = options?.sortOrder || 'asc';
    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Add pagination
    const limit = options?.limit || 20;
    const offset = (options?.page || 0) * limit;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error('Error searching venues:', error);
      throw error;
    }

    // Transform data to match interface
    const venues: VenueSearchResult[] = (data || []).map(venue => ({
      id: venue.id,
      name: venue.name || 'Unnamed Venue',
      description: venue.description || '',
      address: venue.locations?.address || '',
      capacity: venue.capacity || 0,
      amenities: Array.isArray(venue.amenities) ? venue.amenities : [],
      images: [], // Images would come from a separate images table or metadata
      rating: 0, // Rating would be calculated from reviews
      availability: venue.status === 'active',
      location: {
        city: venue.locations?.city || '',
        state: venue.locations?.state || '',
        country: venue.locations?.country || '',
      },
      owner_id: venue.owner_id || '',
      status: venue.status || 'pending',
      featured: venue.featured || false,
      metadata: venue.metadata || {},
    }));

    const result: SearchResult<VenueSearchResult> = {
      data: venues,
      total: count || 0,
      page: options?.page || 0,
      limit: limit,
      hasMore: (count || 0) > offset + limit,
    };

    // Cache the result
    searchCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error in venue search:', error);
    return {
      data: [],
      total: 0,
      page: 0,
      limit: 20,
      hasMore: false,
    };
  }
};
