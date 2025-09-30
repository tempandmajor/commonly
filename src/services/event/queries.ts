import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/lib/types/event';
import { EventSearchProps } from '@/lib/types/search';

export const getEvents = async (
  limit: number = 10,
  filters?: Partial<EventSearchProps>
): Promise<Event[]> => {
  try {
    let query = supabase
      .from('events')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    // Apply category filter if provided
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    // Apply search query filter if provided
    if (filters?.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    // Apply location filter if provided
    if (filters?.location && filters.location !== 'All locations') {
      query = query.ilike('location', `%${filters.location}%`);
    }

    // Apply price filter
    if (filters?.isFreeOnly) {
      query = query.eq('is_free', true);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((event: any) => ({
      id: event.id,
      title: event.title || '',
      description: event.description || '',
      shortDescription: event.short_description || event.description?.substring(0, 100) || '',
      startDate: new Date(event.start_date || new Date()),
      endDate: new Date(event.end_date || new Date()),
      location: event.location || '',
      status: event.status || 'upcoming',
      category: event.category,
      price: event.price || 0,
      isFree: event.is_free || false,
      image_url: event.image_url,
      organizer: {
        id: event.creator_id || '',
        name: event.organizer_name || 'Event Organizer',
        username: 'organizer',
      },
      createdAt: new Date(event.created_at || new Date()),
      updatedAt: new Date(event.updated_at || new Date()),
    }));
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const getFeaturedEvents = async (): Promise<Event[]> => {
  return getEvents(6);
};
