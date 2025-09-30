import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/lib/types/event';
import { EventSearchProps } from '@/lib/types/search';

export const searchEvents = async (
  filters: EventSearchProps,
  sortOrder: 'newest' | 'popular' | 'funded' = 'newest',
  lastVisible?: any
): Promise<{ events: Event[]; lastVisible?: any }> => {
  try {
    let query = supabase.from('events').select('*');

    // Apply filters
    if (filters.searchQuery) {
      query = query.ilike('title', `%${filters.searchQuery}%`);
    }

    if (filters.location && filters.location !== 'All locations') {
      query = query.ilike('location', `%${filters.location}%`);
    }

    // Apply sorting
    switch (sortOrder) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('created_at', { ascending: false }); // Fallback to newest
        break;
      case 'funded':
        query = query.order('created_at', { ascending: false }); // Fallback to newest
        break;
    }

    const limit = filters.pageSize || 10;
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    const events = (data || []).map((event: unknown) => ({
      id: event.id,
      title: event.title || '',
      description: event.description || '',
      shortDescription: event.description?.substring(0, 100) || '',
      startDate: new Date(event.start_date || new Date()),
      endDate: new Date(event.end_date || new Date()),
      location: event.location || '',
      status: event.status || 'upcoming',
      organizer: {
        id: event.creator_id || '',
        name: 'Event Organizer',
        username: 'organizer',
      },
      createdAt: new Date(event.created_at || new Date()),
      updatedAt: new Date(event.updated_at || new Date()),
    }));

    return {
      events,
      lastVisible: data && data.length >= limit ? data[data.length - 1] : null,
    };
  } catch (error) {
    return { events: [] };
  }
};
