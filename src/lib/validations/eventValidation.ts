import * as z from 'zod';
import { EventCategory, EventType, StreamQuality, StreamStatus } from '@/lib/types/event';
import { commonValidations } from './shared';

// Enums for better type safety
export enum RecurrencePattern {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
}

export enum CollaboratorRole {
  CoOrganizer = 'co-organizer',
  Speaker = 'speaker',
  Moderator = 'moderator',
  Assistant = 'assistant',
}

export enum CollaboratorStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
}

// Sponsorship tier schema
export const sponsorshipTierSchema = z.object({
  id: z.string(),
  name: commonValidations.requiredString('Tier name', 2, 50),
  price: commonValidations.price,
  description: commonValidations.optionalString(200),
  benefits: z
    .array(commonValidations.requiredString('Benefit', 5, 100))
    .min(1, 'Add at least one benefit')
    .max(10, 'Maximum 10 benefits per tier'),
  maxSponsors: z.number().int().positive().optional(),
  currentSponsors: z.number().int().nonnegative().default(0),
  sponsors: z.array(z.any()).optional(),
});

// Add deadline validation and enhanced campaign settings
const campaignSettingsSchema = z
  .object({
    duration: z.enum(['15', '30', '45', '60', '90'], {
      required_error: 'Please select a campaign duration',
    }),
    deadlineDate: z.date({ required_error: 'Campaign deadline is required' }),
    autoExtendEnabled: z.boolean().default(false),
    reminderDays: z.array(z.number().int().positive()).default([7, 3, 1]),
  })
  .refine(
    data => {
      // Deadline should be in the future
      const now = new Date();
      return data.deadlineDate > now;
    },
    {
      message: 'Campaign deadline must be in the future',
      path: ['deadlineDate'],
    }
  );

// Enhanced referral settings with Stripe Connect requirement
const referralSettingsSchema = z
  .object({
    enabled: commonValidations.booleanWithDefault(false),
    commissionType: z.enum(['fixed', 'percentage']).default('fixed'),
    commissionAmount: z.number().min(0, 'Commission amount must be positive').optional(),
    terms: commonValidations.optionalString(500),
    maxReferrers: z.number().int().positive().optional(),
    requiresApproval: commonValidations.booleanWithDefault(false),
    stripeConnectRequired: commonValidations.booleanWithDefault(true),
    minimumPayoutAmount: z.number().min(5, 'Minimum payout must be at least $5').default(10),
  })
  .refine(
    data => {
      if (data.enabled && !data.commissionAmount) {
        return false;
      }
      return true;
    },
    {
      message: 'Commission amount is required when referrals are enabled',
      path: ['commissionAmount'],
    }
  )
  .refine(
    data => {
      if (
        data.enabled &&
        data.commissionType === 'percentage' &&
        data.commissionAmount &&
        data.commissionAmount > 50
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Percentage commission cannot exceed 50%',
      path: ['commissionAmount'],
    }
  );

// Enhanced event type enum
export enum EnhancedEventType {
  OneTime = 'one-time',
  Tour = 'tour',
  Series = 'series',
  Recurring = 'recurring',
  VirtualEvent = 'virtual',
  Hybrid = 'hybrid',
  Workshop = 'workshop',
  Conference = 'conference',
  Festival = 'festival',
  Meetup = 'meetup',
  Webinar = 'webinar',
  Livestream = 'livestream',
}

// Stream schedule schema
const streamScheduleSchema = z
  .object({
    startTime: z.date({ required_error: 'Stream start time is required' }),
    estimatedDuration: z
      .number()
      .int('Duration must be in minutes')
      .min(15, 'Minimum duration is 15 minutes')
      .max(480, 'Maximum duration is 8 hours'),
    isRecurring: commonValidations.booleanWithDefault(false),
    recurrencePattern: z.nativeEnum(RecurrencePattern).optional(),
    recurringEndDate: z.date().optional(),
  })
  .refine(
    data => {
      if (data.isRecurring && !data.recurrencePattern) {
        return false;
      }
      return true;
    },
    {
      message: 'Recurrence pattern is required for recurring events',
      path: ['recurrencePattern'],
    }
  );

// Stream configuration schema
const streamConfigurationSchema = z.object({
  quality: z.nativeEnum(StreamQuality).default(StreamQuality.Standard),
  recordingEnabled: commonValidations.booleanWithDefault(true),
  chatEnabled: commonValidations.booleanWithDefault(true),
  audienceInteractionEnabled: commonValidations.booleanWithDefault(true),
  waitingRoomEnabled: commonValidations.booleanWithDefault(false),
  maxViewers: z.number().int().positive().optional(),
});

// Virtual event details schema
const virtualEventDetailsSchema = z.object({
  platform: commonValidations.requiredString('Platform', 2, 50),
  url: commonValidations.url.optional(),
  hostInstructions: commonValidations.optionalString(1000),
  attendeeInstructions: commonValidations.optionalString(1000),
  streamSchedule: streamScheduleSchema.optional(),
  streamConfiguration: streamConfigurationSchema.optional(),
  streamStatus: z.nativeEnum(StreamStatus).optional(),
});

// Collaborator schema
const collaboratorSchema = z.object({
  id: z.string(),
  email: commonValidations.email,
  name: commonValidations.optionalString(50),
  role: z.nativeEnum(CollaboratorRole).default(CollaboratorRole.CoOrganizer),
  status: z.nativeEnum(CollaboratorStatus).default(CollaboratorStatus.Pending),
  isExistingUser: commonValidations.booleanWithDefault(false),
});

// Ticket settings schema
const ticketSettingsSchema = z
  .object({
    earlyBirdEnabled: commonValidations.booleanWithDefault(false),
    earlyBirdPrice: commonValidations.price.optional(),
    earlyBirdEndDate: z.date().optional(),
    groupDiscountEnabled: commonValidations.booleanWithDefault(false),
    groupDiscountMinSize: z.number().int().min(2).optional(),
    groupDiscountPercentage: z.number().min(5).max(50).optional(),
    refundPolicy: z.enum(['full', 'partial', 'none']).default('partial'),
    refundDeadlineDays: z.number().int().min(0).max(30).default(7),
  })
  .refine(
    data => {
      if (data.earlyBirdEnabled && (!data.earlyBirdPrice || !data.earlyBirdEndDate)) {
        return false;
      }
      return true;
    },
    {
      message: 'Early bird price and end date are required when early bird is enabled',
      path: ['earlyBirdEnabled'],
    }
  );

// Tour date schema
const tourDateSchema = z
  .object({
    id: z.string().default(() => crypto.randomUUID()),
    date: z.date({ required_error: 'Tour date is required' }),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format')
      .optional(),
    venue: z.object({
      name: commonValidations.requiredString('Venue name', 2, 100),
      address: commonValidations.requiredString('Venue address', 5, 200),
      city: commonValidations.requiredString('City', 2, 50),
      state: commonValidations.requiredString('State', 2, 50),
      country: commonValidations.requiredString('Country', 2, 50),
      venueId: z.string().optional(),
    }),
    ticketPrice: z.number().min(0, 'Ticket price cannot be negative').optional(),
    capacity: z.number().int().min(1, 'Capacity must be at least 1').optional(),
    soldOut: z.boolean().default(false),
    specialNotes: z.string().max(500, 'Special notes cannot exceed 500 characters').optional(),
    status: z
      .enum(['scheduled', 'on_sale', 'sold_out', 'cancelled', 'completed'])
      .default('scheduled'),
  })
  .refine(
    data => {
      // End time must be after start time if provided
      if (data.endTime) {
        const [startHour, startMin] = data.startTime.split(':').map(Number);
        const [endHour, endMin] = data.endTime.split(':').map(Number);
        if (startHour === undefined || startMin === undefined || endHour === undefined || endMin === undefined) {
          return false;
        }
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return endMinutes > startMinutes;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

// Tour details schema
const tourDetailsSchema = z
  .object({
    tourName: commonValidations.requiredString('Tour name', 3, 100),
    tourDescription: z
      .string()
      .max(1000, 'Tour description cannot exceed 1000 characters')
      .optional(),
    tourDates: z
      .array(tourDateSchema)
      .min(2, 'A tour must have at least 2 dates')
      .max(50, 'A tour cannot have more than 50 dates'),
    tourType: z.enum(['national', 'international', 'regional', 'local'], {
      required_error: 'Please select a tour type',
    }),
    tourManager: z
      .object({
        name: commonValidations.requiredString('Tour manager name', 2, 50),
        email: z.string().email('Invalid email address'),
        phone: z.string().optional(),
      })
      .optional(),
    merchandiseAvailable: z.boolean().default(false),
    vipPackagesAvailable: z.boolean().default(false),
    totalTourCapacity: z.number().int().min(0).optional(),
    estimatedTourRevenue: z.number().min(0).optional(),
  })
  .refine(
    data => {
      // Tour dates should be in chronological order
      const dates = data.tourDates.map(td => new Date(td.date));
      for (let i = 1; i < dates.length; i++) {
        const currentDate = dates[i];
        const previousDate = dates[i - 1];
        if (currentDate && previousDate && currentDate < previousDate) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Tour dates should be in chronological order',
      path: ['tourDates'],
    }
  );

// Main event form schema
export const eventFormSchema = z
  .object({
    // Basic Information
    title: commonValidations.requiredString('Title', 3, 100),
    shortDescription: commonValidations.requiredString('Short description', 10, 200),
    description: commonValidations.requiredString('Description', 20, 5000),
    tags: z
      .array(z.string().min(1).max(30))
      .min(1, 'Add at least one tag')
      .max(10, 'Maximum 10 tags allowed'),

    // Categorization
    category: z.nativeEnum(EventCategory, {
      required_error: 'Please select a category',
    }),
    type: z.nativeEnum(EventType, {
      required_error: 'Please select an event type',
    }),
    enhancedType: z.nativeEnum(EnhancedEventType, {
      required_error: 'Please select a specific event type',
    }),

    // Location & Virtual Settings
    location: commonValidations.requiredString('Location', 3, 200),
    venueId: z.string().optional(),
    virtualEventDetails: virtualEventDetailsSchema.optional(),

    // Tour Details (for tour events)
    tourDetails: tourDetailsSchema.optional(),

    // Date & Time
    startDate: z.date({ required_error: 'Start date is required' }),
    endDate: z.date().optional().nullable(),
    timezone: z.string().default(Intl.DateTimeFormat().resolvedOptions().timeZone),

    // Pricing & Capacity
    isFree: commonValidations.booleanWithDefault(false),
    price: commonValidations.price.optional(),
    capacity: z
      .number()
      .int('Capacity must be a whole number')
      .positive('Capacity must be greater than 0')
      .optional(),
    maxTicketsPerPurchase: z
      .number()
      .int('Must be a whole number')
      .min(1, 'Minimum 1 ticket per purchase')
      .max(10, 'Maximum 10 tickets per purchase')
      .default(4),

    // Enhanced Funding & Campaign
    targetAmount: commonValidations.price,
    isAllOrNothing: commonValidations.booleanWithDefault(true), // Default to true for new system
    campaignSettings: campaignSettingsSchema,
    stripeConnectRequired: commonValidations.booleanWithDefault(true),

    // Media
    bannerImage: commonValidations.imageUrl,
    images: z
      .array(commonValidations.imageUrl)
      .max(10, 'Maximum 10 additional images')
      .optional()
      .default([]),

    // Settings & Restrictions
    isPrivate: commonValidations.booleanWithDefault(false),
    ageRestriction: z.number().int('Age must be a whole number').min(0).max(21).optional(),
    requiresApproval: commonValidations.booleanWithDefault(false),

    // Ticketing
    ticketSettings: ticketSettingsSchema.optional(),

    // Sponsorship
    sponsorshipEnabled: commonValidations.booleanWithDefault(false),
    sponsorshipTiers: z.array(sponsorshipTierSchema).optional(),

    // Enhanced Referral System
    referralSettings: referralSettingsSchema.optional(),

    // Community
    communityId: z.string().optional(),
    communityName: z.string().optional(),

    // Collaborators
    collaborators: z.array(collaboratorSchema).default([]),

    // SEO
    seoTitle: commonValidations.optionalString(70),
    seoDescription: commonValidations.optionalString(160),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
      .optional(),
  })
  .refine(
    data => {
      // End date must be after start date (for non-tour events)
      if (data.type !== EventType.Tour && data.endDate && data.endDate < data.startDate) {
        return false;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )
  .refine(
    data => {
      // Price is required if not free
      if (!data.isFree && !data.price) {
        return false;
      }
      return true;
    },
    {
      message: 'Price is required for paid events',
      path: ['price'],
    }
  )
  .refine(
    data => {
      // Campaign deadline must be before event start date
      if (data.campaignSettings.deadlineDate >= data.startDate) {
        return false;
      }
      return true;
    },
    {
      message: 'Campaign deadline must be before event start date',
      path: ['campaignSettings', 'deadlineDate'],
    }
  )
  .refine(
    data => {
      // Virtual event details required for virtual/hybrid events
      if (
        (data.type === EventType.VirtualEvent || data.type === EventType.Hybrid) &&
        !data.virtualEventDetails
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Virtual event details are required for virtual/hybrid events',
      path: ['virtualEventDetails'],
    }
  )
  .refine(
    data => {
      // Tour details required for tour events
      if (data.type === EventType.Tour && !data.tourDetails) {
        return false;
      }
      return true;
    },
    {
      message: 'Tour details are required for tour events',
      path: ['tourDetails'],
    }
  )
  .refine(
    data => {
      // For tour events, location should match first tour date location
      if (
        data.type === EventType.Tour &&
        data.tourDetails &&
        data.tourDetails.tourDates.length > 0
      ) {
        // Allow flexibility in location format
        // We'll handle this validation in the UI
        return true;
      }
      return true;
    },
    {
      message: 'Location should reflect tour starting location',
      path: ['location'],
    }
  );

export type EventFormValues = z.infer<typeof eventFormSchema>;

// Default values for the form
export const eventFormDefaults: Partial<EventFormValues> = {
  category: EventCategory.MusicFestivals,
  type: EventType.InPerson,
  enhancedType: EnhancedEventType.OneTime,
  isFree: false,
  isPrivate: false,
  isAllOrNothing: true, // Default to true for all-or-nothing system
  requiresApproval: false,
  sponsorshipEnabled: false,
  stripeConnectRequired: true,
  maxTicketsPerPurchase: 4,
  tags: [],
  images: [],
  collaborators: [],
  campaignSettings: {
    duration: '30',
    deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    autoExtendEnabled: false,
    reminderDays: [7, 3, 1],
  },
  ticketSettings: {
    earlyBirdEnabled: false,
    groupDiscountEnabled: false,
    refundPolicy: 'partial',
    refundDeadlineDays: 7,
  },
  referralSettings: {
    enabled: false,
    commissionType: 'fixed',
    requiresApproval: false,
    stripeConnectRequired: true,
    minimumPayoutAmount: 10,
  },
  tourDetails: {
    tourName: '',
    tourType: 'local',
    tourDates: [],
    merchandiseAvailable: false,
    vipPackagesAvailable: false,
  },
};
