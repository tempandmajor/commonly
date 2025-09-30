/**
 * Notification Service
 *
 * This file exports the unified notification service API, hooks, and related types.
 *
 * New code should use the exported API objects directly:
 * import { notificationAPI, useNotification } from '@/services/notification';
 *
 * Legacy code can continue to use the compatibility exports:
 * import { ToastService } from '@/services/notification';
 */

// Export the consolidated API
export { notificationAPI } from './api/notificationAPI';

// Export hooks
export {
  useNotification,
  useBadgeNotification,
  NotificationProvider,
  useNotificationContext,
} from './hooks/useNotification';

// Export types
export * from './core/types';

// Export utilities
export * from './utils/notificationUtils';

// Export compatibility layers for legacy code
export {
  ToastService,
  AlertService,
  default as LegacyToastService,
} from './compatibility/toastService';
