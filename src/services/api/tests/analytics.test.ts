/**
 * Analytics API Tests
 *
 * Tests for the consolidated analytics API module.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appClient } from '../client/clients';
import * as AnalyticsAPI from '../analytics';
import type { PerformanceMetric, ServiceMetric } from '@/components/dashboard/performanceData';

// Mock the API client
vi.mock('../client/clients', () => ({
  appClient: {
    get: vi.fn(),
  },
}));

describe('Analytics API', () => {
  const mockPerformanceMetrics: PerformanceMetric[] = [
    { id: '1', name: 'Response Time', value: 120, unit: 'ms', trend: 'stable' },
    { id: '2', name: 'Error Rate', value: 0.5, unit: '%', trend: 'improving' },
  ];

  const mockServiceMetrics: ServiceMetric[] = [
    { id: '1', name: 'API Service', status: 'healthy', uptime: 99.9 },
    { id: '2', name: 'Database', status: 'healthy', uptime: 99.8 },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getPerformanceMetrics', () => {
    it('should fetch performance metrics successfully', async () => {
      // Arrange
      const mockResponse = { data: mockPerformanceMetrics, status: 200, ok: true };
      (appClient.get as any).mockResolvedValueOnce(mockResponse);

      // Act
      const result = await AnalyticsAPI.getPerformanceMetrics();

      // Assert
      expect(appClient.get).toHaveBeenCalledWith('/analytics/performance');
      expect(result).toEqual(mockPerformanceMetrics);
    });

    it('should handle errors when fetching performance metrics', async () => {
      // Arrange
      const mockError = new Error('Network error');
      (appClient.get as any).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(AnalyticsAPI.getPerformanceMetrics()).rejects.toThrow('Network error');
      expect(appClient.get).toHaveBeenCalledWith('/analytics/performance');
    });
  });

  describe('getServiceMetrics', () => {
    it('should fetch service metrics successfully', async () => {
      // Arrange
      const mockResponse = { data: mockServiceMetrics, status: 200, ok: true };
      (appClient.get as any).mockResolvedValueOnce(mockResponse);

      // Act
      const result = await AnalyticsAPI.getServiceMetrics();

      // Assert
      expect(appClient.get).toHaveBeenCalledWith('/analytics/services');
      expect(result).toEqual(mockServiceMetrics);
    });

    it('should handle errors when fetching service metrics', async () => {
      // Arrange
      const mockError = new Error('Server error');
      (appClient.get as any).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(AnalyticsAPI.getServiceMetrics()).rejects.toThrow('Server error');
      expect(appClient.get).toHaveBeenCalledWith('/analytics/services');
    });
  });
});
