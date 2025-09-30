import type { Venue } from '@/lib/types/venue';

interface SupabaseVenue {
  id: string;
  name: string;
  description: string;
  address: unknown;
  capacity: unknown;
  amenities: string[];
  images?: string[] | undefined;
  price_per_hour?: number | undefined;
  minimum_hours: number;
  available_dates?: string[] | undefined;
  contact_info: unknown;
  rules?: string[] | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  rating?: number | undefined;
  location?: string | undefined;
  status?: 'pending' | undefined| 'active' | 'suspended';
  featured?: boolean | undefined;
  [key: string]: unknown;
}

// Convert application Venue model to Supabase format
export function toSupabase(venue: Venue): Record<string, unknown> {
  return {
    name: venue.name,
    description: venue.description,
    address: venue.address,
    capacity: venue.capacity,
    amenities: venue.amenities,
    images: venue.images,
    price_per_hour: venue.pricePerHour,
    minimum_hours: venue.minimumHours,
    available_dates: venue.availableDates,
    contact_info: venue.contactInfo,
    rules: venue.rules,
    created_at: venue.createdAt,
    updated_at: venue.updatedAt || new Date().toISOString(),
    rating: venue.rating,
    location: venue.location,
    status: venue.status,
    featured: venue.featured,
  };
}

// Convert Supabase data to application Venue model
export function fromSupabase(record: SupabaseVenue): Venue {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    address: record.address,
    capacity: record.capacity,
    amenities: record.amenities || [],
    images: record.images,
    pricePerHour: record.price_per_hour,
    minimumHours: record.minimum_hours,
    availableDates: record.available_dates,
    contactInfo: record.contact_info,
    rules: record.rules,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    rating: record.rating,
    location: record.location,
    status: record.status,
    featured: record.featured,
  };
}

// Process a list of venues from Supabase
export function processVenueList(venues: SupabaseVenue[]): Venue[] {
  return venues.map(venue => fromSupabase(venue));
}
