/**
 * Comprehensive utility functions for validating and sanitizing user inputs
 * Provides type-safe validation for various input types used across the application
 */

import { z } from 'zod';

// Common validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/;
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s.,!?'"()-]+$/;
const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9\s]+$/;

// Validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const phoneSchema = z.string().regex(PHONE_REGEX, 'Invalid phone number format');
export const urlSchema = z.string().url('Invalid URL format');
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');
export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)');

// Input sanitization functions
export const sanitizeText = (input: string): string => {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>{}()[\]\\^=;:"/~|`]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 1000); // Limit length
};

export const sanitizeSearchString = (input: string): string => {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>{}()[\]\\^=;:'"/~|`]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 255); // Limit search query length
};

export const sanitizeNumericString = (input: string): string => {
  if (!input) return '';
  return input.replace(/[^\d.-]/g, ''); // Only allow digits, dots, and minus
};

export const sanitizeAlphanumeric = (input: string): string => {
  if (!input) return '';
  return input.replace(/[^a-zA-Z0-9\s]/g, '').trim();
};

// Basic validation functions
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

export const isValidPhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone.trim());
};

export const isValidUrl = (url: string): boolean => {
  return URL_REGEX.test(url.trim());
};

export const isValidDate = (date: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date;
};

export const isValidTime = (time: string): boolean => {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [hours, minutes] = time.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

export const isValidPrice = (price: string | number): boolean => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0 && numPrice <= 999999;
};

export const isValidCapacity = (capacity: string | number): boolean => {
  const numCapacity = typeof capacity === 'string' ? parseInt(capacity) : capacity;
  return Number.isInteger(numCapacity) && numCapacity > 0 && numCapacity <= 10000;
};

// Location validation
export const validateLocation = (location?: string): boolean => {
  if (!location) return true; // Empty is valid (no filter)
  return /^[a-zA-Z0-9\s,.-]+$/.test(location) && location.length <= 200;
};

export const isValidAddress = (address: string): boolean => {
  return address.trim().length >= 5 && address.length <= 500 && SAFE_TEXT_REGEX.test(address);
};

export const isValidCity = (city: string): boolean => {
  return /^[a-zA-Z\s.-]+$/.test(city) && city.trim().length >= 2 && city.length <= 100;
};

export const isValidState = (state: string): boolean => {
  return /^[a-zA-Z\s.-]+$/.test(state) && state.trim().length >= 2 && state.length <= 100;
};

export const isValidPostalCode = (postalCode: string): boolean => {
  // Supports US ZIP codes and international postal codes
  return /^[a-zA-Z0-9\s-]+$/.test(postalCode) && postalCode.trim().length >= 3 && postalCode.length <= 20;
};

// Price range validation
export const validatePriceRange = (priceRange?: string[]): boolean => {
  if (!priceRange?.length) return true;
  const validValues = ['$', '$$', '$$$', '$$$$', 'budget', 'moderate', 'premium', 'luxury'];
  return priceRange.every(price => validValues.includes(price));
};

// Cuisine and dietary validation
export const validateCuisine = (cuisine?: string): boolean => {
  if (!cuisine || cuisine === 'all') return true;
  return /^[a-zA-Z\s-]+$/.test(cuisine) && cuisine.length <= 50;
};

export const validateDiet = (diet?: string): boolean => {
  if (!diet || diet === 'all') return true;
  return /^[a-zA-Z\s-]+$/.test(diet) && diet.length <= 50;
};

// Advanced validation functions
export const isValidPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_.-]+$/.test(username) &&
         username.length >= 3 &&
         username.length <= 30 &&
         !/^[._-]/.test(username) && // Cannot start with special chars
         !/[._-]$/.test(username);   // Cannot end with special chars
};

export const isValidDisplayName = (name: string): boolean => {
  return name.trim().length >= 1 &&
         name.length <= 100 &&
         /^[a-zA-Z0-9\s.-]+$/.test(name);
};

// File validation
export const isValidImageFile = (file: File): { isValid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return { isValid: false, error: 'File must be JPEG, PNG, or WebP format' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }

  return { isValid: true };
};

export const isValidDocumentFile = (file: File): { isValid: boolean; error?: string } => {
  const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return { isValid: false, error: 'File must be PDF or Word document' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 10MB' };
  }

  return { isValid: true };
};

// Complex object validation interfaces
interface CatererFilters {
  location?: string | undefined;
  cuisine?: string | undefined;
  diet?: string | undefined;
  priceRange?: string[] | undefined;
  dateNeeded?: string | undefined;
  specialties?: string[] | undefined;
  minCapacity?: number | undefined;
  rating?: number | undefined;
  searchQuery?: string | undefined;
}

interface VenueFilters {
  location?: string | undefined;
  venueType?: string | undefined;
  capacity?: string | undefined;
  priceRange?: string[] | undefined;
  dateNeeded?: string | undefined;
  amenities?: string[] | undefined;
  rating?: number | undefined;
  searchQuery?: string | undefined;
}

interface EventFilters {
  location?: string | undefined;
  eventType?: string | undefined;
  dateRange?: { start: string | undefined; end: string };
  priceRange?: string[];
  categories?: string[];
  searchQuery?: string;
}

// Filter sanitization and validation functions
export const sanitizeCatererFilters = (filters: CatererFilters): CatererFilters => {
  const sanitized: CatererFilters = {};

  if (filters.location) {
    const location = sanitizeSearchString(filters.location) as string;
    if (validateLocation(location)) {
      sanitized.location = location;
    }
  }

  if (filters.cuisine) {
    const cuisine = sanitizeSearchString(filters.cuisine) as string;
    if (validateCuisine(cuisine)) {
      sanitized.cuisine = cuisine;
    }
  }

  if (filters.diet) {
    const diet = sanitizeSearchString(filters.diet) as string;
    if (validateDiet(diet)) {
      sanitized.diet = diet;
    }
  }

  if (filters.priceRange && validatePriceRange(filters.priceRange)) {
    sanitized.priceRange = filters.priceRange;
  }

  if (filters.dateNeeded && isValidDate(filters.dateNeeded)) {
    sanitized.dateNeeded = filters.dateNeeded;
  }

  if (filters.specialties?.length) {
    sanitized.specialties = filters.specialties
      .map(s => sanitizeText(s))
      .filter(s => s.length > 0 && s.length <= 100);
  }

  if (filters.minCapacity && isValidCapacity(filters.minCapacity)) {
    sanitized.minCapacity = filters.minCapacity;
  }

  if (filters.rating && typeof filters.rating === 'number' &&
      filters.rating >= 0 && filters.rating <= 5) {
    sanitized.rating = filters.rating;
  }

  if (filters.searchQuery) {
    const query = sanitizeSearchString(filters.searchQuery) as string;
    if (query.length >= 2) {
      sanitized.searchQuery = query;
    }
  }

  return sanitized;
};

export const sanitizeVenueFilters = (filters: VenueFilters): VenueFilters => {
  const sanitized: VenueFilters = {};

  if (filters.location) {
    const location = sanitizeSearchString(filters.location) as string;
    if (validateLocation(location)) {
      sanitized.location = location;
    }
  }

  if (filters.venueType) {
    const venueType = sanitizeAlphanumeric(filters.venueType);
    if (venueType.length <= 50) {
      sanitized.venueType = venueType;
    }
  }

  if (filters.capacity) {
    const capacity = sanitizeNumericString(filters.capacity) as string;
    if (isValidCapacity(capacity)) {
      sanitized.capacity = capacity;
    }
  }

  if (filters.priceRange && validatePriceRange(filters.priceRange)) {
    sanitized.priceRange = filters.priceRange;
  }

  if (filters.dateNeeded && isValidDate(filters.dateNeeded)) {
    sanitized.dateNeeded = filters.dateNeeded;
  }

  if (filters.amenities?.length) {
    sanitized.amenities = filters.amenities
      .map(a => sanitizeText(a))
      .filter(a => a.length > 0 && a.length <= 100);
  }

  if (filters.rating && typeof filters.rating === 'number' &&
      filters.rating >= 0 && filters.rating <= 5) {
    sanitized.rating = filters.rating;
  }

  if (filters.searchQuery) {
    const query = sanitizeSearchString(filters.searchQuery) as string;
    if (query.length >= 2) {
      sanitized.searchQuery = query;
    }
  }

  return sanitized;
};

export const sanitizeEventFilters = (filters: EventFilters): EventFilters => {
  const sanitized: EventFilters = {};

  if (filters.location) {
    const location = sanitizeSearchString(filters.location) as string;
    if (validateLocation(location)) {
      sanitized.location = location;
    }
  }

  if (filters.eventType) {
    const eventType = sanitizeAlphanumeric(filters.eventType);
    if (eventType.length <= 50) {
      sanitized.eventType = eventType;
    }
  }

  if (filters.dateRange?.start && filters.dateRange?.end) {
    if (isValidDate(filters.dateRange.start) && isValidDate(filters.dateRange.end)) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      if (end >= start) {
        sanitized.dateRange = filters.dateRange;
      }
    }
  }

  if (filters.priceRange && validatePriceRange(filters.priceRange)) {
    sanitized.priceRange = filters.priceRange;
  }

  if (filters.categories?.length) {
    sanitized.categories = filters.categories
      .map(c => sanitizeText(c))
      .filter(c => c.length > 0 && c.length <= 100);
  }

  if (filters.searchQuery) {
    const query = sanitizeSearchString(filters.searchQuery) as string;
    if (query.length >= 2) {
      sanitized.searchQuery = query;
    }
  }

  return sanitized;
};

// Rate limiting helpers
export const isValidRateLimit = (attempts: number, maxAttempts: number = 5): boolean => {
  return attempts < maxAttempts;
};

export const isValidTimeWindow = (lastAttempt: Date, windowMinutes: number = 15): boolean => {
  const now = new Date();
  const timeDiff = (now.getTime() - lastAttempt.getTime()) / (1000 * 60);
  return timeDiff >= windowMinutes;
};

// Export type definitions for reuse
export type { CatererFilters, VenueFilters, EventFilters };