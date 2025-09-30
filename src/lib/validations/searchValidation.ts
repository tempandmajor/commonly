import { z } from 'zod';

// Advanced search validation schema
export const advancedSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must be less than 200 characters')
    .trim(),

  category: z
    .enum(['all', 'events', 'products', 'communities', 'users', 'podcasts', 'venues', 'caterers'])
    .default('all'),

  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      radius: z.number().min(1).max(500).optional(), // in miles
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
    })
    .optional(),

  dateRange: z
    .object({
      start: z.date().optional(),
      end: z.date().optional(),
    })
    .optional()
    .refine(
      data => {
        if (data?.start && data?.end) {
          return data.start <= data.end;
        }
        return true;
      },
      {
        message: 'End date must be after start date',
        path: ['end'],
      }
    ),

  priceRange: z
    .object({
      min: z.number().min(0, 'Minimum price cannot be negative').optional(),
      max: z.number().min(0, 'Maximum price cannot be negative').optional(),
    })
    .optional()
    .refine(
      data => {
        if (data?.min !== undefined && data?.max !== undefined) {
          return data.min <= data.max;
        }
        return true;
      },
      {
        message: 'Maximum price must be greater than minimum price',
        path: ['max'],
      }
    ),

  sortBy: z
    .enum([
      'relevance',
      'date',
      'price-low',
      'price-high',
      'distance',
      'popularity',
      'rating',
      'newest',
    ])
    .default('relevance'),

  filters: z
    .object({
      // Event-specific filters
      eventType: z.array(z.string()).optional(),
      isVirtual: z.boolean().optional(),
      isFree: z.boolean().optional(),
      hasTicketsAvailable: z.boolean().optional(),

      // Product-specific filters
      productCategory: z.array(z.string()).optional(),
      inStock: z.boolean().optional(),
      onSale: z.boolean().optional(),
      minRating: z.number().min(1).max(5).optional(),

      // Community-specific filters
      communityType: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      hasOpenMembership: z.boolean().optional(),

      // User-specific filters
      userType: z.array(z.string()).optional(),
      isVerified: z.boolean().optional(),
      hasProfilePicture: z.boolean().optional(),

      // General filters
      tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
      language: z.array(z.string()).optional(),
      accessibility: z.array(z.string()).optional(),
    })
    .optional(),

  page: z.number().min(1).default(1),
  limit: z.number().min(5).max(100).default(20),

  saveSearch: z.boolean().default(false),
  searchName: z.string().max(50, 'Search name must be less than 50 characters').optional(),
});

// Quick search validation schema
export const quickSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters')
    .trim(),

  category: z.enum(['all', 'events', 'products', 'communities', 'users']).default('all'),

  location: z.string().max(100, 'Location must be less than 100 characters').optional(),

  recentSearches: z.array(z.string()).max(10).optional(),
  suggestions: z.array(z.string()).max(5).optional(),
});

// Search filter validation schema
export const searchFiltersSchema = z.object({
  category: z.string(),

  location: z
    .object({
      type: z.enum(['current', 'city', 'coordinates', 'none']).default('none'),
      value: z.string().optional(),
      radius: z.number().min(1).max(500).default(25),
    })
    .optional(),

  dateRange: z
    .object({
      preset: z
        .enum(['today', 'tomorrow', 'this-week', 'this-weekend', 'this-month', 'custom'])
        .optional(),
      start: z.date().optional(),
      end: z.date().optional(),
    })
    .optional(),

  price: z
    .object({
      type: z.enum(['free', 'paid', 'range']).default('free'),
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    })
    .optional(),

  availability: z
    .object({
      onlyAvailable: z.boolean().default(false),
      instantBook: z.boolean().default(false),
    })
    .optional(),

  features: z.array(z.string()).max(20).optional(),
});

// Saved search validation schema
export const savedSearchSchema = z.object({
  name: z
    .string()
    .min(3, 'Search name must be at least 3 characters')
    .max(50, 'Search name must be less than 50 characters'),

  query: z.string().min(1, 'Search query is required'),

  filters: z.record(z.any()).optional(),

  notifications: z
    .object({
      enabled: z.boolean().default(false),
      frequency: z.enum(['instant', 'daily', 'weekly']).default('daily'),
      maxResults: z.number().min(1).max(50).default(10),
    })
    .optional(),

  isPublic: z.boolean().default(false),

  tags: z.array(z.string()).max(5).optional(),
});

// Form defaults
export const advancedSearchDefaults = {
  query: '',
  category: 'all' as const,
  sortBy: 'relevance' as const,
  page: 1,
  limit: 20,
  saveSearch: false,
};

export const quickSearchDefaults = {
  query: '',
  category: 'all' as const,
  recentSearches: [],
  suggestions: [],
};

export const searchFiltersDefaults = {
  category: 'all',
  location: {
    type: 'none' as const,
    radius: 25,
  },
  availability: {
    onlyAvailable: false,
    instantBook: false,
  },
};

export const savedSearchDefaults = {
  name: '',
  query: '',
  notifications: {
    enabled: false,
    frequency: 'daily' as const,
    maxResults: 10,
  },
  isPublic: false,
};

// Type exports
export type AdvancedSearchValues = z.infer<typeof advancedSearchSchema>;
export type QuickSearchValues = z.infer<typeof quickSearchSchema>;
export type SearchFiltersValues = z.infer<typeof searchFiltersSchema>;
export type SavedSearchValues = z.infer<typeof savedSearchSchema>;

// Search suggestion types
export interface SearchSuggestion {
  type: 'query' | 'category' | 'location' | 'tag';
  text: string;
  icon?: React.ReactNode | undefined;
  count?: number | undefined;
}

export interface SearchHistory {
  id: string;
  query: string;
  category: string;
  timestamp: Date;
  resultsCount: number;
}

// Search result types
export interface SearchResult {
  id: string;
  type: 'event' | 'product' | 'community' | 'user' | 'podcast' | 'venue' | 'caterer';
  title: string;
  description: string;
  image?: string | undefined;
  url: string;
  relevanceScore: number;
  metadata: Record<string, unknown>;
}
