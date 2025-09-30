/**
 * Event Service Type Definitions
 *
 * This file contains all type definitions used throughout the Event Service.
 * It provides a centralized location for type definitions to ensure consistency.
 */

import { User } from '@/lib/types/user';

/**
 * Enum representing the different types of events
 */
export enum EventType {
  InPerson = 'in_person',
  Virtual = 'virtual',
  Hybrid = 'hybrid',
}

/**
 * Enum representing the different statuses an event can have
 */
export enum EventStatus {
  Draft = 'draft',
  Published = 'published',
  Canceled = 'canceled',
  Completed = 'completed',
  Archived = 'archived',
}

/**
 * Enum representing the different visibility options for an event
 */
export enum EventVisibility {
  Public = 'public',
  Private = 'private',
  Unlisted = 'unlisted',
}

/**
 * Enum representing the different ticket types for an event
 */
export enum TicketType {
  Free = 'free',
  Paid = 'paid',
  Donation = 'donation',
}

/**
 * Interface representing the location of an event
 */
export interface EventLocation {
  id?: string | undefined;
  name: string;
  address?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  country?: string | undefined;
  postalCode?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  virtualUrl?: string | undefined;
  isVirtual: boolean;
}

/**
 * Interface representing a ticket tier for an event
 */
export interface EventTicketTier {
  id: string;
  name: string;
  description?: string | undefined;
  price: number;
  currency: string;
  quantity: number;
  quantityAvailable: number;
  type: TicketType;
  salesStartDate: string;
  salesEndDate: string;
  isActive: boolean;
  maxPerOrder?: number | undefined;
  minPerOrder?: number | undefined;
}

/**
 * Interface representing the settings for an event
 */
export interface EventSettings {
  allowComments: boolean;
  allowSharing: boolean;
  showAttendeeList: boolean;
  requireApproval: boolean;
  enableWaitlist: boolean;
  sendReminders: boolean;
  reminderTimes: number[]; // Hours before event
  customFields?: Record<
    string,
    {
      label: string | undefined;
      type: 'text' | 'select' | 'checkbox' | 'date';
      required: boolean;
      options?: string[] | undefined;
    }
  >;
}

/**
 * Interface representing an event organizer
 */
export interface EventOrganizer {
  id: string;
  name: string;
  description?: string | undefined;
  logo?: string | undefined;
  website?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  socialLinks?: Record<string, string> | undefined;
}

/**
 * Interface representing an event
 */
export interface Event {
  id: string;
  title: string;
  description: string;
  summary?: string | undefined;
  type: EventType;
  status: EventStatus;
  visibility: EventVisibility;
  coverImage?: string | undefined;
  startDate: string;
  endDate: string;
  timezone: string;
  location: EventLocation;
  organizer: EventOrganizer;
  creatorId: string;
  creator?: User | undefined;
  ticketTiers: EventTicketTier[];
  settings: EventSettings;
  categories?: string[] | undefined;
  tags?: string[] | undefined;
  attendeeCount?: number | undefined;
  maxAttendees?: number | undefined;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | undefined;
}

/**
 * Interface for event creation parameters
 */
export interface CreateEventParams {
  title: string;
  description: string;
  summary?: string | undefined;
  type: EventType;
  visibility: EventVisibility;
  coverImage?: string | undefined;
  startDate: string;
  endDate: string;
  timezone: string;
  location: Omit<EventLocation, 'id'>;
  organizerId?: string | undefined;
  organizer?: Omit<EventOrganizer, 'id'> | undefined;
  ticketTiers?: Omit<EventTicketTier, 'id'>[] | undefined;
  settings?: Partial<EventSettings> | undefined;
  categories?: string[] | undefined;
  tags?: string[] | undefined;
  maxAttendees?: number | undefined;
}

/**
 * Interface for event update parameters
 */
export interface UpdateEventParams {
  id: string;
  title?: string | undefined;
  description?: string | undefined;
  summary?: string | undefined;
  type?: EventType | undefined;
  status?: EventStatus | undefined;
  visibility?: EventVisibility | undefined;
  coverImage?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  timezone?: string | undefined;
  location?: Partial<EventLocation> | undefined;
  settings?: Partial<EventSettings> | undefined;
  categories?: string[] | undefined;
  tags?: string[] | undefined;
  maxAttendees?: number | undefined;
}

/**
 * Interface for event search parameters
 */
export interface EventSearchParams {
  query?: string | undefined;
  type?: EventType | undefined;
  status?: EventStatus | undefined;
  visibility?: EventVisibility | undefined;
  categories?: string[] | undefined;
  tags?: string[] | undefined;
  startDateFrom?: string | undefined;
  startDateTo?: string | undefined;
  location?: {
    latitude: number | undefined;
    longitude: number;
    radius: number; // in kilometers
  };
  creatorId?: string;
  organizerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'popularity' | 'relevance';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Interface for event registration
 */
export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  ticketTierId: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'canceled' | 'refunded';
  attendeeInfo: {
    name: string;
    email: string;
    phone?: string | undefined;
    customFields?: Record<string, any> | undefined;
  }[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for event analytics
 */
export interface EventAnalytics {
  eventId: string;
  views: number;
  registrations: number;
  attendees: number;
  revenue: number;
  currency: string;
  ticketSalesByTier: Record<
    string,
    {
      quantity: number;
      revenue: number;
    }
  >;
  registrationsByDate: Record<string, number>;
  conversionRate: number;
  referralSources: Record<string, number>;
}

/**
 * Interface for event stream settings
 */
export interface EventStreamSettings {
  eventId: string;
  isEnabled: boolean;
  provider: 'livekit' | 'custom';
  roomName?: string | undefined;
  customRtmpUrl?: string | undefined;
  recordStream: boolean;
  allowChat: boolean;
  allowQuestions: boolean;
  allowPolls: boolean;
  moderatorIds: string[];
  maxParticipants?: number | undefined;
  quality: 'low' | 'standard' | 'high' | 'hd';
}

/**
 * Interface for event stream participant
 */
export interface EventStreamParticipant {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  role: 'host' | 'moderator' | 'attendee';
  joinedAt: string;
  leftAt?: string | undefined;
  isActive: boolean;
  deviceInfo?: {
    browser: string | undefined;
    os: string;
    device: string;
  };
}

/**
 * Interface for event maintenance settings
 */
export interface EventMaintenanceSettings {
  eventId: string;
  autoArchiveAfterDays: number;
  sendFollowUpAfterHours?: number | undefined;
  followUpTemplateId?: string | undefined;
  collectFeedback: boolean;
  feedbackFormId?: string | undefined;
}

/**
 * Interface for event search result
 */
export interface EventSearchResult {
  events: Event[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
