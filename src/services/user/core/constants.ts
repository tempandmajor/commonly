/**
 * @file Constants for the user service
 */

// Default user roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  EVENT_ORGANIZER: 'event_organizer',
  VENUE_OWNER: 'venue_owner',
  CATERER: 'caterer',
};

// Default user preferences
export const DEFAULT_PREFERENCES = {
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: true,
    eventReminders: true,
    promotions: false,
  },
  privacy: {
    isPrivate: false,
    showEmail: false,
    showPhone: false,
  },
};

// Default payment settings
export const DEFAULT_PAYMENT_SETTINGS = {
  defaultMethod: 'stripe',
  autoRecharge: false,
  rechargeAmount: 0,
};

// Storage buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  USER_UPLOADS: 'user-uploads',
  DOCUMENTS: 'documents',
};

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  USER_PROFILE: 300, // 5 minutes
  USER_SETTINGS: 300, // 5 minutes
  USER_PREFERENCES: 300, // 5 minutes
};

// Error messages
export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  NOT_AUTHENTICATED: 'User not authenticated',
  PERMISSION_DENIED: 'Permission denied',
  UPLOAD_FAILED: 'Failed to upload file',
  PROFILE_UPDATE_FAILED: 'Failed to update profile',
  SETTINGS_UPDATE_FAILED: 'Failed to update settings',
};
