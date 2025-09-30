/**
 * Notification channels configuration
 */

import { AlertSeverity } from './alertSystem';

export interface EmailNotificationConfig {
  enabled: boolean;
  recipients: string[];
  minSeverity: AlertSeverity;
}

export interface SlackNotificationConfig {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
  minSeverity: AlertSeverity;
}

export function configureEmailNotifications(config: EmailNotificationConfig) {
  // Store email configuration
}

export function configureSlackNotifications(config: SlackNotificationConfig) {
  // Store Slack configuration
}
