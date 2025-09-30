/**
 * Management API Tests
 *
 * Tests for the consolidated management API module.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appClient } from '../client/clients';
import * as ManagementAPI from '../management';

// Mock the API client
vi.mock('../client/clients', () => ({
  appClient: {
    get: vi.fn(),
  },
}));

describe('Management API', () => {
  // Mock data
  const mockManagementData = {
    metrics: {
      totalUsers: 5000,
      activeUsers: 3200,
      revenue: 125000,
      growth: 12.5,
    },
    recentActivity: [
      {
        id: '1',
        type: 'user_signup',
        description: 'New user registered',
        timestamp: '2025-07-19T10:30:00Z',
      },
      {
        id: '2',
        type: 'payment',
        description: 'Subscription payment received',
        timestamp: '2025-07-19T10:15:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getManagementData', () => {
    it('should fetch management dashboard data successfully', async () => {
      // Arrange
      const mockResponse = { data: mockManagementData, status: 200, ok: true };
      (appClient.get as any).mockResolvedValueOnce(mockResponse);

      // Act
      const result = await ManagementAPI.getManagementData();

      // Assert
      expect(appClient.get).toHaveBeenCalledWith('/management/dashboard');
      expect(result).toEqual(mockManagementData);
    });

    it('should handle errors when fetching management data', async () => {
      // Arrange
      const mockError = new Error('Server error');
      (appClient.get as any).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(ManagementAPI.getManagementData()).rejects.toThrow('Server error');
      expect(appClient.get).toHaveBeenCalledWith('/management/dashboard');
    });
  });
});
