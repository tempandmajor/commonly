/**
 * Management API Module
 *
 * Provides functions to fetch management dashboard data using the consolidated API client.
 */

import { appClient } from '../client/clients';

// Define types for management data
interface ManagementData {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    revenue: number;
    growth: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  // Add other management data properties as needed
}

/**
 * Fetch management dashboard data from the backend.
 */
export async function getManagementData(): Promise<ManagementData> {
  const response = await appClient.get<ManagementData>('/management/dashboard');
  return response.data;
}
