export interface VenueLocation {
  id: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude?: number | undefined;
  longitude?: number | undefined;
  neighborhood?: string | undefined;
}

export interface VenuePricing {
  base_price_per_hour: number;
  minimum_booking_hours: number;
  maximum_booking_hours: number;
  weekend_multiplier: number;
  holiday_multiplier: number;
  security_deposit: number;
  cleaning_fee: number;
  service_fee_percentage: number;
}

export interface VenueAvailability {
  available_days: string[];
  available_hours: {
    start: string;
    end: string;
  };
  blackout_dates: string[];
  advance_booking_days: number;
  instant_booking_enabled: boolean;
}

export interface VenueMedia {
  cover_image: string;
  gallery_images: string[];
  virtual_tour_url?: string | undefined;
  video_tour_url?: string | undefined;
}

export interface VenueAmenities {
  basic: string[];
  premium: string[];
  accessibility: string[];
  technology: string[];
  catering: string[];
}

export interface VenuePolicies {
  cancellation_policy: 'flexible' | 'moderate' | 'strict';
  house_rules: string[];
  additional_terms: string;
  smoking_allowed: boolean;
  pets_allowed: boolean;
  children_welcome: boolean;
}

export interface VenueHost {
  id: string;
  name: string;
  avatar_url: string;
  bio: string;
  response_rate: number;
  response_time_hours: number;
  joined_date: string;
  verified: boolean;
  total_venues: number;
  total_bookings: number;
}

export interface VenueReview {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  rating: number;
  comment: string;
  event_type: string;
  booking_date: string;
  created_at: string;
  helpful_count: number;
  images?: string[] | undefined;
}

export interface VenueAnalytics {
  total_views: number;
  total_bookings: number;
  booking_conversion_rate: number;
  average_rating: number;
  total_reviews: number;
  revenue_last_30_days: number;
  occupancy_rate: number;
}

export interface EnhancedVenue {
  id: string;
  name: string;
  description: string;
  venue_type: string;
  capacity: number;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  featured: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;

  // Related entities
  location: VenueLocation;
  pricing: VenuePricing;
  availability: VenueAvailability;
  media: VenueMedia;
  amenities: VenueAmenities;
  policies: VenuePolicies;
  host: VenueHost;
  reviews: VenueReview[];
  analytics: VenueAnalytics;
}

export interface VenueSearchFilters {
  query: string;
  location: string;
  venue_type: string;
  capacity_min: number;
  capacity_max: number;
  price_min: number;
  price_max: number;
  amenities: string[];
  available_date: string;
  instant_booking: boolean;
  sort_by: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'distance' | 'newest';
  radius_km: number;
}

export interface VenueBooking {
  id: string;
  venue_id: string;
  user_id: string;
  event_title: string;
  event_type: string;
  event_description: string;
  start_datetime: string;
  end_datetime: string;
  guest_count: number;
  total_hours: number;

  // Pricing breakdown
  base_cost: number;
  additional_fees: number;
  tax_amount: number;
  total_amount: number;

  // Contact and requirements
  contact_phone: string;
  contact_email: string;
  special_requests: string;
  setup_requirements: string;

  // Status and workflow
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
  host_response: string;
  host_response_at?: string | undefined;

  created_at: string;
  updated_at: string;
}

export interface VenueFormData {
  // Basic Information
  name: string;
  description: string;
  venue_type: string;
  capacity: number;

  // Location
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;

  // Pricing
  base_price_per_hour: number;
  minimum_booking_hours: number;
  security_deposit: number;
  cleaning_fee: number;

  // Amenities and Features
  amenities: string[];
  accessibility_features: string[];

  // Media
  cover_image?: File | undefined;
  gallery_images: File[];

  // Policies
  house_rules: string[];
  cancellation_policy: string;

  // Contact
  contact_email: string;
  contact_phone: string;

  // Availability
  available_days: string[];
  available_hours_start: string;
  available_hours_end: string;
  instant_booking_enabled: boolean;

  // Terms
  terms_accepted: boolean;
}

export type VenueListingStep =
  | 'basic_info'
  | 'location'
  | 'media'
  | 'amenities'
  | 'pricing'
  | 'availability'
  | 'policies'
  | 'review';