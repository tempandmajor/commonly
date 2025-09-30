/**
 * @file Consolidated API exports for User Service
 * Exports all API modules as namespaced objects for easier imports
 */

import * as authFunctions from './auth';
import * as profileFunctions from './profile';
import * as storageFunctions from './storage';
import * as settingsFunctions from './settings';
import * as preferencesFunctions from './preferences';

// Export as namespaced objects
export const authAPI = authFunctions;
export const profileAPI = profileFunctions;
export const storageAPI = storageFunctions;
export const settingsAPI = settingsFunctions;
export const preferencesAPI = preferencesFunctions;

// Also export all functions directly for backwards compatibility
export * from './auth';
export * from './profile';
export * from './storage';
export * from './settings';
export * from './preferences';
