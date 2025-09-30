/**
 * Monitoring System Initialization
 *
 * This module provides centralized initialization for the monitoring system,
 * including alert thresholds, notification channels, and performance reviews.
 */

import { createLogger } from '../logger';
import { env, Environment, isProduction } from '../../config/environment';
import { configureAlertSystem, AlertSeverity } from './alertSystem';
import { configureEmailNotifications, configureSlackNotifications } from './notificationChannels';
import { configurePerformanceReviews, ReviewFrequency } from './performanceReviews';
import {
  PRODUCTION_THRESHOLDS,
  registerProductionThresholds,
} from '../../config/production-thresholds';

const logger = createLogger('utils/monitoring/initialize');

/**
 * Initialize the monitoring system with environment-specific settings
 */
export async function initializeMonitoringSystem(): Promise<boolean> {
  try {
    logger.info('Initializing monitoring system');

    // Configure alert system
    configureAlertSystem({
      enabled: env.enablePerformanceMonitoring !== false,
      minSeverity: isProduction ? AlertSeverity.WARNING : AlertSeverity.INFO,
      throttleMs: isProduction ? 300000 : 60000, // 5 minutes in prod, 1 minute in dev
    });

    // Configure notification channels
    configureEmailNotifications({
      enabled: env.enableEmailAlerts === true,
      recipients: env.alertEmailRecipients || [],
      minSeverity: isProduction ? AlertSeverity.WARNING : AlertSeverity.CRITICAL,
    });

    configureSlackNotifications({
      enabled: env.enableSlackAlerts === true,
      webhookUrl: env.slackWebhookUrl || '',
      channel: env.slackAlertChannel || '#alerts',
      minSeverity: isProduction ? AlertSeverity.WARNING : AlertSeverity.CRITICAL,
    });

    // Configure performance reviews
    configurePerformanceReviews({
      enabled: true,
      frequency: isProduction ? ReviewFrequency.WEEKLY : ReviewFrequency.BIWEEKLY,
      emailReport: env.enableEmailAlerts === true,
    });

    // Register environment-specific thresholds
    if (env.currentEnv === Environment.PRODUCTION) {
      logger.info('Registering production alert thresholds');
      await registerProductionThresholds();
    } else {
      logger.info(`Using default thresholds for ${env.currentEnv} environment`);
    }

    logger.info('Monitoring system initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize monitoring system', error);
    return false;
  }
}
