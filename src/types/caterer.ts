export interface CatererLocation {
  id: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude?: number | undefined;
  longitude?: number | undefined;
  service_radius_km: number;
  neighborhood?: string | undefined;
}

export interface CatererContact {
  business_email: string;
  business_phone: string;
  website_url?: string | undefined;
  social_media?: {
    instagram?: string | undefined;
    facebook?: string | undefined;
    twitter?: string | undefined;
  };
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface CatererPricing {
  base_price_per_person: number;
  minimum_order_amount: number;
  maximum_guest_capacity: number;

  price_range: string;
  deposit_percentage: number;
  cancellation_fee?: number | undefined;
  service_fee_percentage: number;
  delivery_fee?: number | undefined;
  setup_fee?: number | undefined;
  additional_fees: Array<{ name: string; amount: number }>;
}

export interface CatererCapacity {
  minimum_guests: number;
  maximum_guests: number;
  recommended_group_size: number;
  advance_booking_days: number;
  preparation_time_hours: number;
}

export interface CatererMedia {
  cover_image?: string | undefined;
  gallery_images: string[];
  logo_image?: string | undefined;
  menu_images: string[];
  portfolio_images: string[];
  video_url?: string | undefined;
  virtual_tour_url?: string | undefined;
}

export interface CatererMenuItem {
  id: string;
  name: string;
  description: string;
  price_per_person?: number | undefined;
  category: string;
  dietary_tags: string[];
  preparation_time_minutes: number;
  minimum_order_quantity?: number | undefined;
  available: boolean;
  seasonal?: boolean | undefined;
  image_url?: string | undefined;
  allergens: string[];
}

export interface CatererMenu {
  id: string;
  name: string;
  description: string;
  menu_type: 'buffet' | 'plated' | 'family_style' | 'cocktail' | 'box_lunch' | 'custom';
  price_per_person: number;
  minimum_guests: number;
  items: CatererMenuItem[];
  dietary_accommodations: string[];
  service_style: string[];
  setup_requirements: string;
  available_days: string[];
  seasonal: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatererAvailability {
  operating_days: string[];
  operating_hours: {
    start: string;
    end: string;
  };
  blackout_dates: string[];
  holiday_availability: boolean;
  weekend_surcharge_percentage: number;
  holiday_surcharge_percentage: number;
  booking_lead_time_days: number;
  same_day_booking_enabled: boolean;
  instant_booking_enabled: boolean;
}

export interface CatererPolicies {
  cancellation_policy: 'flexible' | 'moderate' | 'strict';
  deposit_policy: string;
  payment_terms: string;
  dietary_accommodations: string[];
  allergen_policy: string;
  alcohol_service: boolean;
  setup_breakdown_included: boolean;
  additional_terms: string;
  liability_insurance: boolean;
  health_permit_number?: string | undefined;
}

export interface CatererVerification {
  business_license_verified: boolean;
  insurance_verified: boolean;
  health_permit_verified: boolean;
  identity_verified: boolean;
  background_check_completed: boolean;
  verification_date?: string | undefined;
  verification_notes?: string | undefined;
  trust_score: number;
}

export interface CatererOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  avatar_url?: string | undefined;
  years_experience: number;
  certifications: string[];
  response_rate: number;
  response_time_hours: number;
  joined_date: string;
  verified: boolean;
  total_events: number;
  total_revenue: number;
}

export interface CatererReview {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string | undefined;
  rating: number;
  comment: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  created_at: string;
  helpful_count: number;
  images?: string[] | undefined;
  response?: {
    message: string | undefined;
    response_date: string;
  };
}

export interface CatererAnalytics {
  total_views: number;
  total_inquiries: number;
  total_bookings: number;
  inquiry_conversion_rate: number;
  booking_conversion_rate: number;
  average_rating: number;
  total_reviews: number;
  revenue_last_30_days: number;
  repeat_customer_rate: number;
  average_order_value: number;
  peak_booking_months: string[];
}

export interface EnhancedCaterer {
  id: string;
  name: string;
  description: string;
  business_type: 'individual' | 'company' | 'restaurant' | 'food_truck';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  featured: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;

  // Core Business Information
  cuisine_types: string[];
  service_types: string[];
  dietary_accommodations: string[];
  specialties: string[];

  // Location & Contact
  location: CatererLocation;
  contact: CatererContact;

  // Pricing & Capacity
  pricing: CatererPricing;
  capacity: CatererCapacity;

  // Content & Media
  media: CatererMedia;
  menus: CatererMenu[];

  // Operations
  availability: CatererAvailability;
  policies: CatererPolicies;

  // Platform Features
  verification: CatererVerification;
  owner: CatererOwner;
  reviews: CatererReview[];
  analytics: CatererAnalytics;
}

export interface CatererSearchFilters {
  query: string;
  location: string;
  cuisine_types: string[];
  service_types: string[];
  dietary_accommodations: string[];
  price_range: string[];
  guest_count_min: number;
  guest_count_max: number;
  event_date: string;
  event_type: string;
  distance_km: number;
  rating_min: number;
  instant_booking: boolean;
  featured_only: boolean;
  verified_only: boolean;
  sort_by: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'distance' | 'newest' | 'popular';
}

export interface CatererBooking {
  id: string;
  caterer_id: string;
  user_id: string;

  // Event Details
  event_title: string;
  event_type: string;
  event_description: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  guest_count: number;

  // Location
  event_address: string;
  event_city: string;
  event_state: string;
  setup_location: 'indoor' | 'outdoor' | 'both';
  venue_type: string;

  // Service Details
  menu_selections: {
    menu_id: string;
    menu_name: string;
    guest_count: number;
    customizations: string;
  }[];
  service_style: string;
  dietary_requests: string[];
  special_requests: string;
  alcohol_service_requested: boolean;

  // Pricing
  base_cost: number;
  additional_fees: number;
  tax_amount: number;
  total_amount: number;

  // Contact Information
  contact_name: string;
  contact_phone: string;
  contact_email: string;

  // Booking Management
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
  caterer_response?: string;
  caterer_response_at?: string;
  confirmation_number?: string;

  // Timeline
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
}

export interface CatererFormData {
  // Basic Information
  name: string;
  description: string;
  business_type: string;
  cuisine_types: string[];
  service_types: string[];
  specialties: string[];

  // Location & Contact
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  service_radius_km: number;
  business_email: string;
  business_phone: string;
  website_url?: string | undefined;

  // Capacity & Pricing
  minimum_guests: number;
  maximum_guests: number;
  base_price_per_person: number;
  minimum_order_amount: number;
  price_range: string;

  // Media
  cover_image?: File | undefined;
  gallery_images: File[];
  menu_images: File[];

  // Menus
  sample_menus: {
    name: string;
    description: string;
    price_per_person: number;
    menu_type: string;
  }[];

  // Policies & Operations
  dietary_accommodations: string[];
  cancellation_policy: string;
  deposit_percentage: number;
  advance_booking_days: number;

  // Verification
  business_license?: File;
  insurance_certificate?: File;
  health_permit?: File;

  // Terms
  terms_accepted: boolean;
  privacy_accepted: boolean;
}

export type CatererListingStep =
  | 'basic_info'
  | 'location'
  | 'services'
  | 'pricing'
  | 'menus'
  | 'media'
  | 'policies'
  | 'verification'
  | 'review';

// Event Types for Catering
export const EVENT_TYPES = [
  'Wedding',
  'Corporate Event',
  'Birthday Party',
  'Anniversary',
  'Baby Shower',
  'Graduation',
  'Holiday Party',
  'Fundraiser',
  'Conference',
  'Workshop',
  'Cocktail Reception',
  'Rehearsal Dinner',
  'Memorial Service',
  'Family Reunion',
  'Business Meeting',
  'Product Launch',
  'Networking Event',
  'Other',
] as const;

// Cuisine Types
export const CUISINE_TYPES = [
  'American',
  'Italian',
  'Mexican',
  'Chinese',
  'Indian',
  'Mediterranean',
  'Japanese',
  'Thai',
  'French',
  'Greek',
  'Lebanese',
  'Korean',
  'Vietnamese',
  'Ethiopian',
  'Moroccan',
  'Peruvian',
  'Brazilian',
  'Caribbean',
  'Southern',
  'BBQ',
  'Fusion',
  'Vegetarian',
  'Vegan',
  'Kosher',
  'Halal',
  'Other',
] as const;

// Service Types
export const SERVICE_TYPES = [
  'Full Service',
  'Drop-off',
  'Buffet',
  'Plated',
  'Family Style',
  'Cocktail Reception',
  'BBQ',
  'Food Truck',
  'Corporate Catering',
  'Box Lunch',
  'Breakfast Catering',
  'Lunch Catering',
  'Dinner Catering',
  'Brunch Catering',
  'Dessert Catering',
  'Bar Service',
  'Coffee Service',
] as const;

// Dietary Accommodations
export const DIETARY_ACCOMMODATIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Kosher',
  'Halal',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Low-Sodium',
  'Sugar-Free',
  'Organic',
  'Farm-to-Table',
  'Locally Sourced',
] as const;

export interface CatererCapacity {
  minimum_guests: number;
  maximum_guests: number;
  recommended_group_size: number;
  advance_booking_days: number;
  preparation_time_hours: number;
}

export interface CatererMedia {
  cover_image?: string | undefined;
  gallery_images: string[];
  logo_image?: string | undefined;
  menu_images: string[];
  portfolio_images: string[];
  video_url?: string | undefined;
  virtual_tour_url?: string | undefined;
}

export interface CatererMenuItem {
  id: string;
  name: string;
  description: string;
  price_per_person?: number | undefined;
  category: string;
  dietary_tags: string[];
  preparation_time_minutes: number;
  minimum_order_quantity?: number | undefined;
  available: boolean;
  seasonal?: boolean | undefined;
  image_url?: string | undefined;
  allergens: string[];
}

export interface CatererMenu {
  id: string;
  name: string;
  description: string;
  menu_type: 'buffet' | 'plated' | 'family_style' | 'cocktail' | 'box_lunch' | 'custom';
  price_per_person: number;
  minimum_guests: number;
  items: CatererMenuItem[];
  dietary_accommodations: string[];
  service_style: string[];
  setup_requirements: string;
  available_days: string[];
  seasonal: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatererAvailability {
  operating_days: string[];
  operating_hours: {
    start: string;
    end: string;
  };
  blackout_dates: string[];
  holiday_availability: boolean;
  weekend_surcharge_percentage: number;
  holiday_surcharge_percentage: number;
  booking_lead_time_days: number;
  same_day_booking_enabled: boolean;
  instant_booking_enabled: boolean;
}

export interface CatererPolicies {
  cancellation_policy: 'flexible' | 'moderate' | 'strict';
  deposit_policy: string;
  payment_terms: string;
  dietary_accommodations: string[];
  allergen_policy: string;
  alcohol_service: boolean;
  setup_breakdown_included: boolean;
  additional_terms: string;
  liability_insurance: boolean;
  health_permit_number?: string | undefined;
}

export interface CatererVerification {
  business_license_verified: boolean;
  insurance_verified: boolean;
  health_permit_verified: boolean;
  identity_verified: boolean;
  background_check_completed: boolean;
  verification_date?: string | undefined;
  verification_notes?: string | undefined;
  trust_score: number;
}

export interface CatererOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  avatar_url?: string | undefined;
  years_experience: number;
  certifications: string[];
  response_rate: number;
  response_time_hours: number;
  joined_date: string;
  verified: boolean;
  total_events: number;
  total_revenue: number;
}

export interface CatererReview {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string | undefined;
  rating: number;
  comment: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  created_at: string;
  helpful_count: number;
  images?: string[] | undefined;
  response?: {
    message: string | undefined;
    response_date: string;
  };
}

export interface CatererAnalytics {
  total_views: number;
  total_inquiries: number;
  total_bookings: number;
  inquiry_conversion_rate: number;
  booking_conversion_rate: number;
  average_rating: number;
  total_reviews: number;
  revenue_last_30_days: number;
  repeat_customer_rate: number;
  average_order_value: number;
  peak_booking_months: string[];
}

export interface EnhancedCaterer {
  id: string;
  name: string;
  description: string;
  business_type: 'individual' | 'company' | 'restaurant' | 'food_truck';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  featured: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;

  // Core Business Information
  cuisine_types: string[];
  service_types: string[];
  dietary_accommodations: string[];
  specialties: string[];

  // Location & Contact
  location: CatererLocation;
  contact: CatererContact;

  // Pricing & Capacity
  pricing: CatererPricing;
  capacity: CatererCapacity;

  // Content & Media
  media: CatererMedia;
  menus: CatererMenu[];

  // Operations
  availability: CatererAvailability;
  policies: CatererPolicies;

  // Platform Features
  verification: CatererVerification;
  owner: CatererOwner;
  reviews: CatererReview[];
  analytics: CatererAnalytics;
}

export interface CatererSearchFilters {
  query: string;
  location: string;
  cuisine_types: string[];
  service_types: string[];
  dietary_accommodations: string[];
  price_range: string[];
  guest_count_min: number;
  guest_count_max: number;
  event_date: string;
  event_type: string;
  distance_km: number;
  rating_min: number;
  instant_booking: boolean;
  featured_only: boolean;
  verified_only: boolean;
  sort_by: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'distance' | 'newest' | 'popular';
}

export interface CatererBooking {
  id: string;
  caterer_id: string;
  user_id: string;

  // Event Details
  event_title: string;
  event_type: string;
  event_description: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  guest_count: number;

  // Location
  event_address: string;
  event_city: string;
  event_state: string;
  setup_location: 'indoor' | 'outdoor' | 'both';
  venue_type: string;

  // Service Details
  menu_selections: {
    menu_id: string;
    menu_name: string;
    guest_count: number;
    customizations: string;
  }[];
  service_style: string;
  dietary_requests: string[];
  special_requests: string;
  alcohol_service_requested: boolean;

  // Pricing
  base_cost: number;
  additional_fees: number;
  tax_amount: number;
  total_amount: number;

  // Contact Information
  contact_name: string;
  contact_phone: string;
  contact_email: string;

  // Booking Management
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded';
  caterer_response?: string;
  caterer_response_at?: string;
  confirmation_number?: string;

  // Timeline
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
}

export interface CatererFormData {
  // Basic Information
  name: string;
  description: string;
  business_type: string;
  cuisine_types: string[];
  service_types: string[];
  specialties: string[];

  // Location & Contact
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  service_radius_km: number;
  business_email: string;
  business_phone: string;
  website_url?: string | undefined;

  // Capacity & Pricing
  minimum_guests: number;
  maximum_guests: number;
  base_price_per_person: number;
  minimum_order_amount: number;
  price_range: string;

  // Media
  cover_image?: File | undefined;
  gallery_images: File[];
  menu_images: File[];

  // Menus
  sample_menus: {
    name: string;
    description: string;
    price_per_person: number;
    menu_type: string;
  }[];

  // Policies & Operations
  dietary_accommodations: string[];
  cancellation_policy: string;
  deposit_percentage: number;
  advance_booking_days: number;

  // Verification
  business_license?: File;
  insurance_certificate?: File;
  health_permit?: File;

  // Terms
  terms_accepted: boolean;
  privacy_accepted: boolean;
}

export type CatererListingStep =
  | 'basic_info'
  | 'location'
  | 'services'
  | 'pricing'
  | 'menus'
  | 'media'
  | 'policies'
  | 'verification'
  | 'review';

