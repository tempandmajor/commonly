/**
 * Alert system configuration
 */

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface AlertSystemConfig {
  enabled: boolean;
  minSeverity: AlertSeverity;
  throttleMs: number;
}

let alertConfig: AlertSystemConfig = {
  enabled: false,
  minSeverity: AlertSeverity.INFO,
  throttleMs: 60000,
};

export function configureAlertSystem(config: AlertSystemConfig) {
  alertConfig = { ...config };
}

export function getAlertConfig(): AlertSystemConfig {
  return alertConfig;
}
