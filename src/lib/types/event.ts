import { EVENT_STATUS } from '@/lib/constants';

export enum EventType {
  InPerson = 'In-Person',
  VirtualEvent = 'Virtual Event',
  Hybrid = 'Hybrid',
  SingleEvent = 'Single Event',
  MultiEvent = 'Multi Event',
  Tour = 'Tour',
}

export enum EventCategory {
  MusicFestivals = 'Music Festivals',
  FoodWineFestivals = 'Food & Wine Festivals',
  FilmFestivals = 'Film Festivals',
  ArtExhibitions = 'Art Exhibitions',
  CulturalFestivals = 'Cultural Festivals',
  TechStartupEvents = 'Tech & Startup Events',
  BusinessConferences = 'Business Conferences',
  EducationalWorkshops = 'Educational Workshops',
  FitnessWellnessEvents = 'Fitness & Wellness Events',
  SportsEvents = 'Sports Events',
  CharitableFundraisers = 'Charitable Fundraisers',
  ComedyShows = 'Comedy Shows',
  PerformingArts = 'Performing Arts',
  PopupMarkets = 'Popup Markets',
  FashionEvents = 'Fashion Events',
}

export enum StreamStatus {
  Scheduled = 'scheduled',
  Live = 'live',
  Ended = 'ended',
  Cancelled = 'cancelled',
}

export enum StreamQuality {
  Low = 'low',
  Standard = 'standard',
  High = 'high',
}

export interface StreamSchedule {
  startTime: Date | string;
  estimatedDuration: number;
  isRecurring?: boolean | undefined;
  recurrencePattern?: 'daily' | undefined| 'weekly' | 'monthly';
  recurringEndDate?: Date | undefined| string;
}

export interface StreamConfiguration {
  quality: keyof typeof StreamQuality;
  recordingEnabled?: boolean | undefined;
  chatEnabled?: boolean | undefined;
  audienceInteractionEnabled?: boolean | undefined;
}

export interface EventReport {
  id: string;
  eventId: string;
  eventTitle?: string | undefined;
  reason: string;
  reportedAt: Date;
  status: 'pending' | 'resolved' | 'dismissed';
  resolution?: string | undefined;
  reportedBy: {
    id: string;
    name: string;
  };
}

export interface Sponsor {
  id: string;
  name: string;
  logo?: string | undefined;
  website?: string | undefined;
}

export interface SponsorshipTier {
  id: string;
  name: string;
  price: number;
  description?: string | undefined;
  benefits: string[];
  maxSponsors?: number | undefined;
  currentSponsors?: number | undefined;
  sponsors?: Sponsor[] | undefined;
}

export interface EventCollaborator {
  id: string; // This is a required field
  email: string; // This is a required field
  name?: string | undefined;
  role: string;
  status: 'pending' | 'accepted' | 'declined';
  isExistingUser?: boolean | undefined;
}

// Define EventStatus type based on constants
export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS] | 'scheduled';

export interface Event {
  id: string;
  title: string;
  description?: string | undefined;
  short_description?: string | undefined;
  shortDescription?: string | undefined;
  location: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  category?: EventCategory | undefined;
  type?: EventType | undefined;
  enhanced_type?: string | undefined;
  enhancedType?: string | undefined;
  organizer?: {
    id: string | undefined;
    name: string;
  };
  organizerId?: string;
  organizer_name?: string;
  bannerImage?: string;
  banner_image?: string;
  capacity?: number;
  max_capacity?: number;
  attendeeCount?: number;
  attendees_count?: number;
  isFree?: boolean;
  is_free?: boolean;
  price?: number;
  currentAmount?: number;
  current_amount?: number;
  targetAmount?: number;
  target_amount?: number;
  isAllOrNothing?: boolean;
  is_all_or_nothing?: boolean;

  campaignDeadline?: string | Date;
  campaign_deadline?: string | Date;
  pledgeDeadline?: Date | string | { toDate(): Date };
  pledge_deadline?: string | Date;
  campaignDuration?: string;
  campaign_duration?: string;
  isDeadlinePassed?: boolean;
  goalReached?: boolean;
  daysRemaining?: number | null;

  sponsorshipEnabled?: boolean;
  sponsorship_enabled?: boolean;
  sponsorshipTiers?: SponsorshipTier[];
  sponsorship_tiers?: SponsorshipTier[];

  referral_enabled?: boolean;
  referral_commission_amount?: number;
  referral_commission_type?: 'fixed' | 'percentage';
  referral_terms?: string;

  tourDetails?: unknown;
  tour_details?: unknown;
  tourDates?: unknown[];
  tour_dates?: unknown[];

  virtualEventDetails?: unknown;
  virtual_event_details?: unknown;

  images?: string[];
  tags?: string[];
  isPrivate?: boolean;
  is_private?: boolean;
  is_public?: boolean;
  requiresApproval?: boolean;
  requires_approval?: boolean;
  ageRestriction?: number;
  age_restriction?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  maxTicketsPerPurchase?: number;
  max_tickets_per_purchase?: number;
  availableTickets?: number;
  available_tickets?: number;
  reservedTickets?: number;
  reserved_tickets?: number;
  ticketsSold?: number;
  tickets_sold?: number;
  pledges?: number;
  totalPledged?: number;
  fundingGoal?: number;
  fundingStatus?: 'in_progress' | 'funded' | 'failed';

  ticketSettings?: unknown;
  ticket_settings?: unknown;

  image_url?: string;
  creator_id?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TourDate {
  id: string;
  date: Date | string;
  startTime: string; // HH:MM format
  endTime?: string | undefined; // HH:MM format
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    venueId?: string | undefined; // Reference to venue if it exists in system
  };
  ticketPrice?: number;
  capacity?: number;
  soldOut?: boolean;
  specialNotes?: string;
  status: 'scheduled' | 'on_sale' | 'sold_out' | 'cancelled' | 'completed';
}

export interface TourDetails {
  tourName: string;
  tourDescription?: string | undefined;
  tourDates: TourDate[];
  tourType: 'national' | 'international' | 'regional' | 'local';
  tourManager?: {
    name: string | undefined;
    email: string;
    phone?: string | undefined;
  };
  merchandiseAvailable?: boolean;
  vipPackagesAvailable?: boolean;
  totalTourCapacity?: number;
  estimatedTourRevenue?: number;
}
