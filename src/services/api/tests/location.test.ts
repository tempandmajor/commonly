/**
 * Location API Tests
 *
 * Tests for the consolidated location API module.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appClient } from '../client/clients';
import * as LocationAPI from '../location';

// Mock the API client
vi.mock('../client/clients', () => ({
  appClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Location API', () => {
  // Mock data
  const mockEvents = [
    { id: '1', name: 'Concert', location: 'Downtown Arena' },
    { id: '2', name: 'Conference', location: 'Convention Center' },
  ];

  const mockLocations = [
    { name: 'Downtown' },
    { name: 'Uptown' },
    { name: 'Midtown' },
    { name: 'West End' },
    { name: 'East Side' },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchEventsNearLocation', () => {
    it('should fetch nearby events successfully', async () => {
      // Arrange
      const lat = 37.7749;
      const lng = -122.4194;
      const radiusKm = 10;
      const mockResponse = { data: mockEvents, status: 200, ok: true };
      (appClient.get as any).mockResolvedValueOnce(mockResponse);

      // Act
      const result = await LocationAPI.fetchEventsNearLocation(lat, lng, radiusKm);

      // Assert
      expect(appClient.get).toHaveBeenCalledWith(
        `/events/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`
      );
      expect(result).toEqual(mockEvents);
    });

    it('should use default radius when not provided', async () => {
      // Arrange
      const lat = 37.7749;
      const lng = -122.4194;
      const defaultRadius = 25; // Default value in the function
      const mockResponse = { data: mockEvents, status: 200, ok: true };
      (appClient.get as any).mockResolvedValueOnce(mockResponse);

      // Act
      const result = await LocationAPI.fetchEventsNearLocation(lat, lng);

      // Assert
      expect(appClient.get).toHaveBeenCalledWith(
        `/events/nearby?lat=${lat}&lng=${lng}&radius=${defaultRadius}`
      );
      expect(result).toEqual(mockEvents);
    });

    it('should handle errors when fetching nearby events', async () => {
      // Arrange
      const lat = 37.7749;
      const lng = -122.4194;
      const mockError = new Error('Network error');
      (appClient.get as any).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(LocationAPI.fetchEventsNearLocation(lat, lng)).rejects.toThrow('Network error');
    });
  });

  describe('fetchPopularLocations', () => {
    it('should fetch popular locations successfully', async () => {
      // Arrange
      const mockResponse = { data: mockLocations, status: 200, ok: true };
      (appClient.get as any).mockResolvedValueOnce(mockResponse);

      // Act
      const result = await LocationAPI.fetchPopularLocations();

      // Assert
      expect(appClient.get).toHaveBeenCalledWith('/locations/popular?limit=5');
      expect(result).toEqual(mockLocations.map(loc => loc.name));
    });

    it('should handle errors when fetching popular locations', async () => {
      // Arrange
      const mockError = new Error('Server error');
      (appClient.get as any).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(LocationAPI.fetchPopularLocations()).rejects.toThrow('Server error');
    });
  });

  describe('saveUserLocation', () => {
    it('should save user location successfully', async () => {
      // Arrange
      const userId = 'user123';
      const location = 'San Francisco';
      const mockResponse = { status: 200, ok: true };
      (appClient.post as any).mockResolvedValueOnce(mockResponse);

      // Act
      await LocationAPI.saveUserLocation(userId, location);

      // Assert
      expect(appClient.post).toHaveBeenCalledWith('/users/location', { userId, location });
    });

    it('should handle errors when saving user location', async () => {
      // Arrange
      const userId = 'user123';
      const location = 'San Francisco';
      const mockError = new Error('Authorization error');
      (appClient.post as any).mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(LocationAPI.saveUserLocation(userId, location)).rejects.toThrow(
        'Authorization error'
      );
    });
  });
});
