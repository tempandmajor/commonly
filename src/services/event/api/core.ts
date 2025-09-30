/**
 * Event Service Core API Functions
 *
 * This file contains the core API functions for the Event Service.
 * These functions handle CRUD operations for events.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  Event,
  CreateEventParams,
  UpdateEventParams,
  EventStatus,
  EventSearchParams,
  EventSearchResult,
} from '../types';
import { handleApiError } from '../utils/errorHandling';
import { transformEventData } from '../utils/transformers';
import { eventCache } from '../utils/cache';

/**
 * Create a new event
 * @param params - Event creation parameters
 * @param userId - ID of the user creating the event
 * @returns The created event
 */
export async function createEvent(params: CreateEventParams, userId: string): Promise<Event> {
  try {
    // Format the event data for database insertion
    const eventData = {
      title: params.title,
      description: params.description,
      summary: params.summary || null,
      type: params.type,
      status: EventStatus.Draft,
      visibility: params.visibility,
      cover_image: params.coverImage || null,
      start_date: params.startDate,
      end_date: params.endDate,
      timezone: params.timezone,
      creator_id: userId,
      max_attendees: params.maxAttendees || null,
      categories: params.categories || [],
      tags: params.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert the event into the database
    const { data: eventResult, error: eventError } = await supabase
      .from('events')
      .insert(eventData)
      .select('*')
      .single();

    if (eventError) {
      throw eventError;
    }

    if (!eventResult) {
      throw new Error('Failed to create event');
    }

    // Insert the location data
    const locationData = {
          ...params.location,
      event_id: eventResult.id,
    };

    const { error: locationError } = await supabase.from('event_locations').insert(locationData);

    if (locationError) {
      throw locationError;
    }

    // Insert organizer if provided
    let organizerId = params.organizerId;
    if (!organizerId && params.organizer) {
      const { data: organizerResult, error: organizerError } = await supabase
        .from('event_organizers')
        .insert({
          name: params.organizer.name,
          description: params.organizer.description || null,
          logo: params.organizer.logo || null,
          website: params.organizer.website || null,
          email: params.organizer.email || null,
          phone: params.organizer.phone || null,
          social_links: params.organizer.socialLinks || null,
          creator_id: userId,
        })
        .select('id')
        .single();

      if (organizerError) {
        throw organizerError;
      }

      organizerId = organizerResult?.id;
    }

    // Update the event with the organizer ID
    if (organizerId) {
      const { error: updateError } = await supabase
        .from('events')
        .update({ organizer_id: organizerId })
        .eq('id', eventResult.id);

      if (updateError) {
        throw updateError;
      }
    }

    // Insert ticket tiers if provided
    if (params.ticketTiers && params.ticketTiers.length > 0) {
      const ticketTiersData = params.ticketTiers.map(tier => ({
        event_id: eventResult.id,
        name: tier.name,
        description: tier.description || null,
        price: tier.price,
        currency: tier.currency,
        quantity: tier.quantity,
        quantity_available: tier.quantity,
        type: tier.type,
        sales_start_date: tier.salesStartDate,
        sales_end_date: tier.salesEndDate,
        is_active: true,
        max_per_order: tier.maxPerOrder || null,
        min_per_order: tier.minPerOrder || 1,
      }));

      const { error: tiersError } = await supabase
        .from('event_ticket_tiers')
        .insert(ticketTiersData);

      if (tiersError) {
        throw tiersError;
      }
    }

    // Insert settings if provided
    const defaultSettings = {
      allow_comments: true,
      allow_sharing: true,
      show_attendee_list: false,
      require_approval: false,
      enable_waitlist: false,
      send_reminders: true,
      reminder_times: [24, 1], // 24 hours and 1 hour before event
    };

    const settingsData = {
      event_id: eventResult.id,
          ...defaultSettings,
          ...(params.settings || {}),
    };

    const { error: settingsError } = await supabase.from('event_settings').insert(settingsData);

    if (settingsError) {
      throw settingsError;
    }

    // Fetch the complete event with all related data
    return getEvent(eventResult.id);
  } catch (error) {
    return handleApiError('Failed to create event', error);
  }
}

/**
 * Get an event by ID
 * @param eventId - ID of the event to retrieve
 * @returns The event data
 */
export async function getEvent(eventId: string): Promise<Event> {
  try {
    // Check cache first
    const cachedEvent = eventCache.get(eventId);
    if (cachedEvent) {
      return cachedEvent;
    }

    // Fetch event data
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(
        `
        *,
        creator:creator_id(*),
        location:event_locations!event_id(*),
        organizer:event_organizers(*),
        ticket_tiers:event_ticket_tiers(*),
        settings:event_settings(*)
      `
      )
      .eq('id', eventId)
      .single();

    if (eventError) {
      throw eventError;
    }

    if (!eventData) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Transform the data to match our interface
    const event = transformEventData(eventData);

    // Cache the result
    eventCache.set(eventId, event);

    return event;
  } catch (error) {
    return handleApiError(`Failed to get event: ${eventId}`, error);
  }
}

/**
 * Update an existing event
 * @param params - Event update parameters
 * @returns The updated event
 */
export async function updateEvent(params: UpdateEventParams): Promise<Event> {
  try {
    const { id, ...updateData } = params;

    // Format the event data for database update
    const eventUpdateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are provided
    if (updateData.title) eventUpdateData.title = updateData.title;
    if (updateData.description) eventUpdateData.description = updateData.description;
    if (updateData.summary !== undefined) eventUpdateData.summary = updateData.summary;
    if (updateData.type) eventUpdateData.type = updateData.type;
    if (updateData.status) eventUpdateData.status = updateData.status;
    if (updateData.visibility) eventUpdateData.visibility = updateData.visibility;
    if (updateData.coverImage !== undefined) eventUpdateData.cover_image = updateData.coverImage;
    if (updateData.startDate) eventUpdateData.start_date = updateData.startDate;
    if (updateData.endDate) eventUpdateData.end_date = updateData.endDate;
    if (updateData.timezone) eventUpdateData.timezone = updateData.timezone;
    if (updateData.categories) eventUpdateData.categories = updateData.categories;
    if (updateData.tags) eventUpdateData.tags = updateData.tags;
    if (updateData.maxAttendees !== undefined)
      eventUpdateData.max_attendees = updateData.maxAttendees;

    // Only update if there are fields to update
    if ((Object.keys(eventUpdateData) as (keyof typeof eventUpdateData)[]).length > 1) {
      const { error: eventError } = await supabase
        .from('events')
        .update(eventUpdateData)
        .eq('id', id);

      if (eventError) {
        throw eventError;
      }
    }

    // Update location if provided
    if (updateData.location) {
      const { error: locationError } = await supabase
        .from('event_locations')
        .update(updateData.location)
        .eq('event_id', id);

      if (locationError) {
        throw locationError;
      }
    }

    // Update settings if provided
    if (updateData.settings) {
      const { error: settingsError } = await supabase
        .from('event_settings')
        .update(updateData.settings)
        .eq('event_id', id);

      if (settingsError) {
        throw settingsError;
      }
    }

    // Clear cache for this event
    eventCache.delete(id);

    // Fetch the updated event
    return getEvent(id);
  } catch (error) {
    return handleApiError(`Failed to update event: ${params.id}`, error);
  }
}

/**
 * Delete an event
 * @param eventId - ID of the event to delete
 * @returns True if successful
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('events').delete().eq('id', eventId);

    if (error) {
      throw error;
    }

    // Clear cache for this event
    eventCache.delete(eventId);

    return true;
  } catch (error) {
    handleApiError(`Failed to delete event: ${eventId}`, error);
    return false;
  }
}

/**
 * Publish an event
 * @param eventId - ID of the event to publish
 * @returns The published event
 */
export async function publishEvent(eventId: string): Promise<Event> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        status: EventStatus.Published,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      throw error;
    }

    // Clear cache for this event
    eventCache.delete(eventId);

    // Fetch the updated event
    return getEvent(eventId);
  } catch (error) {
    return handleApiError(`Failed to publish event: ${eventId}`, error);
  }
}

/**
 * Cancel an event
 * @param eventId - ID of the event to cancel
 * @param reason - Optional reason for cancellation
 * @returns The canceled event
 */
export async function cancelEvent(eventId: string, reason?: string): Promise<Event> {
  try {
    const { error } = await supabase
      .from('events')
      .update({
        status: EventStatus.Canceled,
        cancellation_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) {
      throw error;
    }

    // Clear cache for this event
    eventCache.delete(eventId);

    // Fetch the updated event
    return getEvent(eventId);
  } catch (error) {
    return handleApiError(`Failed to cancel event: ${eventId}`, error);
  }
}

/**
 * Search for events based on various criteria
 * @param params - Search parameters
 * @returns Search results
 */
export async function searchEvents(params: EventSearchParams): Promise<EventSearchResult> {
  try {
    const {
      query,
      type,
      status,
      visibility,
      categories,
      tags,
      startDateFrom,
      startDateTo,
      location,
      creatorId,
      organizerId,
      page = 0,
      limit = 20,
      sortBy = 'date',
      sortDirection = 'asc',
    } = params;

    // Start building the query
    let queryBuilder = supabase.from('events').select(
      `
        *,
        creator:creator_id(*),
        location:event_locations!event_id(*),
        organizer:event_organizers(*),
        ticket_tiers:event_ticket_tiers(*),
        settings:event_settings(*),
        count: count()
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    } else {
      // By default, only show published events
      queryBuilder = queryBuilder.eq('status', EventStatus.Published);
    }

    if (visibility) {
      queryBuilder = queryBuilder.eq('visibility', visibility);
    }

    if (categories && categories.length > 0) {
      queryBuilder = queryBuilder.contains('categories', categories);
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.contains('tags', tags);
    }

    if (startDateFrom) {
      queryBuilder = queryBuilder.gte('start_date', startDateFrom);
    }

    if (startDateTo) {
      queryBuilder = queryBuilder.lte('start_date', startDateTo);
    }

    if (creatorId) {
      queryBuilder = queryBuilder.eq('creator_id', creatorId);
    }

    if (organizerId) {
      queryBuilder = queryBuilder.eq('organizer_id', organizerId);
    }

    // Apply sorting
    let orderColumn: string;
    switch (sortBy) {
      case 'popularity':
        orderColumn = 'attendee_count';
        break;
      case 'relevance':
        // For relevance sorting, we'll just use date as a fallback
        // In a real implementation, this would use full-text search ranking
        orderColumn = 'start_date';
        break;
      case 'date':
      default:
        orderColumn = 'start_date';
        break;
    }

    queryBuilder = queryBuilder.order(orderColumn, { ascending: sortDirection === 'asc' });

    // Apply pagination
    queryBuilder = queryBuilder.range(page * limit, (page + 1) * limit - 1);

    // Execute the query
    const { data, error, count } = await queryBuilder;

    if (error) {
      throw error;
    }

    // Transform the data
    const events = data.map(transformEventData);

    return {
      events,
      totalCount: count || events.length,
      page,
      limit,
      hasMore: count ? (page + 1) * limit < count : false,
    };
  } catch (error) {
    return handleApiError('Failed to search events', error, {
      events: [],
      totalCount: 0,
      page: params.page || 0,
      limit: params.limit || 20,
      hasMore: false,
    });
  }
}

/**
 * Get events created by a specific user
 * @param userId - ID of the user
 * @param page - Page number for pagination
 * @param limit - Number of events per page
 * @returns Events created by the user
 */
export async function getUserEvents(
  userId: string,
  page = 0,
  limit = 20
): Promise<EventSearchResult> {
  return searchEvents({
    creatorId: userId,
    page,
    limit,
    sortBy: 'date',
    sortDirection: 'desc',
  });
}

/**
 * Get upcoming events
 * @param limit - Number of events to retrieve
 * @returns Upcoming events
 */
export async function getUpcomingEvents(limit = 10): Promise<Event[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .select(
        `
        *,
        creator:creator_id(*),
        location:event_locations!event_id(*),
        organizer:event_organizers(*),
        ticket_tiers:event_ticket_tiers(*),
        settings:event_settings(*)
      `
      )
      .eq('status', EventStatus.Published)
      .gte('start_date', now)
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data.map(transformEventData);
  } catch (error) {
    return handleApiError('Failed to get upcoming events', error, []);
  }
}

/**
 * Get featured events
 * @param limit - Number of events to retrieve
 * @returns Featured events
 */
export async function getFeaturedEvents(limit = 5): Promise<Event[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .select(
        `
        id,
        title,
        description,
        creator_id,
        start_date,
        end_date,
        location,
        status,
        image_url,
        price,
        is_free,
        category,
        max_capacity,
        attendees_count,
        is_public,
        created_at,
        updated_at
      `
      )
      .eq('status', 'published')
      .eq('is_public', true)
      .gte('start_date', now)
      .order('start_date', { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Transform data to match Event interface
    return data.map((event: any) => ({
          ...event,
      venue_id: null,
      // Add any other required fields with defaults
    }));
  } catch (error) {
    return handleApiError('Failed to get featured events', error, []);
  }
}
