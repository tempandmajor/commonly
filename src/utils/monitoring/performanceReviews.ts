/**
 * Performance review configuration
 */

export enum ReviewFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export interface PerformanceReviewConfig {
  enabled: boolean;
  frequency: ReviewFrequency;
  emailReport: boolean;
}

export function configurePerformanceReviews(config: PerformanceReviewConfig) {}
