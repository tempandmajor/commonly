export interface CommunitySubscriptionSettings {
  enabled: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  recurringEvent: {
    title: string;
    description: string;
    schedule: 'monthly' | 'weekly' | 'bi-weekly';
    dayOfMonth?: number | undefined; // e.g., 15 for 15th of each month
    dayOfWeek?: number | undefined; // 0-6 for Sunday-Saturday (for weekly events)
    time: string; // HH:MM format
    duration: number; // in minutes
    location: string;
    isVirtual: boolean;
    platform?: string | undefined; // Zoom, Teams, etc.
    maxCapacity?: number | undefined;
  };
  benefits: string[];
  autoCreateEvents: boolean; // Whether to automatically create recurring events
  nextEventDate?: Date;
  stripeProductId?: string; // For Stripe subscription management
}

export interface CommunitySubscriber {
  id: string;
  userId: string;
  communityId: string;
  subscriptionType: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  startDate: Date;
  endDate?: Date | undefined;
  nextBillingDate: Date;
  stripeSubscriptionId?: string | undefined;
  createdAt: Date;
  updatedAt?: Date | undefined;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt?: Date | undefined;
  joinRequests?: unknown[] | undefined;

  // Additional properties used throughout the codebase
  creatorId: string;
  members?: string[] | undefined;
  admins?: string[] | undefined;
  imageUrl?: string | undefined;
  coverImage?: string | undefined;
  tags?: string[] | undefined;
  location?: {
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
  };
  category?: string;

  // New subscription settings
  subscriptionSettings?: CommunitySubscriptionSettings;
  subscriberCount?: number;
  isUserSubscribed?: boolean; // For current user's subscription status
}
