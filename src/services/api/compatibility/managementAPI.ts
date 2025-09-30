/**
 * Management API - Compatibility Layer
 *
 * This file provides backward compatibility with the original managementAPI.ts
 * while using the new consolidated API implementation.
 *
 * @deprecated Use the consolidated API from '@/services/api/management' instead
 */

import * as ManagementAPI from '../management';

/**
 * @deprecated Use ManagementAPI.getManagementData instead
 */
export const getManagementData = ManagementAPI.getManagementData;

// Export all functions as default for legacy imports
export default {
  getManagementData,
};
