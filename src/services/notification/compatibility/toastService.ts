/**
 * Notification Service - Toast Compatibility Layer
 *
 * This file provides backward compatibility for legacy toast notification code.
 * New code should use the consolidated API directly.
 *
 * @deprecated Use the notification API and hooks directly from '@/services/notification'
 */

import { notificationAPI } from '../api/notificationAPI';
import { NotificationVariant, ToastNotification } from '../core/types';

/**
 * Legacy toast service for backward compatibility
 * @deprecated Use notificationAPI from '@/services/notification' instead
 */
export class ToastService {
  /**
   * Show a regular toast notification
   * @deprecated Use notificationAPI.showToast() instead
   */
  static show(message: string, title: string = '', options: Partial<ToastNotification> = {}): void {
    notificationAPI.showToast(
      title || 'Notification',
      message,
      NotificationVariant.DEFAULT,
      options
    );
  }

  /**
   * Show a success toast notification
   * @deprecated Use notificationAPI.showSuccessToast() instead
   */
  static success(
    message: string,
    title: string = 'Success',
    options: Partial<ToastNotification> = {}
  ): void {
    notificationAPI.showSuccessToast(title, message, options);
  }

  /**
   * Show an info toast notification
   * @deprecated Use notificationAPI.showInfoToast() instead
   */
  static info(
    message: string,
    title: string = 'Information',
    options: Partial<ToastNotification> = {}
  ): void {
    notificationAPI.showInfoToast(title, message, options);
  }

  /**
   * Show a warning toast notification
   * @deprecated Use notificationAPI.showWarningToast() instead
   */
  static warning(
    message: string,
    title: string = 'Warning',
    options: Partial<ToastNotification> = {}
  ): void {
    notificationAPI.showWarningToast(title, message, options);
  }

  /**
   * Show an error toast notification
   * @deprecated Use notificationAPI.showErrorToast() instead
   */
  static error(
    message: string,
    title: string = 'Error',
    options: Partial<ToastNotification> = {}
  ): void {
    notificationAPI.showErrorToast(title, message, options);
  }

  /**
   * Dismiss all toast notifications
   * @deprecated No direct equivalent, use native sonner toast.dismiss() if needed
   */
  static dismissAll(): void {
    // Use direct sonner functionality which is re-exported by notification service
    const toast = require('sonner').toast;
    toast.dismiss();
  }
}

/**
 * Legacy alert functions for backward compatibility
 * @deprecated Use notificationAPI from '@/services/notification' instead
 */
export class AlertService {
  /**
   * Show an alert message
   * @deprecated Use notificationAPI.showToast() instead
   */
  static show(message: string, title: string = ''): void {
    notificationAPI.showToast(title || 'Alert', message);
  }

  /**
   * Show a success alert
   * @deprecated Use notificationAPI.showSuccessToast() instead
   */
  static success(message: string, title: string = 'Success'): void {
    notificationAPI.showSuccessToast(title, message);
  }

  /**
   * Show an error alert
   * @deprecated Use notificationAPI.showErrorToast() instead
   */
  static error(message: string, title: string = 'Error'): void {
    notificationAPI.showErrorToast(title, message);
  }
}

// Default export for legacy imports
export default ToastService;
