/**
 * Production Service - ALL MOCKS DISABLED
 *
 * This file completely disables all mock functionality for production launch.
 * All services must use real implementations.
 */

// PRODUCTION MODE: All mocks are disabled
export const ENABLE_REAL_DATA = true;
export const ENABLE_MOCKS = false;
export const MOCK_DELAY = 0;

// Production warning
console.warn('🚨 PRODUCTION MODE: All mocks disabled - using real implementations only');

// All mock functions return null/empty for production
export const mockEvents = null;
export const mockProducts = null;
export const mockProjects = null;
export const mockReports = null;
export const mockUsers = null;
export const mockCategories = [];
export const mockLocations = null;
export const mockStoreProducts = null;
export const mockTickets = null;

// No delays in production
export const simulateDelay = async (delay: number = 0) => {
  return Promise.resolve();
};

// Force real implementations
export const shouldUseMock = (feature?: string): boolean => {
  return false; // Never use mocks in production
};

// Force real data usage
export const useRealData = () => true;
