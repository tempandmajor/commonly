/**
 * Notification Service - Utilities
 *
 * This module provides utility functions for working with notifications.
 */

import { BaseNotification, InAppNotification, NotificationStatus } from '../core/types';

/**
 * Generate a unique notification ID
 */
export const generateNotificationId = (type: string): string => {

  return `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Filter notifications based on read status
 */
export const filterByReadStatus = (
  notifications: InAppNotification[],
  onlyUnread: boolean = true
): InAppNotification[] => {
  if (!onlyUnread) {
    return notifications;
  }

  return notifications.filter(notification => !notification.read);
};

/**
 * Sort notifications by timestamp (newest first)
 */
export const sortByTimestamp = <T extends BaseNotification>(
  notifications: T[],
  ascending: boolean = false
): T[] => {
  return [...notifications].sort((a, b) => {
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;
    return ascending ? timeA - timeB : timeB - timeA;
  });
};

/**
 * Group notifications by date (today, yesterday, this week, earlier)
 */
export const groupByDate = <T extends BaseNotification>(
  notifications: T[]
): Record<string, T[]> => {
  const result: Record<string, T[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  notifications.forEach(notification => {
    const timestamp = notification.timestamp || 0;
    const date = new Date(timestamp);

    if (date >= today) {
      result.today.push(notification);
    } else if (date >= yesterday) {
      result.yesterday.push(notification);
    } else if (date >= weekAgo) {
      result.thisWeek.push(notification);
    } else {
      result.earlier.push(notification);
    }
  });

  return result;
};

/**
 * Format relative time for notifications
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  // Less than a minute
  if (diff < 60 * 1000) {
    return 'just now';
  }

  // Less than an hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));

    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }

  // Less than a day
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));

    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }

  // Less than a week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  // Format as date
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

/**
 * Check if a notification has expired
 */
export const isExpired = (notification: BaseNotification): boolean => {
  if (!notification.expiresAt) {
    return false;
  }

  return Date.now() > notification.expiresAt;
};

/**
 * Get status label for display purposes
 */
export const getStatusLabel = (status: NotificationStatus): string => {
  switch (status) {
    case NotificationStatus.PENDING:
      return 'Pending';
    case NotificationStatus.SENT:
      return 'Sent';
    case NotificationStatus.DELIVERED:
      return 'Delivered';
    case NotificationStatus.READ:
      return 'Read';
    case NotificationStatus.FAILED:
      return 'Failed';
    case NotificationStatus.CANCELED:
      return 'Canceled';
    default:
      return 'Unknown';
  }
};

/**
 * Truncate notification message for preview
 */
export const truncateMessage = (message: string, maxLength: number = 100): string => {
  if (message.length <= maxLength) {
    return message;
  }

  return message.substring(0, maxLength) + '...';
};

