import { supabase } from '@/integrations/supabase/client';
import type { Event } from '@/lib/types';
import { useDataFetch } from './useDataFetch';

export const useEvent = (eventId: string) => {
  const fetchEvent = async (): Promise<Event | null> => {
    if (!eventId) {
      return null;
    }

    const { data, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    return data;
  };

  const { data, isLoading, error } = useDataFetch(fetchEvent, [eventId], {
    errorMessage: 'Failed to fetch event details',
    fetchOnMount: !!eventId,
  });

  return {
    event: data,
    loading: isLoading,
    error,
  };
};
