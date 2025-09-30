/**
 * User Profile Service
 *
 * This file exports the unified User Profile service API and related types.
 *
 * New code should use the exported API objects directly:
 * import { profileAPI, useProfileById } from '@/services/profile';
 *
 * Legacy code can continue to use the compatibility exports:
 * import { ProfileService } from '@/services/profile';
 */

// Export API
export { profileAPI } from './api/profileAPI';

// Export hooks
export {
  useProfileById,
  useProfileByUsername,
  useProfileUpdate,
  useProfileSearch,
  useUsernameCheck,
  useSuggestedUsernames,
} from './hooks/useProfile';

// Export types
export * from './core/types';

// Export utilities
export { profileUtils } from './utils/profileUtils';

// Export compatibility layers for legacy code
export { ProfileService, default as LegacyProfileService } from './compatibility/profileService';
