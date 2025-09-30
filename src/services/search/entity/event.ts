/**
 * Event Search Service - PRODUCTION IMPLEMENTATION
 *
 * Real database-powered event search and discovery functionality.
 */

import { supabase } from '@/integrations/supabase/client';
import { SearchFilters, SearchResult, SearchOptions } from '../types';
import { searchCache } from '../cache';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  price: number;
  date: string;
  image_url?: string | undefined;
  creator_id: string;
  creator_name?: string | undefined;
  attendee_count?: number | undefined;
  max_attendees?: number | undefined;
  status: 'draft' | 'published' | 'cancelled' | 'ended';
  tags?: string[] | undefined;
  created_at: string;
  updated_at: string;
}

/**
 * Search events with real database queries
 */
export const searchEvents = async (
  query: string,
  filters?: SearchFilters,
  options?: SearchOptions
): Promise<SearchResult<Event>> => {
  const cacheKey = `events:${query}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;

  // Check cache first (only for 2 minutes to keep data fresh)
  const cached = searchCache.get<SearchResult<Event>>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Use coordinate-based search if coordinates are provided
    if (filters?.coordinates) {
      const { latitude, longitude, radius } = filters.coordinates;

      // Use the existing database function for geolocation-based search
      const { data: nearbyEvents, error: geoError } = await supabase.rpc(
        'get_events_near_location',
        {
          lat: latitude,
          lng: longitude,
          radius_km: radius,
        }
      );

      if (geoError) throw geoError;

      let events = nearbyEvents || [];

      // Apply additional filters to the geolocation results
      if (query && query.trim()) {
        events = events.filter(
          (event: any) =>
            event.title?.toLowerCase().includes(query!.toLowerCase()) ||
            event.description?.toLowerCase().includes(query!.toLowerCase()) ||
            event.category?.toLowerCase().includes(query!.toLowerCase())
        );
      }

      if (filters.category) {
        events = events.filter((event: any) => event.category === filters.category);
      }

      if (filters.priceRange) {
        events = events.filter((event: any) => {
          const price = event.price || 0;
          return (
            price >= (filters.priceRange?.min || 0) && price <= (filters.priceRange?.max || 999999)
          );
        });
      }

      if (filters.dateRange) {
        events = events.filter((event: any) => {
          const eventDate = new Date(event.start_date);
          return (
            (!filters.dateRange?.start || eventDate >= filters.dateRange.start) &&
            (!filters.dateRange?.end || eventDate <= filters.dateRange.end)
          );
        });
      }

      // Apply pagination
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;
      const paginatedEvents = events.slice(offset, offset + limit);

      // Transform to our Event interface
      const transformedEvents: Event[] = paginatedEvents.map((event: any) => ({
        id: event.id,
        title: event.title || '',
        description: event.description || '',
        category: event.category || '',
        location: event.location || '',
        price: event.price || 0,
        date: event.start_date || new Date().toISOString(),
        image_url: event.image_url || null,
        creator_id: event.creator_id || '',
        attendee_count: event.attendees_count || 0,
        max_attendees: event.max_capacity || null,
        status: event.status || 'published',
        tags: event.tags || [],
        created_at: event.created_at || new Date().toISOString(),
        updated_at: event.updated_at || new Date().toISOString(),
        creator_name: 'Event Creator', // We'd need to join with users table for actual name
      }));

      const result = {
        items: transformedEvents,
        total: events.length,
        hasMore: events.length > offset + limit,
      };

      // Cache the result
      searchCache.set(cacheKey, result, 120); // 2 minutes
      return result;
    }

    // Fallback to regular text-based search
    // Build the query
    let dbQuery = supabase
      .from('events')
      .select(
        `
        id,
        title,
        description,
        category,
        location,
        price,
        start_date,
        image_url,
        creator_id,
        attendees_count,
        max_capacity,
        status,
        tags,
        created_at,
        updated_at
      `
      )
      .eq('is_public', true)
      .in('status', ['active', 'published']); // Show active or published events

    // Apply text search if query provided
    if (query && query.trim()) {
      dbQuery = dbQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,location.ilike.%${query}%`
      );
    }

    // Apply filters
    if (filters?.category) {
      dbQuery = dbQuery.eq('category', filters.category);
    }

    if (filters?.location) {
      dbQuery = dbQuery.ilike('location', `%${filters.location}%`);
    }

    if (filters?.priceRange) {
      if (filters.priceRange.min !== undefined) {
        dbQuery = dbQuery.gte('price', filters.priceRange.min);
      }
      if (filters.priceRange.max !== undefined) {
        dbQuery = dbQuery.lte('price', filters.priceRange.max);
      }
    }

    if (filters?.dateRange) {
      if (filters.dateRange.start) {
        dbQuery = dbQuery.gte('start_date', filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        dbQuery = dbQuery.lte('start_date', filters.dateRange.end);
      }
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';

    // Map sortBy options to actual database columns
    const columnMapping: { [key: string]: string } = {
      newest: 'created_at',
      date: 'start_date',
      price: 'price',
      title: 'title',
    };

    const dbColumn = columnMapping[sortBy] || sortBy;
    dbQuery = dbQuery.order(dbColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    if (limit) {
      dbQuery = dbQuery.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    // Transform the results
    const transformedEvents: Event[] = (data || []).map((event: any) => ({
      id: event.id,
      title: event.title || '',
      description: event.description || '',
      category: event.category || '',
      location: event.location || '',
      price: event.price || 0,
      date: event.start_date || new Date().toISOString(),
      image_url: event.image_url || null,
      creator_id: event.creator_id || '',
      attendee_count: event.attendees_count || 0,
      max_attendees: event.max_capacity || null,
      status: event.status || 'active',
      tags: event.tags || [],
      created_at: event.created_at || new Date().toISOString(),
      updated_at: event.updated_at || new Date().toISOString(),
      creator_name: 'Event Creator', // Would need separate query for creator name
    }));

    const result = {
      items: transformedEvents,
      total: count || transformedEvents.length,
      hasMore: (count || 0) > offset + limit,
    };

    // Cache the result
    searchCache.set(cacheKey, result, 120); // 2 minutes
    return result;
  } catch (error) {
    console.error('Event search error:', error);
    // Return empty result on error
    return {
      items: [],
      total: 0,
      hasMore: false,
    };
  }
};

/**
 * Get trending events (most popular recently)
 */
export const getTrendingEvents = async (limit: number = 10): Promise<Event[]> => {
  const cacheKey = `trending_events:${limit}`;

  const cached = searchCache.get<Event[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select(
        `
        id,
        title,
        description,
        category,
        location,
        price,
        date,
        image_url,
        creator_id,
        attendee_count,
        max_attendees,
        status,
        tags,
        created_at,
        updated_at,
        profiles!creator_id (
          id,
          full_name
        )
      `
      )
      .eq('status', 'published')
      .gte('date', new Date().toISOString()) // Only future events
      .order('attendee_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const events: Event[] = (data || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      location: event.location,
      price: event.price,
      date: event.date,
      image_url: event.image_url,
      creator_id: event.creator_id,
      creator_name: event.profiles?.full_name,
      attendee_count: event.attendee_count || 0,
      max_attendees: event.max_attendees,
      status: event.status,
      tags: event.tags,
      created_at: event.created_at,
      updated_at: event.updated_at,
    }));

    // Cache for 5 minutes
    searchCache.set(cacheKey, events, 5 * 60 * 1000);

    return events;
  } catch (error) {
    console.error('Trending events error:', error);
    return [];
  }
};

/**
 * Get featured events (hand-picked by admins)
 */
export const getFeaturedEvents = async (limit: number = 6): Promise<Event[]> => {
  const cacheKey = `featured_events:${limit}`;

  const cached = searchCache.get<Event[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select(
        `
        id,
        title,
        description,
        category,
        location,
        price,
        date,
        image_url,
        creator_id,
        attendee_count,
        max_attendees,
        status,
        tags,
        created_at,
        updated_at,
        profiles!creator_id (
          id,
          full_name
        )
      `
      )
      .eq('status', 'published')
      .eq('featured', true) // Featured events
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(limit);

    if (error) throw error;

    const events: Event[] = (data || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      location: event.location,
      price: event.price,
      date: event.date,
      image_url: event.image_url,
      creator_id: event.creator_id,
      creator_name: event.profiles?.full_name,
      attendee_count: event.attendee_count || 0,
      max_attendees: event.max_attendees,
      status: event.status,
      tags: event.tags,
      created_at: event.created_at,
      updated_at: event.updated_at,
    }));

    // Cache for 10 minutes
    searchCache.set(cacheKey, events, 10 * 60 * 1000);

    return events;
  } catch (error) {
    console.error('Featured events error:', error);
    return [];
  }
};
