/**
 * Data transformation utilities for the Event Service
 *
 * These functions transform data between the database format and the application format.
 */

import {
  Event,
  EventType,
  EventStatus,
  EventVisibility,
  EventLocation,
  EventTicketTier,
  EventSettings,
  EventOrganizer,
  TicketType,
} from '../types';

/**
 * Transform raw event data from the database into the application format
 * @param data - Raw event data from the database
 * @returns Formatted event data
 */
export function transformEventData(data: any): Event {
  if (!data) {
    throw new Error('No event data provided to transform');
  }

  // Transform location data
  const location: EventLocation = data.location
    ? {
        id: data.location.id,
        name: data.location.name || '',
        address: data.location.address,
        city: data.location.city,
        state: data.location.state,
        country: data.location.country,
        postalCode: data.location.postal_code,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        virtualUrl: data.location.virtual_url,
        isVirtual: data.location.is_virtual || false,
      }
    : {
        name: 'Unknown Location',
        isVirtual: false,
      };

  // Transform organizer data
  const organizer: EventOrganizer = data.organizer
    ? {
        id: data.organizer.id,
        name: data.organizer.name,
        description: data.organizer.description,
        logo: data.organizer.logo,
        website: data.organizer.website,
        email: data.organizer.email,
        phone: data.organizer.phone,
        socialLinks: data.organizer.social_links,
      }
    : {
        id: '',
        name: 'Unknown Organizer',
      };

  // Transform ticket tiers
  const ticketTiers: EventTicketTier[] = Array.isArray(data.ticket_tiers)
    ? data.ticket_tiers.map((tier: any) => ({
        id: tier.id,
        name: tier.name,
        description: tier.description,
        price: tier.price,
        currency: tier.currency || 'USD',
        quantity: tier.quantity,
        quantityAvailable: tier.quantity_available,
        type: mapTicketType(tier.type),
        salesStartDate: tier.sales_start_date,
        salesEndDate: tier.sales_end_date,
        isActive: tier.is_active,
        maxPerOrder: tier.max_per_order,
        minPerOrder: tier.min_per_order,
      }))
    : [];

  // Transform settings
  const settings: EventSettings = data.settings
    ? {
        allowComments: data.settings.allow_comments ?? true,
        allowSharing: data.settings.allow_sharing ?? true,
        showAttendeeList: data.settings.show_attendee_list ?? false,
        requireApproval: data.settings.require_approval ?? false,
        enableWaitlist: data.settings.enable_waitlist ?? false,
        sendReminders: data.settings.send_reminders ?? true,
        reminderTimes: data.settings.reminder_times || [24, 1],
        customFields: data.settings.custom_fields,
      }
    : {
        allowComments: true,
        allowSharing: true,
        showAttendeeList: false,
        requireApproval: false,
        enableWaitlist: false,
        sendReminders: true,
        reminderTimes: [24, 1],
      };

  // Transform the main event data
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    summary: data.summary,
    type: mapEventType(data.type),
    status: mapEventStatus(data.status),
    visibility: mapEventVisibility(data.visibility),
    coverImage: data.cover_image,
    startDate: data.start_date,
    endDate: data.end_date,
    timezone: data.timezone,
    location,
    organizer,
    creatorId: data.creator_id,
    creator: data.creator,
    ticketTiers,
    settings,
    categories: data.categories || [],
    tags: data.tags || [],
    attendeeCount: data.attendee_count,
    maxAttendees: data.max_attendees,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    publishedAt: data.published_at,
  };
}

/**
 * Map database event type to enum
 * @param type - Event type from database
 * @returns Event type enum
 */
export function mapEventType(type: string): EventType {
  switch (type) {
    case 'in_person':
      return EventType.InPerson;
    case 'virtual':
      return EventType.Virtual;
    case 'hybrid':
      return EventType.Hybrid;
    default:
      return EventType.InPerson;
  }
}

/**
 * Map database event status to enum
 * @param status - Event status from database
 * @returns Event status enum
 */
export function mapEventStatus(status: string): EventStatus {
  switch (status) {
    case 'draft':
      return EventStatus.Draft;
    case 'published':
      return EventStatus.Published;
    case 'canceled':
      return EventStatus.Canceled;
    case 'completed':
      return EventStatus.Completed;
    case 'archived':
      return EventStatus.Archived;
    default:
      return EventStatus.Draft;
  }
}

/**
 * Map database event visibility to enum
 * @param visibility - Event visibility from database
 * @returns Event visibility enum
 */
export function mapEventVisibility(visibility: string): EventVisibility {
  switch (visibility) {
    case 'public':
      return EventVisibility.Public;
    case 'private':
      return EventVisibility.Private;
    case 'unlisted':
      return EventVisibility.Unlisted;
    default:
      return EventVisibility.Public;
  }
}

/**
 * Map database ticket type to enum
 * @param type - Ticket type from database
 * @returns Ticket type enum
 */
export function mapTicketType(type: string): TicketType {
  switch (type) {
    case 'free':
      return TicketType.Free;
    case 'paid':
      return TicketType.Paid;
    case 'donation':
      return TicketType.Donation;
    default:
      return TicketType.Free;
  }
}
