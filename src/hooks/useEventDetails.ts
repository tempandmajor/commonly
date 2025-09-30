/**
 * Event Details Hook - PRODUCTION IMPLEMENTATION
 *
 * Real database-powered event details, registration, and analytics.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EventDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  price: number;
  date: string;
  end_date?: string | undefined;
  image_url?: string | undefined;
  creator_id: string;
  creator_name?: string | undefined;
  creator_avatar?: string | undefined;
  attendee_count: number;
  max_attendees?: number | undefined;
  status: 'draft' | 'published' | 'cancelled' | 'ended';
  tags?: string[] | undefined;
  created_at: string;
  updated_at: string;
  is_registered?: boolean | undefined;
  is_favorited?: boolean | undefined;
  virtual_link?: string | undefined;
  featured: boolean;
  requirements?: string | undefined;
  agenda?: string | undefined;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registration_date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  ticket_type?: string | undefined;
  payment_status?: string | undefined;
}

/**
 * Fetch detailed event information
 */
export const useEventDetails = (eventId: string, userId?: string) => {
  const queryClient = useQueryClient();

  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['event-details', eventId, userId],
    queryFn: async (): Promise<EventDetails | null> => {
      try {
        // Fetch event with creator details
        const { data: eventData, error: eventError } = await supabase
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
            end_date,
            image_url,
            creator_id,
            attendee_count,
            max_attendees,
            status,
            tags,
            created_at,
            updated_at,
            virtual_link,
            featured,
            requirements,
            agenda,
            profiles!creator_id (
              id,
              full_name,
              avatar_url
            )
          `
          )
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;
        if (!eventData) return null;

        // Type cast to handle Supabase's complex query type inference
        const typedEventData = eventData as any;

        // Check if user is registered (if userId provided)
        let isRegistered = false;
        let isFavorited = false;

        if (userId) {
          // Check registration status
          const { data: registration } = await supabase
            .from('event_registrations')
            .select('status')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .eq('status', 'confirmed')
            .single();

          isRegistered = !!registration;

          // Check if favorited
          const { data: favorite } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .single();

          isFavorited = !!favorite;
        }

        return {
          id: typedEventData.id,
          title: typedEventData.title,
          description: typedEventData.description,
          category: typedEventData.category,
          location: typedEventData.location,
          price: typedEventData.price,
          date: typedEventData.date,
          end_date: typedEventData.end_date,
          image_url: typedEventData.image_url,
          creator_id: typedEventData.creator_id,
          creator_name: typedEventData.profiles?.full_name,
          creator_avatar: typedEventData.profiles?.avatar_url,
          attendee_count: typedEventData.attendee_count || 0,
          max_attendees: typedEventData.max_attendees,
          status: typedEventData.status,
          tags: typedEventData.tags,
          created_at: typedEventData.created_at,
          updated_at: typedEventData.updated_at,
          is_registered: isRegistered,
          is_favorited: isFavorited,
          virtual_link: typedEventData.virtual_link,
          featured: typedEventData.featured || false,
          requirements: typedEventData.requirements,
          agenda: typedEventData.agenda,
        };
      } catch (error) {
        console.error('Error fetching event details:', error);
        throw new Error('Failed to load event details');
      }
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Register for event mutation
  const registerMutation = useMutation({
    mutationFn: async ({ ticketType }: { ticketType?: string }) => {
      if (!userId) throw new Error('User must be logged in to register');

      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: userId,
          registration_date: new Date().toISOString(),
          status: 'confirmed',
          ticket_type: ticketType || 'general',
        })
        .select()
        .single();

      if (error) throw error;

      // Update attendee count
      await (supabase.rpc as any)('increment_attendee_count', { event_id: eventId });

      return data;
    },
    onSuccess: () => {
      toast.success('Successfully registered for event!');
      // Invalidate and refetch event details
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
    },
    onError: error => {
      console.error('Registration error:', error);
      toast.error('Failed to register for event');
    },
  });

  // Unregister from event mutation
  const unregisterMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User must be logged in');

      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;

      // Decrease attendee count
      await (supabase.rpc as any)('decrement_attendee_count', { event_id: eventId });
    },
    onSuccess: () => {
      toast.success('Successfully unregistered from event');
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
    },
    onError: error => {
      console.error('Unregistration error:', error);
      toast.error('Failed to unregister from event');
    },
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User must be logged in');

      if (event?.is_favorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase.from('user_favorites').insert({
          event_id: eventId,
          user_id: userId,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      const action = event?.is_favorited ? 'removed from' : 'added to';
      toast.success(`Event ${action} favorites`);
      queryClient.invalidateQueries({ queryKey: ['event-details', eventId] });
    },
    onError: error => {
      console.error('Favorite toggle error:', error);
      toast.error('Failed to update favorites');
    },
  });

  return {
    event,
    isLoading,
    error,
    refetch,
    register: registerMutation.mutate,
    unregister: unregisterMutation.mutate,
    toggleFavorite: toggleFavoriteMutation.mutate,
    isRegistering: registerMutation.isPending,
    isUnregistering: unregisterMutation.isPending,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
  };
};

/**
 * Fetch user's registered events
 */
export const useUserRegisteredEvents = (userId?: string) => {
  return useQuery({
    queryKey: ['user-registered-events', userId],
    queryFn: async (): Promise<EventDetails[]> => {
      if (!userId) return [];

      try {
        const { data, error } = await supabase
          .from('event_registrations')
          .select(
            `
            event_id,
            registration_date,
            status,
            events!event_id (
              id,
              title,
              description,
              category,
              location,
              price,
              date,
              end_date,
              image_url,
              creator_id,
              attendee_count,
              max_attendees,
              status,
              tags,
              created_at,
              updated_at,
              virtual_link,
              featured,
              profiles!creator_id (
                id,
                full_name,
                avatar_url
              )
            )
          `
          )
          .eq('user_id', userId)
          .eq('status', 'confirmed')
          .order('registration_date', { ascending: false });

        if (error) throw error;

        // Type cast to handle Supabase's complex query type inference
        const typedData = (data || []) as any[];

        return typedData.map(reg => ({
          id: reg.events.id,
          title: reg.events.title,
          description: reg.events.description,
          category: reg.events.category,
          location: reg.events.location,
          price: reg.events.price,
          date: reg.events.date,
          end_date: reg.events.end_date,
          image_url: reg.events.image_url,
          creator_id: reg.events.creator_id,
          creator_name: reg.events.profiles?.full_name,
          creator_avatar: reg.events.profiles?.avatar_url,
          attendee_count: reg.events.attendee_count || 0,
          max_attendees: reg.events.max_attendees,
          status: reg.events.status,
          tags: reg.events.tags,
          created_at: reg.events.created_at,
          updated_at: reg.events.updated_at,
          is_registered: true,
          is_favorited: false, // Would need separate query to check
          virtual_link: reg.events.virtual_link,
          featured: reg.events.featured || false,
        }));
      } catch (error) {
        console.error('Error fetching registered events:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch user's favorite events
 */
export const useUserFavoriteEvents = (userId?: string) => {
  return useQuery({
    queryKey: ['user-favorite-events', userId],
    queryFn: async (): Promise<EventDetails[]> => {
      if (!userId) return [];

      try {
        const { data, error } = await supabase
          .from('user_favorites')
          .select(
            `
            event_id,
            created_at,
            events!event_id (
              id,
              title,
              description,
              category,
              location,
              price,
              date,
              end_date,
              image_url,
              creator_id,
              attendee_count,
              max_attendees,
              status,
              tags,
              created_at,
              updated_at,
              virtual_link,
              featured,
              profiles!creator_id (
                id,
                full_name,
                avatar_url
              )
            )
          `
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Type cast to handle Supabase's complex query type inference
        const typedData = (data || []) as any[];

        return typedData.map(fav => ({
          id: fav.events.id,
          title: fav.events.title,
          description: fav.events.description,
          category: fav.events.category,
          location: fav.events.location,
          price: fav.events.price,
          date: fav.events.date,
          end_date: fav.events.end_date,
          image_url: fav.events.image_url,
          creator_id: fav.events.creator_id,
          creator_name: fav.events.profiles?.full_name,
          creator_avatar: fav.events.profiles?.avatar_url,
          attendee_count: fav.events.attendee_count || 0,
          max_attendees: fav.events.max_attendees,
          status: fav.events.status,
          tags: fav.events.tags,
          created_at: fav.events.created_at,
          updated_at: fav.events.updated_at,
          is_registered: false, // Would need separate query to check
          is_favorited: true,
          virtual_link: fav.events.virtual_link,
          featured: fav.events.featured || false,
        }));
      } catch (error) {
        console.error('Error fetching favorite events:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
