/**
 * Event Mutations Service - Production Implementation
 *
 * Handles event creation, updates, deletion, and data operations
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EventUpdateData {
  title?: string | undefined;
  description?: string | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  location?: string | undefined;
  image_url?: string | undefined;
  capacity?: number | undefined;
  price?: number | undefined;
  category?: string | undefined;
  status?: 'draft' | undefined| 'published' | 'cancelled' | 'completed';
  tags?: string[] | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface EventCreateData extends Omit<EventUpdateData, 'status'> {
  title: string;
  description: string;
  start_date: string;
  organizer_id: string;
  status?: 'draft' | 'published';
}

/**
 * Updates an existing event
 */
export const updateEvent = async (eventId: string, data: EventUpdateData): Promise<boolean> => {
  try {
    // Validate required fields
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    // Prepare update data
    const updateData = {
          ...data,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('events').update(updateData).eq('id', eventId);

    if (error) throw error;

    toast.success('Event updated successfully');
    return true;
  } catch (error) {
    toast.error('Failed to update event');
    return false;
  }
};

/**
 * Creates a new event
 */
export const createEvent = async (data: EventCreateData): Promise<string | null> => {
  try {
    // Validate required fields
    if (!data.title || !data.description || !data.start_date || !data.organizer_id) {
      throw new Error('Missing required fields: title, description, start_date, organizer_id');
    }

    // Prepare create data
    const createData = {
          ...data,
      status: data.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: event, error } = await supabase
      .from('events')
      .insert(createData)
      .select()
      .single();

    if (error) throw error;

    toast.success('Event created successfully');
    return event.id;
  } catch (error) {
    toast.error('Failed to create event');
    return null;
  }
};

/**
 * Deletes an event
 */
export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    // First, delete related records (streams, tickets, etc.)
    await Promise.all([
      supabase.from('event_streams').delete().eq('event_id', eventId).then(result => result),
      supabase.from('tickets').delete().eq('event_id', eventId).then(result => result),
      supabase.from('event_registrations').delete().eq('event_id', eventId).then(result => result),
    ]);

    // Then delete the event
    const { error } = await supabase.from('events').delete().eq('id', eventId);

    if (error) throw error;

    toast.success('Event deleted successfully');
    return true;
  } catch (error) {
    toast.error('Failed to delete event');
    return false;
  }
};

/**
 * Publishes a draft event
 */
export const publishEvent = async (eventId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) throw error;

    toast.success('Event published successfully');
    return true;
  } catch (error) {
    toast.error('Failed to publish event');
    return false;
  }
};

/**
 * Cancels an event
 */
export const cancelEvent = async (eventId: string, reason?: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) throw error;

    // Cancel associated stream if exists
    await supabase
      .from('event_streams')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    toast.success('Event cancelled successfully');
    return true;
  } catch (error) {
    toast.error('Failed to cancel event');
    return false;
  }
};

/**
 * Duplicates an event
 */
export const duplicateEvent = async (eventId: string): Promise<string | null> => {
  try {
    // Get the original event
    const { data: originalEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError) throw fetchError;

    // Create a copy with modified data
    const duplicateData: EventCreateData = {
      title: `${originalEvent.title} (Copy)`,
      description: originalEvent.description,
      start_date: originalEvent.start_date,
      end_date: originalEvent.end_date,
      location: originalEvent.location,
      image_url: originalEvent.image_url,
      capacity: originalEvent.capacity,
      price: originalEvent.price,
      category: originalEvent.category,
      tags: originalEvent.tags,
      metadata: originalEvent.metadata,
      organizer_id: originalEvent.organizer_id,
      status: 'draft',
    };

    return await createEvent(duplicateData);
  } catch (error) {
    toast.error('Failed to duplicate event');
    return null;
  }
};

/**
 * Gets event statistics
 */
export const getEventStats = async (
  eventId: string
): Promise<{
  registrations: number;
  tickets_sold: number;
  revenue: number;
  views: number;
} | null> => {
  try {
    const [registrations, tickets, views] = await Promise.all([
      supabase.from('event_registrations').select('id', { count: 'exact' }).eq('event_id', eventId).then(result => result),
      supabase
        .from('tickets')
        .select('price_in_cents')
        .eq('event_id', eventId)
        .neq('status', 'cancelled'),
      supabase.from('event_views').select('id', { count: 'exact' }).eq('event_id', eventId).then(result => result),
    ]);

    const ticketCount = tickets.data?.length || 0;
    const revenue =
      tickets.data?.reduce((sum, ticket) => sum + (ticket.price_in_cents || 0), 0) || 0;

    return {
      registrations: registrations.count || 0,
      tickets_sold: ticketCount,
      revenue: revenue / 100, // Convert cents to dollars
      views: views.count || 0,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Updates event view count
 */
export const recordEventView = async (eventId: string, userId?: string): Promise<void> => {
  try {
    // Record the view
    await supabase.from('event_views').insert({
      event_id: eventId,
      user_id: userId,
      viewed_at: new Date().toISOString(),
    });

    // Update view count on the event
    const { data: currentEvent } = await supabase
      .from('events')
      .select('view_count')
      .eq('id', eventId)
      .single();

    const newViewCount = (currentEvent?.view_count || 0) + 1;

    await supabase
      .from('events')
      .update({
        view_count: newViewCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);
  } catch (error) {
    // Don't throw error for view tracking failures
  }
};

/**
 * Batch update multiple events
 */
export const batchUpdateEvents = async (
  eventIds: string[],
  updates: EventUpdateData
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('events')
      .update({
          ...updates,
        updated_at: new Date().toISOString(),
      })
      .in('id', eventIds);

    if (error) throw error;

    toast.success(`${eventIds.length} events updated successfully`);
    return true;
  } catch (error) {
    toast.error('Failed to update events');
    return false;
  }
};

/**
 * Get events by organizer
 */
export const getEventsByOrganizer = async (
  organizerId: string,
  status?: string,
  limit = 50
): Promise<any[]> => {
  try {
    let query = supabase
      .from('events')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    return [];
  }
};
