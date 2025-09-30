/**
 * Performance data types and utilities
 */

import { analyticsAPI } from '@/services/api/analyticsAPI';

export interface PerformanceMetric {
  timestamp: Date;
  value: number;
  label: string;
}

export interface ServiceMetric {
  name: string;
  responseTime: number;
  errorRate: number;
  requestCount: number;
}

export async function getPerformanceData(): Promise<PerformanceMetric[]> {
  try {
    return await analyticsAPI.getPerformanceMetrics();
  } catch (error) {
    return [];
  }
}

export async function getServiceMetrics(): Promise<ServiceMetric[]> {
  try {
    return await analyticsAPI.getServiceMetrics();
  } catch (error) {
    return [];
  }
}

export function getServicePerformanceData() {
  return [
    {
      id: '1',
      name: 'API Service',
      status: 'healthy' as const,
      responseTime: 120,
      errorRate: 0.01,
      uptime: 99.9,
    },
    {
      id: '2',
      name: 'Database',
      status: 'warning' as const,
      responseTime: 250,
      errorRate: 0.02,
      uptime: 99.5,
    },
  ];
}
