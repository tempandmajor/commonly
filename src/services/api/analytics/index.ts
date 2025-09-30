/**
 * Analytics API Module
 *
 * Provides functions to fetch analytics and service metrics data using the consolidated API client.
 */

import { appClient } from '../client/clients';
import type { PerformanceMetric, ServiceMetric } from '@/components/dashboard/performanceData';

/**
 * Fetch performance metrics from the backend.
 */
export async function getPerformanceMetrics(): Promise<PerformanceMetric[]> {
  // Using the app client instead of direct Supabase calls to avoid typing issues
  const response = await appClient.get<PerformanceMetric[]>('/analytics/performance');
  return response.data;
}

/**
 * Fetch service metrics from the backend.
 */
export async function getServiceMetrics(): Promise<ServiceMetric[]> {
  // Using the app client instead of direct Supabase calls to avoid typing issues
  const response = await appClient.get<ServiceMetric[]>('/analytics/services');
  return response.data;
}
