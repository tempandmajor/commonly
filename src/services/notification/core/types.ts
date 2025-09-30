/**
 * Notification Service - Core Types
 *
 * This file defines the core types and interfaces for the notification service.
 */

/**
 * Notification types
 */
export enum NotificationType {
  TOAST = 'toast',
  IN_APP = 'in-app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

/**
 * Notification status
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Notification variants/styles
 */
export enum NotificationVariant {
  DEFAULT = 'default',
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Base notification interface
 */
export interface BaseNotification {
  id?: string | undefined;
  type: NotificationType;
  title: string;
  message: string;
  variant?: NotificationVariant | undefined;
  priority?: NotificationPriority | undefined;
  timestamp?: number | undefined;
  expiresAt?: number | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Toast notification interface
 */
export interface ToastNotification extends BaseNotification {
  type: NotificationType.TOAST;
  duration?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * In-app notification interface
 */
export interface InAppNotification extends BaseNotification {
  type: NotificationType.IN_APP;
  userId: string;
  status: NotificationStatus;
  read?: boolean;
  readAt?: number;
  link?: string;
  image?: string;
  actions?: Array<{
    label: string;
    action: string;
  }>;
}

/**
 * Email notification interface
 */
export interface EmailNotification extends BaseNotification {
  type: NotificationType.EMAIL;
  recipient: string;
  subject: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  status: NotificationStatus;
}

/**
 * Push notification interface
 */
export interface PushNotification extends BaseNotification {
  type: NotificationType.PUSH;
  userId: string;
  deviceTokens?: string[];
  topic?: string;
  image?: string;
  deepLink?: string;
  status: NotificationStatus;
  badge?: number;
  sound?: string;
}

/**
 * SMS notification interface
 */
export interface SMSNotification extends BaseNotification {
  type: NotificationType.SMS;
  phoneNumber: string;
  status: NotificationStatus;
}

/**
 * Union type for all notification types
 */
export type Notification =
  | ToastNotification
  | InAppNotification
  | EmailNotification
  | PushNotification
  | SMSNotification;

/**
 * Notification event data
 */
export interface NotificationEvent {
  notification: Notification;
  status: NotificationStatus;
  timestamp: number;
  error?: Error | undefined;
}

/**
 * Notification provider interface
 */
export interface NotificationProvider {
  name: string;
  supportedTypes: NotificationType[];
  initialize(): Promise<void>;
  send(notification: Notification): Promise<NotificationEvent>;
}

/**
 * Notification service configuration
 */
export interface NotificationConfig {
  enabled: boolean;
  providers: {
    toast?: boolean | undefined;
    inApp?: boolean | undefined;
    email?: boolean | undefined;
    push?: boolean | undefined;
    sms?: boolean | undefined;
  };
  defaultToastDuration?: number;
  defaultToastPosition?: string;
  maxQueueSize?: number;
  throttleLimit?: number;
  throttleWindow?: number;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  categories?: {
    [key: string]: {
      email?: boolean | undefined;
      push?: boolean | undefined;
      sms?: boolean | undefined;
      inApp?: boolean | undefined;
    };
  };
}

/**
 * Notification error types
 */
export enum NotificationErrorType {
  INITIALIZATION_FAILED = 'initialization_failed',
  SEND_FAILED = 'send_failed',
  PROVIDER_MISSING = 'provider_missing',
  INVALID_NOTIFICATION = 'invalid_notification',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  CONFIGURATION_ERROR = 'configuration_error',
}

/**
 * Notification error class
 */
export class NotificationError extends Error {
  public readonly type: NotificationErrorType;
  public readonly originalError?: Error;

  constructor(message: string, type: NotificationErrorType, originalError?: Error) {
    super(message);
    this.name = 'NotificationError';
    this.type = type;
    this.originalError = originalError;
  }
}
