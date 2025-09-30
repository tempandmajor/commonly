import { SearchFilters } from './types';

export const buildSearchQuery = (query: string, filters?: SearchFilters): string => {
  let searchQuery = query.toLowerCase();

  if (filters?.category) {
    searchQuery += ` category:${filters.category}`;
  }

  if (filters?.location) {
    searchQuery += ` location:${filters.location}`;
  }

  return searchQuery;
};

export const normalizeSearchTerm = (term: string): string => {
  return term.toLowerCase().trim();
};
