import { z } from 'zod';

export const venueSchema = z.object({
  name: z.string().min(3, 'Venue name must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  price: z.coerce.number().min(1, 'Price must be at least 1'),
  minHours: z.coerce.number().int().min(1, 'Minimum booking hours must be at least 1'),
  type: z.string().min(1, 'Please select a venue type'),
  street: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'Zip code is required'),
  country: z.string().min(2, 'Country is required'),
  amenities: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
});

export type VenueFormValues = z.infer<typeof venueSchema>;

// Common venue types
export const VENUE_TYPES = [
  { value: 'event-hall', label: 'Event Hall' },
  { value: 'conference-room', label: 'Conference Room' },
  { value: 'outdoor-space', label: 'Outdoor Space' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'theater', label: 'Theater' },
  { value: 'studio', label: 'Studio' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'other', label: 'Other' },
] as const;

// Common amenities
export const VENUE_AMENITIES = [
  'WiFi',
  'Parking',
  'Air Conditioning',
  'Heating',
  'Kitchen',
  'Restrooms',
  'Audio System',
  'Projector',
  'Stage',
  'Lighting',
  'Security',
  'Wheelchair Accessible',
  'Outdoor Space',
  'Bar Area',
  'Dance Floor',
  'Catering Available',
] as const;
