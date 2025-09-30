import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/lib/types/event';
import { getFeaturedEvents, getEvents } from './event/queries';
import { searchEvents } from './event/search';

// Re-export the main functions
export { getFeaturedEvents, getEvents, searchEvents };

// Additional event service functions
export const getEventById = async (id: string): Promise<Event | null> => {
  try {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();

    if (error) throw error;

    if (!data) return null;

    return {
      id: data.id,
      title: data.title || '',
      description: data.description || '',
      shortDescription: data.description?.substring(0, 100) || '',
      startDate: new Date(data.start_date || new Date()),
      endDate: new Date(data.end_date || new Date()),
      location: data.location || '',
      status: (data.status as 'completed' | 'upcoming' | 'active' | 'scheduled') || 'upcoming',
      organizer: {
        id: data.creator_id || '',
        name: 'Event Organizer',
        username: 'organizer',
      },
      createdAt: new Date(data.created_at || new Date()),
      updatedAt: new Date(data.updated_at || new Date()),
    };
  } catch (error) {
    return null;
  }
};

export const deleteAnonymousEvents = async (): Promise<number> => {
  try {
    // Count first to know how many rows will be deleted
    const { count, error: countError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .is('creator_id', null);

    if (countError) throw countError;

    // Now delete the rows
    const { error } = await supabase.from('events').delete().is('creator_id', null);

    if (error) throw error;

    // Return the count of deleted rows
    return count || 0;
  } catch (error) {
    return 0;
  }
};
