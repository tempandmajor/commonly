/**
 * Community service type definitions
 */
import { Database } from '@/lib/database.types';

// Base types from database
export type Community = Database['public']['Tables']['communities']['Row'];
export type CommunityInsert = Database['public']['Tables']['communities']['Insert'];
export type CommunityUpdate = Database['public']['Tables']['communities']['Update'];

export type CommunityMember = Database['public']['Tables']['community_members']['Row'];
export type CommunityMemberInsert = Database['public']['Tables']['community_members']['Insert'];

export interface CommunityWithMemberCount extends Community {
  member_count: number;
  // Add subscription fields that might not be in the base type
  subscription_enabled?: boolean;
  monthly_price_cents?: number;
  yearly_price_cents?: number;
  subscription_benefits?: string[];
}

export interface CommunityWithMemberStatus extends CommunityWithMemberCount {
  is_member: boolean;
  role?: string;
}

export interface PaginatedCommunities {
  items: CommunityWithMemberCount[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CommunitySearchParams {
  query?: string | undefined;
  tags?: string[] | undefined;
  location?: string | undefined;
  isPrivate?: boolean | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  sortBy?: 'created_at' | undefined| 'name' | 'member_count';
  sortDirection?: 'asc' | undefined| 'desc';
}

export interface CommunitySubscriptionSettings {
  communityId: string;
  isSubscriptionEnabled: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  description?: string | undefined;
  stripeProductId?: string | undefined;
  stripePriceIdMonthly?: string | undefined;
  stripePriceIdYearly?: string | undefined;
}

export interface CommunitySubscriber {
  id: string;
  communityId: string;
  userId: string;
  subscriptionType: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}
