import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

/**
 * Performance monitoring utility for tracking Core Web Vitals
 * and application performance metrics
 */

interface PerformanceData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

class PerformanceMonitor {
  private metrics: PerformanceData[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.isEnabled =
      process.env.NODE_ENV as string === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORI as string === 'true';

    if (this.isEnabled) {
      this.initializeWebVitals();
      this.initializeCustomMetrics();
    }
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializeWebVitals() {
    const handleMetric = (metric: Metric) => {
      this.recordMetric({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    };

    // Monitor Core Web Vitals (using available functions)
    onCLS(handleMetric);
    onINP(handleMetric); // Interaction to Next Paint (replaces FID)
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
  }

  /**
   * Initialize custom application metrics
   */
  private initializeCustomMetrics() {
    // Monitor page load time
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.recordMetric({
        name: 'page_load_time',
        value: loadTime,
        rating: loadTime < 2000 ? 'good' : loadTime < 4000 ? 'needs-improvement' : 'poor',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Monitor navigation performance
    this.monitorNavigation();

    // Monitor API response times
    this.monitorAPIPerformance();
  }

  /**
   * Monitor navigation performance
   */
  private monitorNavigation() {
    let navigationStart = performance.now();

    // Monitor route changes (for SPA)
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = ((data: any, unused: string, url?: string | URL | null) => {
      const navigationTime = performance.now() - navigationStart;
      this.recordMetric({
        name: 'navigation_time',
        value: navigationTime,
        rating: navigationTime < 100 ? 'good' : navigationTime < 300 ? 'needs-improvement' : 'poor',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });

      navigationStart = performance.now();
      return originalPushState(data, unused, url ?? null);
    }) as History['pushState'];

    history.replaceState = ((data: any, unused: string, url?: string | URL | null) => {
      const navigationTime = performance.now() - navigationStart;
      this.recordMetric({
        name: 'navigation_time',
        value: navigationTime,
        rating: navigationTime < 100 ? 'good' : navigationTime < 300 ? 'needs-improvement' : 'poor',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });

      navigationStart = performance.now();
      return originalReplaceState(data, unused, url ?? null);
    }) as History['replaceState'];
  }

  /**
   * Monitor API response times
   */
  private monitorAPIPerformance() {
    // Intercept fetch requests
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      const requestUrl =
        typeof args[0] === 'string'
          ? args[0]
          : args[0] instanceof Request
            ? args[0].url
            : args[0] instanceof URL
              ? args[0].href
              : 'unknown';

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        this.recordMetric({
          name: 'api_response_time',
          value: responseTime,
          rating: responseTime < 200 ? 'good' : responseTime < 500 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
          url: requestUrl,
          userAgent: navigator.userAgent,
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        this.recordMetric({
          name: 'api_error',
          value: responseTime,
          rating: 'poor',
          timestamp: Date.now(),
          url: requestUrl,
          userAgent: navigator.userAgent,
        });

        throw error;
      }
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(data: PerformanceData) {
    this.metrics.push(data);

    // Send to analytics service (replace with your analytics endpoint)
    this.sendToAnalytics(data);

    // Log poor performance in development
    if (process.env.NODE_ENV as string === 'development' && data.rating === 'poor') {
    }

    // Keep only last 100 metrics in memory
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Send metrics to analytics service
   */
  private async sendToAnalytics(data: PerformanceData) {
    try {
      // Replace with your analytics endpoint
      const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOI as string;

      if (analyticsEndpoint) {
        await fetch(analyticsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'performance',
            data,
            session_id: this.getSessionId(),
            user_id: this.getUserId(),
          }),
        });
      }
    } catch (_error) {
      // Error handling silently ignored
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('performance_session_id');
    if (!sessionId) {
      const rand = Math.random().toString(36).substr(2, 9);
      sessionId = `session_${Date.now()}_${rand}`;
      sessionStorage.setItem('performance_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get user ID if available
   */
  private getUserId(): string | null {
    // Try to get user ID from localStorage or other storage
    try {
      const user = localStorage.getItem('supabase.auth.token');
      if (user) {
        const parsed = JSON.parse(user) as any;
        return parsed.user?.id || null;
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary() {
    const summary = {
      total_metrics: this.metrics.length,
      good: this.metrics.filter(m => m.rating === 'good').length,
      needs_improvement: this.metrics.filter(m => m.rating === 'needs-improvement').length,
      poor: this.metrics.filter(m => m.rating === 'poor').length,
      average_values: {} as Record<string, number>,
    };

    // Calculate averages for each metric type
    const metricTypes = [...new Set(this.metrics.map(m => m.name))];
    metricTypes.forEach(type => {
      const typeMetrics = this.metrics.filter(m => m.name === type);
      if (typeMetrics.length > 0) {
        summary.average_values[type] =
          typeMetrics.reduce((sum, m) => sum + m.value, 0) / typeMetrics.length;
      }
    });

    return summary;
  }

  /**
   * Get recent metrics
   */
  public getRecentMetrics(limit: number = 10): PerformanceData[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Clear all metrics
   */
  public clearMetrics() {
    this.metrics = [];
  }

  /**
   * Enable/disable monitoring
   */
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// Export utilities for manual tracking
export const trackCustomMetric = (
  name: string,
  value: number,
  rating?: 'good' | 'needs-improvement' | 'poor'
) => {
  if (!rating) {
    // Auto-determine rating based on common thresholds
    if (name.includes('time') || name.includes('duration')) {
      rating = value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor';
    } else {
      rating = 'good'; // Default for non-time metrics
    }
  }

  performanceMonitor['recordMetric']({
    name,
    value,
    rating,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  });
};

export const getPerformanceSummary = () => performanceMonitor.getPerformanceSummary();
export const getRecentMetrics = (limit?: number) => performanceMonitor.getRecentMetrics(limit);

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  return {
    trackCustomMetric,
    getPerformanceSummary,
    getRecentMetrics,
    clearMetrics: () => performanceMonitor.clearMetrics(),
  };
};

