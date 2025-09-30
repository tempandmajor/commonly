/**
 * Dashboard component types
 */

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

export interface LoadTestResult {
  id: string;
  name: string;
  timestamp: Date;
  status: 'passed' | 'failed' | 'running';
  metrics: {
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
  };
}

export interface ServicePerformanceData {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  responseTime: number;
  errorRate: number;
  uptime: number;
}

export interface ServicePerformanceMetrics {
  avgResponseTime: number;
  errorRate: number;
  throughput: number;
  uptime: number;
}

export enum PerformanceAlertLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
