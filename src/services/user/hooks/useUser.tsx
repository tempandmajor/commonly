/**
 * @file React hooks for User Service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Import API modules
import { authAPI, profileAPI, settingsAPI, preferencesAPI, storageAPI } from '../api';

// Import types
import { User, UserUpdateData, UserSettings, UserPreferences } from '../core/types';

/**
 * Hook for getting the current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => authAPI.getCurrentUser(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook for getting a user by ID
 * @param userId User ID
 */
export function useUser(userId?: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => (userId ? authAPI.getUserById(userId) : null),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for getting a user by username
 * @param username Username
 */
export function useUserByUsername(username?: string) {
  return useQuery({
    queryKey: ['user', 'byUsername', username],
    queryFn: async () => (username ? authAPI.getUserByUsername(username) : null),
    enabled: !!username,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for updating user profile data
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UserUpdateData }) =>
      profileAPI.updateUserProfile(userId, data),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

/**
 * Hook for uploading a profile image
 */
export function useUploadProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) =>
      storageAPI.uploadProfileImage(userId, file),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

/**
 * Hook for getting user settings
 * @param userId User ID
 */
export function useUserSettings(userId?: string) {
  return useQuery({
    queryKey: ['userSettings', userId],
    queryFn: async () => (userId ? settingsAPI.getUserSettings(userId) : null),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for updating user settings
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, settings }: { userId: string; settings: Partial<UserSettings> }) =>
      settingsAPI.updateUserSettings(userId, settings),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['userSettings', variables.userId] });
    },
  });
}

/**
 * Hook for getting user preferences
 * @param userId User ID
 */
export function useUserPreferences(userId?: string) {
  return useQuery({
    queryKey: ['userPreferences', userId],
    queryFn: async () => (userId ? preferencesAPI.getUserPreferences(userId) : null),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for updating user preferences
 */
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      preferences,
    }: {
      userId: string;
      preferences: Partial<UserPreferences>;
    }) => preferencesAPI.updateUserPreferences(userId, preferences),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['userPreferences', variables.userId] });
    },
  });
}

/**
 * Hook for uploading a user file
 */
export function useUploadUserFile() {
  return useMutation({
    mutationFn: async ({ userId, file, path }: { userId: string; file: File; path?: string }) =>
      storageAPI.uploadUserFile(userId, file, path),
  });
}

/**
 * Hook for listing user files
 * @param userId User ID
 * @param path Optional path
 */
export function useUserFiles(userId?: string, path?: string) {
  return useQuery({
    queryKey: ['userFiles', userId, path],
    queryFn: async () => (userId ? storageAPI.listUserFiles(userId, path) : []),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook for adding platform credit
 */
export function useAddPlatformCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) =>
      settingsAPI.addPlatformCredit(userId, amount),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['userSettings', variables.userId] });
    },
  });
}

/**
 * Hook for signing out
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => authAPI.signOut(),
    onSuccess: () => {
      // Clear all user-related queries from cache
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
}
