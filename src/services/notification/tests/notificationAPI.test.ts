/**
 * Notification Service - API Tests
 *
 * Unit tests for the notification API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationAPI } from '../api/notificationAPI';
import {
  NotificationType,
  NotificationVariant,
  NotificationStatus,
  ToastNotification,
  InAppNotification,
} from '../core/types';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('Notification API', () => {
  beforeEach(async () => {
    // Reset mocks
    vi.resetAllMocks();

    // Initialize notification service with test configuration
    await notificationAPI.initialize({
      enabled: true,
      providers: {
        toast: true,
        inApp: true,
      },
    });

    // Clear in-app notifications
    if (notificationAPI.getInAppNotifications('test-user').length > 0) {
      notificationAPI.clearUserNotifications('test-user');
    }
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', async () => {
      // Re-initialize with no custom config
      await notificationAPI.initialize();

      const config = notificationAPI.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.providers.toast).toBe(true);
      expect(config.defaultToastDuration).toBeDefined();
    });

    it('should merge custom configuration with defaults', async () => {
      const customConfig = {
        defaultToastDuration: 10000,
        maxQueueSize: 50,
      };

      await notificationAPI.initialize(customConfig);

      const config = notificationAPI.getConfig();
      expect(config.defaultToastDuration).toBe(10000);
      expect(config.maxQueueSize).toBe(50);
      expect(config.providers.toast).toBe(true); // Default should be preserved
    });

    it('should be able to disable the service', () => {
      notificationAPI.setEnabled(false);

      const config = notificationAPI.getConfig();
      expect(config.enabled).toBe(false);

      // Re-enable for other tests
      notificationAPI.setEnabled(true);
    });
  });

  describe('Toast Notifications', () => {
    it('should show default toast notification', async () => {
      await notificationAPI.showToast('Test Title', 'Test Message');

      // Check if toast was called
      expect(toast).toHaveBeenCalled();
    });

    it('should show success toast notification', async () => {
      await notificationAPI.showSuccessToast('Success', 'Operation successful');

      expect(toast.success).toHaveBeenCalledWith('Success', {
        description: 'Operation successful',
        duration: expect.any(Number),
        action: undefined,
      });
    });

    it('should show error toast notification', async () => {
      await notificationAPI.showErrorToast('Error', 'Something went wrong');

      expect(toast.error).toHaveBeenCalledWith('Error', {
        description: 'Something went wrong',
        duration: expect.any(Number),
        action: undefined,
      });
    });

    it('should show info toast notification', async () => {
      await notificationAPI.showInfoToast('Info', 'Here is some information');

      expect(toast.info).toHaveBeenCalledWith('Info', {
        description: 'Here is some information',
        duration: expect.any(Number),
        action: undefined,
      });
    });

    it('should show warning toast notification', async () => {
      await notificationAPI.showWarningToast('Warning', 'Be careful');

      expect(toast.warning).toHaveBeenCalledWith('Warning', {
        description: 'Be careful',
        duration: expect.any(Number),
        action: undefined,
      });
    });

    it('should handle toast with custom duration', async () => {
      const customDuration = 10000;
      await notificationAPI.showToast('Title', 'Message', NotificationVariant.DEFAULT, {
        duration: customDuration,
      });

      expect(toast).toHaveBeenCalledWith('Title', {
        description: 'Message',
        duration: customDuration,
        action: undefined,
      });
    });

    it('should handle toast with action', async () => {
      const action = {
        label: 'Undo',
        onClick: vi.fn(),
      };

      await notificationAPI.showToast('Title', 'Message', NotificationVariant.DEFAULT, {
        action,
      });

      expect(toast).toHaveBeenCalledWith('Title', {
        description: 'Message',
        duration: expect.any(Number),
        action,
      });
    });
  });

  describe('In-App Notifications', () => {
    it('should create an in-app notification', async () => {
      const result = await notificationAPI.createInAppNotification(
        'test-user',
        'New Message',
        'You have a new message'
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(NotificationStatus.SENT);
      expect(result.notification).toBeDefined();
      expect(result.notification.type).toBe(NotificationType.IN_APP);

      // Check that notification was stored
      const notifications = notificationAPI.getInAppNotifications('test-user');
      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toBe('New Message');
      expect(notifications[0].message).toBe('You have a new message');
      expect(notifications[0].read).toBe(false);
    });

    it('should retrieve unread notifications for a user', async () => {
      // Create two notifications
      await notificationAPI.createInAppNotification('test-user', 'Title 1', 'Message 1');
      await notificationAPI.createInAppNotification('test-user', 'Title 2', 'Message 2');

      const notifications = notificationAPI.getInAppNotifications('test-user');
      expect(notifications.length).toBe(2);
      expect(notifications[0].title).toBe('Title 2'); // Most recent first
    });

    it('should mark a notification as read', async () => {
      // Create a notification
      const result = await notificationAPI.createInAppNotification('test-user', 'Title', 'Message');
      const notificationId = (result.notification as InAppNotification).id;

      // Mark as read
      const updatedNotification = notificationAPI.markAsRead(notificationId!);

      expect(updatedNotification).not.toBeNull();
      expect(updatedNotification!.read).toBe(true);
      expect(updatedNotification!.readAt).toBeDefined();

      // Check that it's marked as read in the store
      const notifications = notificationAPI.getInAppNotifications('test-user', true);
      const readNotification = notifications.find(n => n.id === notificationId);
      expect(readNotification!.read).toBe(true);
    });

    it('should delete a notification', async () => {
      // Create a notification
      const result = await notificationAPI.createInAppNotification('test-user', 'Title', 'Message');
      const notificationId = (result.notification as InAppNotification).id;

      // Verify it exists
      let notifications = notificationAPI.getInAppNotifications('test-user');
      expect(notifications.length).toBe(1);

      // Delete it
      const deleteResult = notificationAPI.deleteNotification(notificationId!);
      expect(deleteResult).toBe(true);

      // Verify it's gone
      notifications = notificationAPI.getInAppNotifications('test-user');
      expect(notifications.length).toBe(0);
    });

    it('should clear all notifications for a user', async () => {
      // Create multiple notifications
      await notificationAPI.createInAppNotification('test-user', 'Title 1', 'Message 1');
      await notificationAPI.createInAppNotification('test-user', 'Title 2', 'Message 2');
      await notificationAPI.createInAppNotification('test-user', 'Title 3', 'Message 3');

      // Create a notification for another user (should not be deleted)
      await notificationAPI.createInAppNotification('other-user', 'Other Title', 'Other Message');

      // Clear notifications for test-user
      const clearedCount = notificationAPI.clearUserNotifications('test-user');
      expect(clearedCount).toBe(3);

      // Check test-user notifications are gone
      const testUserNotifications = notificationAPI.getInAppNotifications('test-user');
      expect(testUserNotifications.length).toBe(0);

      // Check other-user notifications remain
      const otherUserNotifications = notificationAPI.getInAppNotifications('other-user');
      expect(otherUserNotifications.length).toBe(1);
    });
  });
});
