/**
 * Analytics API
 * Provides functions to fetch analytics and service metrics data.
 */

import { supabase } from '@/integrations/supabase/client';
import type { PerformanceMetric, ServiceMetric } from '@/components/dashboard/performanceData';

/**
 * Fetch performance metrics from the backend.
 */
export async function getPerformanceMetrics(): Promise<PerformanceMetric[]> {
  try {
    const { data, error } = await supabase.from('performance_metrics').select('*');

    if (error) throw error;

    // Transform data to match PerformanceMetric interface
    return (data || []).map(item => ({
      timestamp: new Date(item.created_at),
      value: item.value,
      label: item.label,
    }));
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return [];
  }
}

/**
 * Fetch service metrics from the backend.
 */
export async function getServiceMetrics(): Promise<ServiceMetric[]> {
  try {
    const { data, error } = await supabase.from('service_metrics').select('*');

    if (error) throw error;

    // Transform data to match ServiceMetric interface
    return (data || []).map(item => ({
      name: item.name,
      responseTime: item.response_time,
      errorRate: item.error_rate,
      requestCount: item.request_count,
    }));
  } catch (error) {
    console.error('Error fetching service metrics:', error);
    return [];
  }
}

/**
 * Analytics API object with all methods
 */
export const analyticsAPI = {
  getPerformanceMetrics,
  getServiceMetrics,
};
