import { supabase } from '@/integrations/supabase/client';

export interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface EventSearchResult {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
}

export interface VenueSearchResult {
  id: string;
  name: string;
  description: string;
  location: string;
}

export const searchEvents = async (
  query: string,
  filters?: any
): Promise<SearchResult<EventSearchResult>> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = (data || []).map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startDate: event.start_date || '',
    }));

    return {
      items,
      total: items.length,
      hasMore: false,
    };
  } catch (error) {
    return { items: [], total: 0, hasMore: false };
  }
};

export const searchVenues = async (
  query: string,
  filters?: any
): Promise<SearchResult<VenueSearchResult>> => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = (data || []).map(venue => ({
      id: venue.id,
      name: venue.name,
      description: venue.description || '',
      location: 'Location not available',
    }));

    return {
      items,
      total: items.length,
      hasMore: false,
    };
  } catch (error) {
    return { items: [], total: 0, hasMore: false };
  }
};

export const searchAll = async (
  query: string
): Promise<{
  events: SearchResult<EventSearchResult>;
  venues: SearchResult<VenueSearchResult>;
}> => {
  try {
    const [eventsResult, venuesResult] = await Promise.all([
      searchEvents(query),
      searchVenues(query),
    ]);

    return {
      events: eventsResult,
      venues: venuesResult,
    };
  } catch (error) {
    return {
      events: { items: [], total: 0, hasMore: false },
      venues: { items: [], total: 0, hasMore: false },
    };
  }
};
