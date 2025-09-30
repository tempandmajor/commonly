import { Event } from './event';

export interface EventSearchProps {
  category?: string | undefined;
  searchQuery?: string | undefined;
  location?: string | undefined;
  isFreeOnly?: boolean | undefined;
  priceRange?: [number, number] | undefined;
  isNearMe?: boolean | undefined;
  coordinates?: {
    latitude: number | undefined;
    longitude: number;
  };
  pageSize?: number;
}

export interface EventSearchResult {
  events: Event[];
  lastVisible: unknown;
  hasMore: boolean;
}
