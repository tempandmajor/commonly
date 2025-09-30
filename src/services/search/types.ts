export interface SearchFilters {
  category?: string | undefined;
  location?: string | undefined;
  coordinates?: {
    latitude: number | undefined;
    longitude: number;
    radius: number; // in kilometers
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface SearchOptions {
  limit?: number | undefined;
  offset?: number | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | undefined| 'desc';
}
