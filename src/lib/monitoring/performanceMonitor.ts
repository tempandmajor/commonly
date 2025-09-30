/**
 * Production Performance Monitoring
 * Tracks and reports on application performance metrics
 */

import { logger } from '../logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  tags?: Record<string, string> | undefined;
}

export interface PerformanceThresholds {
  pageLoad: number; // ms
  apiCall: number; // ms
  renderTime: number; // ms
  bundleSize: number; // bytes
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 500;

  private readonly thresholds: PerformanceThresholds = {
    pageLoad: 3000, // 3 seconds
    apiCall: 2000, // 2 seconds
    renderTime: 100, // 100ms
    bundleSize: 500000, // 500KB
  };

  private constructor() {
    this.initializeWebVitals();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.startTime, 'ms', {
            type: 'web-vital',
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        logger.warn('LCP observer not supported', { error: e });
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            this.recordMetric('FID', fid, 'ms', {
              type: 'web-vital',
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        logger.warn('FID observer not supported', { error: e });
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Report CLS on page unload
        window.addEventListener('beforeunload', () => {
          this.recordMetric('CLS', clsScore, 'count', {
            type: 'web-vital',
          });
        });
      } catch (e) {
        logger.warn('CLS observer not supported', { error: e });
      }
    }

    // Monitor Navigation Timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          this.recordMetric('DNS', perfData.domainLookupEnd - perfData.domainLookupStart, 'ms');
          this.recordMetric('TCP', perfData.connectEnd - perfData.connectStart, 'ms');
          this.recordMetric('TTFB', perfData.responseStart - perfData.requestStart, 'ms');
          this.recordMetric('Download', perfData.responseEnd - perfData.responseStart, 'ms');
          this.recordMetric('DOM Processing', perfData.domComplete - perfData.domInteractive, 'ms');
          this.recordMetric('Total Load Time', perfData.loadEventEnd - perfData.fetchStart, 'ms');
        }
      }, 0);
    });
  }

  /**
   * Record a performance metric
   */
  public recordMetric(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' = 'ms',
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Check against thresholds
    this.checkThreshold(metric);

    // Log in development
    if (process.env.NODE_ENV as string === 'development') {
      logger.debug(`Performance: ${name}`, {
        value: `${value.toFixed(2)}${unit}`,
        tags,
      });
    }
  }

  /**
   * Check if metric exceeds threshold
   */
  private checkThreshold(metric: PerformanceMetric): void {
    const thresholdKey = this.getThresholdKey(metric.name);
    if (!thresholdKey) return;

    const threshold = this.thresholds[thresholdKey];
    if (metric.value > threshold) {
      logger.warn(`Performance threshold exceeded: ${metric.name}`, {
        value: metric.value,
        threshold,
        unit: metric.unit,
        tags: metric.tags,
      });

      // Send to monitoring service in production
      if (process.env.NODE_ENV as string === 'production') {
        this.reportSlowMetric(metric, threshold);
      }
    }
  }

  /**
   * Get threshold key for metric name
   */
  private getThresholdKey(metricName: string): keyof PerformanceThresholds | null {
    const lowerName = metricName.toLowerCase();

    if (lowerName.includes('load') || lowerName.includes('ttfb')) {
      return 'pageLoad';
    }
    if (lowerName.includes('api') || lowerName.includes('fetch')) {
      return 'apiCall';
    }
    if (lowerName.includes('render') || lowerName.includes('paint')) {
      return 'renderTime';
    }

    return null;
  }

  /**
   * Report slow metric to monitoring service
   */
  private reportSlowMetric(metric: PerformanceMetric, threshold: number): void {
    // Implement reporting to your monitoring service
    // Example: DataDog, New Relic, etc.
    console.warn('Slow metric detected:', metric.name, metric.value, 'threshold:', threshold);
  }

  /**
   * Mark the start of a performance measurement
   */
  public mark(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  }

  /**
   * Measure time between two marks
   */
  public measure(name: string, startMark: string, endMark?: string): number | null {
    if (typeof window === 'undefined' || !window.performance) return null;

    try {
      if (endMark) {
        window.performance.measure(name, startMark, endMark);
      } else {
        window.performance.mark(`${name}-end`);
        window.performance.measure(name, startMark, `${name}-end`);
      }

      const measure = window.performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        this.recordMetric(name, measure.duration, 'ms');
        return measure.duration;
      }
    } catch (e) {
      logger.error('Failed to measure performance', e);
    }

    return null;
  }

  /**
   * Time a function execution
   */
  public async timeAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', tags);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * Time a synchronous function
   */
  public time<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', tags);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms', { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average value for a metric
   */
  public getAverageMetric(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get performance report
   */
  public getReport(): {
    metrics: PerformanceMetric[];
    averages: Record<string, number>;
    violations: PerformanceMetric[];
  } {
    const uniqueNames = [...new Set(this.metrics.map(m => m.name))];
    const averages: Record<string, number> = {};

    uniqueNames.forEach(name => {
      const avg = this.getAverageMetric(name);
      if (avg !== null) {
        averages[name] = avg;
      }
    });

    const violations = this.metrics.filter(m => {
      const thresholdKey = this.getThresholdKey(m.name);
      return thresholdKey && m.value > this.thresholds[thresholdKey];
    });

    return {
      metrics: this.metrics,
      averages,
      violations,
    };
  }
}

// Export singleton
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export convenience functions
export const measurePerformance = (name: string, fn: () => any) => {
  return performanceMonitor.time(name, fn);
};

export const measureAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  return performanceMonitor.timeAsync(name, fn);
};