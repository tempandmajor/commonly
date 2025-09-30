/**
 * Notification Service - React Hooks
 *
 * This module provides React hooks for using notifications in components.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/services/auth';
import { notificationAPI } from '../api/notificationAPI';
import {
  NotificationVariant,
  InAppNotification,
  NotificationType,
  NotificationPriority,
  ToastNotification,
} from '../core/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Options for useNotification hook
 */
export interface UseNotificationOptions {
  // Whether to automatically load in-app notifications
  loadInAppNotifications?: boolean | undefined;

  // Whether to include read notifications when fetching
  includeRead?: boolean | undefined;

  // Query refetch interval in milliseconds
  refetchInterval?: number | undefined;
}

/**
 * Hook for using notifications in React components
 */
export const useNotification = (options: UseNotificationOptions = {}) => {
  const {
    loadInAppNotifications = true,
    includeRead = false,
    refetchInterval = 30000, // 30 seconds
  } = options;

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Toast notifications
  const showToast = useCallback(
    (
      title: string,
      message: string,
      variant?: NotificationVariant,
      options?: Partial<ToastNotification>
    ) => {
      return notificationAPI.showToast(title, message, variant, options);
    },
    []
  );

  const showSuccessToast = useCallback(
    (title: string, message: string, options?: Partial<ToastNotification>) => {
      return notificationAPI.showSuccessToast(title, message, options);
    },
    []
  );

  const showInfoToast = useCallback(
    (title: string, message: string, options?: Partial<ToastNotification>) => {
      return notificationAPI.showInfoToast(title, message, options);
    },
    []
  );

  const showWarningToast = useCallback(
    (title: string, message: string, options?: Partial<ToastNotification>) => {
      return notificationAPI.showWarningToast(title, message, options);
    },
    []
  );

  const showErrorToast = useCallback(
    (title: string, message: string, options?: Partial<ToastNotification>) => {
      return notificationAPI.showErrorToast(title, message, options);
    },
    []
  );

  // Fetch in-app notifications if user is logged in
  const {
    data: inAppNotifications = [],
    isLoading: isLoadingNotifications,
    isError: isErrorNotifications,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications', user?.id, includeRead],
    queryFn: () => {
      if (!user?.id) return [];
      return notificationAPI.getInAppNotifications(user.id, includeRead);
    },
    enabled: !!user?.id && loadInAppNotifications,
    refetchInterval,
  });

  // Count of unread in-app notifications
  const unreadCount = useMemo(() => {
    return inAppNotifications.filter(n => !n.read).length;
  }, [inAppNotifications]);

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => {
      return notificationAPI.markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId);
    },
    [markAsReadMutation]
  );

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => {
      return notificationAPI.deleteNotification(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const deleteNotification = useCallback(
    (notificationId: string) => {
      deleteNotificationMutation.mutate(notificationId);
    },
    [deleteNotificationMutation]
  );

  // Clear all notifications
  const clearAllMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) return 0;
      return notificationAPI.clearUserNotifications(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const clearAllNotifications = useCallback(() => {
    clearAllMutation.mutate();
  }, [clearAllMutation]);

  // Create in-app notification
  const createInAppNotification = useCallback(
    (title: string, message: string, options?: Partial<InAppNotification>) => {
      if (!user?.id) return Promise.resolve(null);
      return notificationAPI.createInAppNotification(user.id, title, message, options);
    },
    [user?.id]
  );

  return {
    // Toast notifications
    showToast,
    showSuccessToast,
    showInfoToast,
    showWarningToast,
    showErrorToast,

    // In-app notifications
    inAppNotifications,
    unreadCount,
    isLoadingNotifications,
    isErrorNotifications,
    notificationsError,
    refetchNotifications,

    // In-app notification actions
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    createInAppNotification,

    // Status
    isMutating:
      markAsReadMutation.isPending ||
      deleteNotificationMutation.isPending ||
      clearAllMutation.isPending,
  };
};

/**
 * Component-specific hook for managing notification badges
 */
export const useBadgeNotification = (badgeId: string) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`badge_dismissed_${badgeId}`) === 'true';
  });

  const dismissBadge = useCallback(() => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`badge_dismissed_${badgeId}`, 'true');
    }
  }, [badgeId]);

  const resetBadge = useCallback(() => {
    setIsDismissed(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`badge_dismissed_${badgeId}`);
    }
  }, [badgeId]);

  return {
    isDismissed,
    dismissBadge,
    resetBadge,
  };
};

/**
 * Provider context for the notification service
 */
import React, { createContext, useContext, ReactNode } from 'react';

// Notification context type
type NotificationContextType = ReturnType<typeof useNotification>;

// Create context with a default empty implementation
const NotificationContext = createContext<NotificationContextType | null>(null);

// Props for NotificationProvider
interface NotificationProviderProps {
  children: ReactNode;
  options?: UseNotificationOptions | undefined;
}

/**
 * Notification Provider component
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  options = {},
}) => {
  const notificationUtils = useNotification(options);

  return (
    <NotificationContext.Provider value={notificationUtils}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook for using the notification context
 */
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }

  return context;
};
