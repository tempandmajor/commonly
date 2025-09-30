/**
 * Notification Service - API Module
 *
 * This file implements the core notification API functions.
 */

import { toast } from 'sonner';
import {
  BaseNotification,
  Notification,
  NotificationType,
  NotificationVariant,
  NotificationStatus,
  NotificationProvider,
  NotificationConfig,
  NotificationError,
  NotificationErrorType,
  NotificationEvent,
  NotificationPriority,
  InAppNotification,
  EmailNotification,
  PushNotification,
  SMSNotification,
  ToastNotification,
} from '../core/types';

// Default configuration
const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  providers: {
    toast: true,
    inApp: false,
    email: false,
    push: false,
    sms: false,
  },
  defaultToastDuration: 5000,
  defaultToastPosition: 'top-right',
  maxQueueSize: 100,
  throttleLimit: 10,
  throttleWindow: 60000, // 1 minute
};

// Notification providers registry
const providers: Map<string, NotificationProvider> = new Map();

// Notification service configuration
let config: NotificationConfig = { ...DEFAULT_CONFIG };

// In-app notification queue (for persistent notifications)
let notificationQueue: InAppNotification[] = [];

// Keep track of toast notifications to prevent duplicates
const recentToasts = new Set<string>();

// Notification throttling
const sentTimestamps: number[] = [];

/**
 * Initialize the notification service
 */
export const initialize = async (customConfig?: Partial<NotificationConfig>): Promise<void> => {
  try {
    // Merge configurations
    config = { ...DEFAULT_CONFIG, ...customConfig };

    // Skip initialization if notifications are disabled
    if (!config.enabled) {
      return;
    }

    // Initialize providers
    const initPromises: Promise<void>[] = [];

    // Initialize registered providers
    for (const [providerName, provider] of providers.entries()) {
      initPromises.push(provider.initialize());
    }

    await Promise.all(initPromises);
    // Register built-in toast provider if enabled
    if (config.providers.toast && !providers.has('toast')) {
      registerToastProvider();
    }
  } catch (error) {
    const notificationError = new NotificationError(
      `Failed to initialize notification service: ${error as Error}.message}`,
      NotificationErrorType.INITIALIZATION_FAILED,
      error as Error
    );
    throw notificationError;
  }
};

/**
 * Register a notification provider
 */
export const registerProvider = (provider: NotificationProvider): void => {
  providers.set(provider.name, provider);
};

/**
 * Register the built-in toast provider
 */
const registerToastProvider = (): void => {
  const toastProvider: NotificationProvider = {
    name: 'toast',
    supportedTypes: [NotificationType.TOAST],
    initialize: async () => {},
    send: async notification => {
      if (notification.type !== NotificationType.TOAST) {
        throw new NotificationError(
          `Toast provider cannot handle ${notification.type} notifications`,
          NotificationErrorType.INVALID_NOTIFICATION
        );
      }

      const toastNotification = notification as ToastNotification;

      // Generate a content hash to prevent duplicate toasts
      const contentHash = `${toastNotification.title}:${toastNotification.message}`;

      // Skip if this is a duplicate within the last few seconds
      if (recentToasts.has(contentHash)) {
        return {
          notification,
          status: NotificationStatus.CANCELED,
          timestamp: Date.now(),
        };
      }

      // Add to recent toasts and clean up after a short delay
      recentToasts.add(contentHash);
      setTimeout(() => {
        recentToasts.delete(contentHash);
      }, 3000);

      // Display the toast with the appropriate variant
      const toastFn = getToastFunction(toastNotification.variant || NotificationVariant.DEFAULT);

      toastFn(toastNotification.title, {
        description: toastNotification.message,
        duration: toastNotification.duration || config.defaultToastDuration,
        action: toastNotification.action,
      });

      return {
        notification,
        status: NotificationStatus.DELIVERED,
        timestamp: Date.now(),
      };
    },
  };

  registerProvider(toastProvider);
};

/**
 * Get the appropriate toast function based on variant
 */
const getToastFunction = (variant: NotificationVariant): Function => {
  switch (variant) {
    case NotificationVariant.SUCCESS:
      return toast.success;
    case NotificationVariant.INFO:
      return toast.info;
    case NotificationVariant.WARNING:
      return toast.warning;
    case NotificationVariant.ERROR:
      return toast.error;
    default:
      return toast;
  }
};

/**
 * Check if we should throttle notifications
 */
const shouldThrottle = (): boolean => {
  if (!config.throttleLimit || !config.throttleWindow) {
    return false;
  }

  const now = Date.now();

  // Clean up old timestamps
  while (sentTimestamps.length > 0 && sentTimestamps[0] < now - config.throttleWindow) {
    sentTimestamps.shift();
  }

  return sentTimestamps.length >= config.throttleLimit;
};

/**
 * Send a notification
 */
export const send = async (notification: Notification): Promise<NotificationEvent> => {
  try {
    if (!config.enabled) {
      return {
        notification,
        status: NotificationStatus.CANCELED,
        timestamp: Date.now(),
      };
    }

    // Check throttling
    if (shouldThrottle() && notification.priority !== NotificationPriority.URGENT) {
      throw new NotificationError(
        'Notification rate limit exceeded',
        NotificationErrorType.RATE_LIMIT_EXCEEDED
      );
    }

    // Add timestamp to notification
    const timestampedNotification: Notification = {
          ...notification,
      timestamp: notification.timestamp || Date.now(),
    };

    // Track for throttling
    sentTimestamps.push(Date.now());

    // Find providers that can handle this type of notification
    const eligibleProviders = Array.from(providers.values()).filter(provider =>
      provider.supportedTypes.includes(notification.type)
    );

    if (eligibleProviders.length === 0) {
      throw new NotificationError(
        `No provider registered for notification type: ${notification.type}`,
        NotificationErrorType.PROVIDER_MISSING
      );
    }

    // For in-app notifications, also store in queue
    if (notification.type === NotificationType.IN_APP) {
      const inAppNotification = notification as InAppNotification;

      // Add to queue with proper status
      const queuedNotification: InAppNotification = {
          ...inAppNotification,
        id:
          inAppNotification.id ||

          `in-app-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        status: NotificationStatus.SENT,
        read: false,
      };

      // Enforce max queue size
      if (config.maxQueueSize && notificationQueue.length >= config.maxQueueSize) {
        notificationQueue.shift();
      }

      notificationQueue.push(queuedNotification);
    }

    // Send to all eligible providers
    const sendPromises = eligibleProviders.map(provider => provider.send(timestampedNotification));

    const results = await Promise.all(sendPromises);

    // Return first result (multiple providers for same type is an edge case)
    return results[0];
  } catch (error) {
    if (error instanceof NotificationError) {
      throw error;
    }

    throw new NotificationError(

      `Failed to send notification: ${(error as Error).message}`,
      NotificationErrorType.SEND_FAILED,
      error as Error
    );
  }
};

/**
 * Show a toast notification
 */
export const showToast = async (
  title: string,
  message: string,
  variant: NotificationVariant = NotificationVariant.DEFAULT,
  options: Partial<ToastNotification> = {}
): Promise<NotificationEvent> => {
  const notification: ToastNotification = {
    type: NotificationType.TOAST,
    title,
    message,
    variant,
          ...options,
  };

  return send(notification);
};

/**
 * Show a success toast
 */
export const showSuccessToast = (
  title: string,
  message: string,
  options: Partial<ToastNotification> = {}
): Promise<NotificationEvent> => {
  return showToast(title, message, NotificationVariant.SUCCESS, options);
};

/**
 * Show an info toast
 */
export const showInfoToast = (
  title: string,
  message: string,
  options: Partial<ToastNotification> = {}
): Promise<NotificationEvent> => {
  return showToast(title, message, NotificationVariant.INFO, options);
};

/**
 * Show a warning toast
 */
export const showWarningToast = (
  title: string,
  message: string,
  options: Partial<ToastNotification> = {}
): Promise<NotificationEvent> => {
  return showToast(title, message, NotificationVariant.WARNING, options);
};

/**
 * Show an error toast
 */
export const showErrorToast = (
  title: string,
  message: string,
  options: Partial<ToastNotification> = {}
): Promise<NotificationEvent> => {
  return showToast(title, message, NotificationVariant.ERROR, options);
};

/**
 * Create an in-app notification
 */
export const createInAppNotification = async (
  userId: string,
  title: string,
  message: string,
  options: Partial<InAppNotification> = {}
): Promise<NotificationEvent> => {
  const notification: InAppNotification = {
    type: NotificationType.IN_APP,
    userId,
    title,
    message,
    status: NotificationStatus.PENDING,
    read: false,
          ...options,
  };

  return send(notification);
};

/**
 * Get all in-app notifications for a user
 */
export const getInAppNotifications = (userId: string, includeRead = false): InAppNotification[] => {
  return notificationQueue.filter(
    notification => notification.userId === userId && (includeRead || !notification.read)
  );
};

/**
 * Mark an in-app notification as read
 */
export const markAsRead = (notificationId: string): InAppNotification | null => {
  const notificationIndex = notificationQueue.findIndex(n => n.id === notificationId);

  if (notificationIndex === -1) {
    return null;
  }

  const notification = notificationQueue[notificationIndex];
  const updatedNotification: InAppNotification = {
          ...notification,
    read: true,
    readAt: Date.now(),
    status: NotificationStatus.READ,
  };

  notificationQueue[notificationIndex] = updatedNotification;
  return updatedNotification;
};

/**
 * Delete an in-app notification
 */
export const deleteNotification = (notificationId: string): boolean => {
  const initialLength = notificationQueue.length;
  notificationQueue = notificationQueue.filter(n => n.id !== notificationId);
  return notificationQueue.length < initialLength;
};

/**
 * Clear all in-app notifications for a user
 */
export const clearUserNotifications = (userId: string): number => {
  const initialLength = notificationQueue.length;
  notificationQueue = notificationQueue.filter(n => n.userId !== userId);
  return initialLength - notificationQueue.length;
};

/**
 * Get current configuration
 */
export const getConfig = (): NotificationConfig => {
  return { ...config };
};

/**
 * Enable or disable the notification service
 */
export const setEnabled = (enabled: boolean): void => {
  config.enabled = enabled;
};

// Export all functions as notificationAPI object
export const notificationAPI = {
  initialize,
  registerProvider,
  send,
  showToast,
  showSuccessToast,
  showInfoToast,
  showWarningToast,
  showErrorToast,
  createInAppNotification,
  getInAppNotifications,
  markAsRead,
  deleteNotification,
  clearUserNotifications,
  getConfig,
  setEnabled,
};

