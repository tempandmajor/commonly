/**
 * Event Service Compatibility Layer
 *
 * This file provides backward compatibility with existing code that uses the old event service.
 * It maps old function signatures to the new modular API.
 *
 * @deprecated Use the new modular Event API instead.
 */

import { EventAPI } from '..';
import {
  Event,
  EventType,
  EventStatus,
  EventVisibility,
  CreateEventParams,
  UpdateEventParams,
  EventSearchParams,
} from '../types';

/**
 * @deprecated Use EventAPI.getEvent instead.
 */
export async function getEventById(eventId: string): Promise<Event> {
  console.warn('Deprecated: Use EventAPI.getEvent instead of getEventById');
  return EventAPI.getEvent(eventId);
}

/**
 * @deprecated Use EventAPI.searchEvents instead.
 */
export async function searchEventsByFilters(filters: any): Promise<Event[]> {
  console.warn('Deprecated: Use EventAPI.searchEvents instead of searchEventsByFilters');
  const searchParams: EventSearchParams = {
    query: filters.query,
    type: filters.type,
    status: filters.status || EventStatus.Published,
    categories: filters.categories,
    tags: filters.tags,
    startDateFrom: filters.startDate,
    startDateTo: filters.endDate,
    creatorId: filters.creatorId,
    page: filters.page || 0,
    limit: filters.limit || 20,
  };

  const result = await EventAPI.searchEvents(searchParams);
  return result.events;
}

/**
 * @deprecated Use EventAPI.createEvent instead.
 */
export async function createNewEvent(eventData: any, userId: string): Promise<Event> {
  console.warn('Deprecated: Use EventAPI.createEvent instead of createNewEvent');

  const createParams: CreateEventParams = {
    title: eventData.title,
    description: eventData.description,
    summary: eventData.summary,
    type: mapLegacyEventType(eventData.type),
    visibility: mapLegacyVisibility(eventData.visibility),
    coverImage: eventData.coverImage,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    timezone: eventData.timezone || 'UTC',
    location: {
      name: eventData.locationName || '',
      address: eventData.address,
      city: eventData.city,
      state: eventData.state,
      country: eventData.country,
      postalCode: eventData.postalCode,
      latitude: eventData.latitude,
      longitude: eventData.longitude,
      virtualUrl: eventData.virtualUrl,
      isVirtual: !!eventData.virtualUrl,
    },
    ticketTiers:
      eventData.tickets?.map((ticket: any) => ({
        name: ticket.name,
        description: ticket.description,
        price: ticket.price || 0,
        currency: ticket.currency || 'USD',
        quantity: ticket.quantity || 100,
        quantityAvailable: ticket.quantity || 100,
        type: ticket.isFree ? 'free' : 'paid',
        salesStartDate: ticket.salesStartDate || new Date().toISOString(),
        salesEndDate: ticket.salesEndDate || eventData.startDate,
        isActive: true,
        maxPerOrder: ticket.maxPerOrder,
        minPerOrder: ticket.minPerOrder || 1,
      })) || [],
    categories: eventData.categories || [],
    tags: eventData.tags || [],
  };

  return EventAPI.createEvent(createParams, userId);
}

/**
 * @deprecated Use EventAPI.updateEvent instead.
 */
export async function updateExistingEvent(eventId: string, eventData: any): Promise<Event> {
  console.warn('Deprecated: Use EventAPI.updateEvent instead of updateExistingEvent');

  const updateParams: UpdateEventParams = {
    id: eventId,
    title: eventData.title,
    description: eventData.description,
    summary: eventData.summary,
    type: mapLegacyEventType(eventData.type),
    status: mapLegacyStatus(eventData.status),
    visibility: mapLegacyVisibility(eventData.visibility),
    coverImage: eventData.coverImage,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    timezone: eventData.timezone,
    location: eventData.location
      ? {
          name: eventData.location.name || eventData.locationName || '',
          address: eventData.location.address || eventData.address,
          city: eventData.location.city || eventData.city,
          state: eventData.location.state || eventData.state,
          country: eventData.location.country || eventData.country,
          postalCode: eventData.location.postalCode || eventData.postalCode,
          latitude: eventData.location.latitude || eventData.latitude,
          longitude: eventData.location.longitude || eventData.longitude,
          virtualUrl: eventData.location.virtualUrl || eventData.virtualUrl,
          isVirtual: eventData.location.isVirtual || !!eventData.virtualUrl,
        }
      : undefined,
    categories: eventData.categories,
    tags: eventData.tags,
  };

  return EventAPI.updateEvent(updateParams);
}

/**
 * @deprecated Use EventAPI.deleteEvent instead.
 */
export async function removeEvent(eventId: string): Promise<boolean> {
  console.warn('Deprecated: Use EventAPI.deleteEvent instead of removeEvent');
  return EventAPI.deleteEvent(eventId);
}

/**
 * @deprecated Use EventAPI.publishEvent instead.
 */
export async function publishEventById(eventId: string): Promise<Event> {
  console.warn('Deprecated: Use EventAPI.publishEvent instead of publishEventById');
  return EventAPI.publishEvent(eventId);
}

/**
 * @deprecated Use EventAPI.cancelEvent instead.
 */
export async function cancelEventById(eventId: string, reason?: string): Promise<Event> {
  console.warn('Deprecated: Use EventAPI.cancelEvent instead of cancelEventById');
  return EventAPI.cancelEvent(eventId, reason);
}

/**
 * @deprecated Use EventAPI.getUpcomingEvents instead.
 */
export async function fetchUpcomingEvents(limit = 10): Promise<Event[]> {
  console.warn('Deprecated: Use EventAPI.getUpcomingEvents instead of fetchUpcomingEvents');
  return EventAPI.getUpcomingEvents(limit);
}

/**
 * @deprecated Use EventAPI.getFeaturedEvents instead.
 */
export async function fetchFeaturedEvents(limit = 5): Promise<Event[]> {
  console.warn('Deprecated: Use EventAPI.getFeaturedEvents instead of fetchFeaturedEvents');
  return EventAPI.getFeaturedEvents(limit);
}

/**
 * @deprecated Use EventAPI.getUserEvents instead.
 */
export async function fetchUserEvents(userId: string, page = 0, limit = 20): Promise<Event[]> {
  console.warn('Deprecated: Use EventAPI.getUserEvents instead of fetchUserEvents');
  const result = await EventAPI.getUserEvents(userId, page, limit);
  return result.events;
}

// Helper functions to map legacy values to new enums

function mapLegacyEventType(type?: string): EventType {
  if (!type) return EventType.InPerson;

  switch (type.toLowerCase()) {
    case 'virtual':
    case 'online':
      return EventType.Virtual;
    case 'hybrid':
      return EventType.Hybrid;
    case 'in_person':
    case 'in-person':
    case 'physical':
    default:
      return EventType.InPerson;
  }
}

function mapLegacyStatus(status?: string): EventStatus {
  if (!status) return EventStatus.Draft;

  switch (status.toLowerCase()) {
    case 'published':
    case 'active':
    case 'live':
      return EventStatus.Published;
    case 'canceled':
    case 'cancelled':
      return EventStatus.Canceled;
    case 'completed':
    case 'ended':
    case 'finished':
      return EventStatus.Completed;
    case 'archived':
      return EventStatus.Archived;
    case 'draft':
    default:
      return EventStatus.Draft;
  }
}

function mapLegacyVisibility(visibility?: string): EventVisibility {
  if (!visibility) return EventVisibility.Public;

  switch (visibility.toLowerCase()) {
    case 'private':
      return EventVisibility.Private;
    case 'unlisted':
    case 'hidden':
      return EventVisibility.Unlisted;
    case 'public':
    default:
      return EventVisibility.Public;
  }
}
