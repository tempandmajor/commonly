/**
 * Performance monitoring utility for tracking application performance
 * Provides metrics collection and reporting capabilities
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'navigation' | 'api' | 'render' | 'user-interaction' | 'custom';
  metadata?: Record<string, unknown> | undefined;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled =
      process.env.NODE_ENV as string === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORI as string === 'true';
  }

  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric['category'] = 'custom',
    metadata?: Record<string, unknown>
  ) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category,
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log slow operations in development
    if (process.env.NODE_ENV as string === 'development' && value > 1000) {
      console.warn(`[Performance] Slow operation detected: ${name} took ${value}ms`, {
        category,
        metadata,
      });
    }
  }

  getMetrics(category?: PerformanceMetric['category'], timeWindowMs?: number): PerformanceMetric[] {
    let filtered = this.metrics;

    if (category) {
      filtered = filtered.filter(m => m.category === category);
    }

    if (timeWindowMs) {
      const cutoff = Date.now() - timeWindowMs;
      filtered = filtered.filter(m => m.timestamp >= cutoff);
    }

    return filtered;
  }

  getAverageMetric(name: string, timeWindowMs?: number): number | null {
    const metrics = this.getMetrics(undefined, timeWindowMs).filter(m => m.name === name);

    if (metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export const recordPerformanceMetric = (
  name: string,
  value: number,
  category?: PerformanceMetric['category'],
  metadata?: Record<string, unknown>
) => {
  performanceMonitor.recordMetric(name, value, category, metadata);
};

export const logPerformanceSummary = (timeWindowMinutes: number = 5) => {
  const timeWindowMs = timeWindowMinutes * 60 * 1000;
  const metrics = performanceMonitor.getMetrics(undefined, timeWindowMs);

  if (metrics.length === 0) {
    console.info(`[Performance] No metrics recorded in the last ${timeWindowMinutes} minutes`);
    return;
  }

  console.info(`[Performance Summary] Last ${timeWindowMinutes} minutes:`, {
    totalMetrics: metrics.length,
    categories: metrics.reduce(
      (acc, m) => {
        acc[m.category] = (acc[m.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    averages: ['navigation', 'api', 'render'].reduce(
      (acc, category) => {
        const categoryMetrics = metrics.filter(m => m.category === category);
        if (categoryMetrics.length > 0) {
          const avg = categoryMetrics.reduce((sum, m) => sum + m.value, 0) / categoryMetrics.length;
          acc[category] = Math.round(avg);
        }
        return acc;
      },
      {} as Record<string, number>
    ),
  });
};

export default PerformanceMonitor;
