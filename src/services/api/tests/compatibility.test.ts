/**
 * API Compatibility Layer Tests
 *
 * Tests for the compatibility layers that ensure backward compatibility
 * with legacy API functions while using the consolidated API modules.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as AnalyticsAPI from '../analytics';
import * as LocationAPI from '../location';
import * as ManagementAPI from '../management';
import * as AnalyticsAPILegacy from '../compatibility/analyticsAPI';
import * as LocationAPILegacy from '../compatibility/locationAPI';
import * as ManagementAPILegacy from '../compatibility/managementAPI';

// Mock the consolidated API modules
vi.mock('../analytics', () => ({
  getPerformanceMetrics: vi.fn(),
  getServiceMetrics: vi.fn(),
}));

vi.mock('../location', () => ({
  fetchEventsNearLocation: vi.fn(),
  fetchPopularLocations: vi.fn(),
  saveUserLocation: vi.fn(),
}));

vi.mock('../management', () => ({
  getManagementData: vi.fn(),
}));

describe('API Compatibility Layers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Analytics API Compatibility', () => {
    it('should forward getPerformanceMetrics calls to the consolidated API', async () => {
      // Arrange
      const mockMetrics = [
        { id: '1', name: 'Response Time', value: 120, unit: 'ms', trend: 'stable' },
      ];
      (AnalyticsAPI.getPerformanceMetrics as any).mockResolvedValueOnce(mockMetrics);

      // Act
      const result = await AnalyticsAPILegacy.getPerformanceMetrics();

      // Assert
      expect(AnalyticsAPI.getPerformanceMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockMetrics);
    });

    it('should forward getServiceMetrics calls to the consolidated API', async () => {
      // Arrange
      const mockMetrics = [{ id: '1', name: 'API Service', status: 'healthy', uptime: 99.9 }];
      (AnalyticsAPI.getServiceMetrics as any).mockResolvedValueOnce(mockMetrics);

      // Act
      const result = await AnalyticsAPILegacy.getServiceMetrics();

      // Assert
      expect(AnalyticsAPI.getServiceMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockMetrics);
    });

    it('should handle errors from the consolidated API', async () => {
      // Arrange
      const mockError = new Error('API error');
      (AnalyticsAPI.getPerformanceMetrics as any).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(AnalyticsAPILegacy.getPerformanceMetrics()).rejects.toThrow('API error');
    });
  });

  describe('Location API Compatibility', () => {
    it('should forward fetchEventsNearLocation calls to the consolidated API', async () => {
      // Arrange
      const mockEvents = [{ id: '1', name: 'Concert', location: 'Downtown Arena' }];
      const lat = 37.7749;
      const lng = -122.4194;
      const radius = 10;
      (LocationAPI.fetchEventsNearLocation as any).mockResolvedValueOnce(mockEvents);

      // Act
      const result = await LocationAPILegacy.fetchEventsNearLocation(lat, lng, radius);

      // Assert
      expect(LocationAPI.fetchEventsNearLocation).toHaveBeenCalledWith(lat, lng, radius);
      expect(result).toEqual(mockEvents);
    });

    it('should forward fetchPopularLocations calls to the consolidated API', async () => {
      // Arrange
      const mockLocations = ['Downtown', 'Uptown', 'Midtown'];
      (LocationAPI.fetchPopularLocations as any).mockResolvedValueOnce(mockLocations);

      // Act
      const result = await LocationAPILegacy.fetchPopularLocations();

      // Assert
      expect(LocationAPI.fetchPopularLocations).toHaveBeenCalled();
      expect(result).toEqual(mockLocations);
    });

    it('should forward saveUserLocation calls to the consolidated API', async () => {
      // Arrange
      const userId = 'user123';
      const location = 'San Francisco';
      (LocationAPI.saveUserLocation as any).mockResolvedValueOnce(undefined);

      // Act
      await LocationAPILegacy.saveUserLocation(userId, location);

      // Assert
      expect(LocationAPI.saveUserLocation).toHaveBeenCalledWith(userId, location);
    });
  });

  describe('Management API Compatibility', () => {
    it('should forward getManagementData calls to the consolidated API', async () => {
      // Arrange
      const mockData = { metrics: { totalUsers: 5000 } };
      (ManagementAPI.getManagementData as any).mockResolvedValueOnce(mockData);

      // Act
      const result = await ManagementAPILegacy.getManagementData();

      // Assert
      expect(ManagementAPI.getManagementData).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should handle errors from the consolidated API', async () => {
      // Arrange
      const mockError = new Error('Server error');
      (ManagementAPI.getManagementData as any).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(ManagementAPILegacy.getManagementData()).rejects.toThrow('Server error');
    });
  });
});
