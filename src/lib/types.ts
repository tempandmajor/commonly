// Base types for the application
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude?: number | undefined;
  longitude?: number | undefined;
}

// Use the main AppUser from types/user.ts instead of duplicating
export type { AppUser } from '../types/user';

// Export User as an alias for AppUser for compatibility
export type User = import('../types/user').AppUser;

export interface Event extends BaseEntity {
  title: string;
  description?: string;
  creator_id?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  venue_id?: string;
  is_public?: boolean;
  max_capacity?: number;
  status?: string;
  image_url?: string;
  currentAmount?: number;
  targetAmount?: number;
  isAllOrNothing?: boolean;
  sponsorshipTiers?: SponsorshipTier[];
}

export interface SponsorshipTier {
  id: string;
  name: string;
  price: number;
  description?: string | undefined;
  benefits: string[];
  maxSponsors?: number | undefined;
  currentSponsors?: number | undefined;
}

export interface Product extends BaseEntity {
  name: string;
  description?: string;
  price_in_cents: number;
  creator_id?: string;
  event_id?: string;
  quantity_remaining?: number;
  is_digital?: boolean;
  status?: string;
  image_url?: string;
}

export interface Transaction extends BaseEntity {
  user_id?: string;
  transaction_type: string;
  amount_in_cents: number;
  status: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface Wallet extends BaseEntity {
  user_id?: string;
  balance_in_cents?: number;
  available_balance_in_cents?: number;
  pending_balance_in_cents?: number;
}

export interface Notification extends BaseEntity {
  user_id?: string;
  title: string;
  message: string;
  type?: string;
  status?: string;
  action_url?: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string | undefined;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details?: {
    name?: string;
    email?: string;
  };
}
