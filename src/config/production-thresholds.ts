/**
 * Production threshold configurations
 */

export const PRODUCTION_THRESHOLDS = {
  responseTime: 2000, // 2 seconds
  errorRate: 0.01, // 1%
  cpuUsage: 80, // 80%
  memoryUsage: 85, // 85%
};

export async function registerProductionThresholds(): Promise<void> {}
