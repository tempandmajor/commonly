export interface CatererLocation {
  address: string;
  city?: string | undefined;
  state?: string | undefined;
  country?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
}

export interface CatererCapacity {
  min: number;
  max: number;
}

export interface CatererMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  courses?: {
    type: string | undefined;
    items: string[];
  }[];
}

export interface CatererReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface UnifiedCaterer {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  website?: string | undefined;
  address: string;
  location?: CatererLocation | string | undefined;
  cuisineTypes: string[];
  serviceTypes: string[];
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  rating: number;
  reviewCount: number;
  images: string[];
  coverImage?: string | undefined;
  isAvailable: boolean;
  minimumOrder: number;
  maxGuestCapacity: number;
  capacity?: CatererCapacity | undefined;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'pending' | 'suspended';
  featured: boolean;
  specialties?: string[] | undefined;
  specialDiets?: string[] | undefined;
  menu?: CatererMenu[] | undefined;
  reviews?: CatererReview[] | undefined;
  stripe_connect_account_id?: string | null | undefined;
}

// Filters and response types
export interface CatererFilters {
  cuisineType?: string | undefined;
  serviceType?: string | undefined;
  priceRange?: string | undefined;
  location?: string | undefined;
  minCapacity?: number | undefined;
  maxCapacity?: number | undefined;
  isAvailable?: boolean | undefined;
  searchQuery?: string | undefined;
  cuisine?: string | undefined;
  diet?: string | undefined;
  dateNeeded?: string | undefined;
}

export interface CatererResponse {
  caterers: UnifiedCaterer[];
  lastDoc: unknown;
  hasMore: boolean;
}
