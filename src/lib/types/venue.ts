export interface Venue {
  id: string;
  name: string;
  description: string;
  address:
    | {
        street: string;
        city: string;
        state: string;
        zipcode: string;
        country: string;
      }
    | string;
  capacity:
    | {
        seating: number;
        standing: number;
      }
    | number;
  amenities: string[];
  images?: string[];
  pricePerHour?: number;
  minimumHours: number;
  availableDates?: string[];
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
  };
  rules?: string[];
  createdAt?: string;
  updatedAt?: string;
  rating?: number;
  location?: string;
  status?: 'pending' | 'active' | 'suspended';
  featured?: boolean;
}

export interface DisplayVenue {
  id: string;
  name: string;
  location: string;
  rating: number;
  capacity: number;
  price: string;
  images: string[];
}
