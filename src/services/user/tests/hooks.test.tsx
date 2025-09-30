/**
 * @file Unit tests for User Service React hooks
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Import hooks
import {
  useCurrentUser,
  useUser,
  useUserByUsername,
  useUpdateProfile,
  useUploadProfileImage,
  useUserSettings,
  useUpdateUserSettings,
  useUserPreferences,
  useUpdateUserPreferences,
  useSignOut,
} from '../hooks';

// Import APIs to mock
import { authAPI, profileAPI, settingsAPI, preferencesAPI, storageAPI } from '../api';

// Mock the API modules
vi.mock('../api', () => ({
  authAPI: {
    getCurrentUser: vi.fn(),
    getUserById: vi.fn(),
    getUserByUsername: vi.fn(),
    signOut: vi.fn(),
  },
  profileAPI: {
    updateUserProfile: vi.fn(),
    createUserProfile: vi.fn(),
    searchUsers: vi.fn(),
    updateUserAvatar: vi.fn(),
  },
  settingsAPI: {
    getUserSettings: vi.fn(),
    updateUserSettings: vi.fn(),
    addPlatformCredit: vi.fn(),
  },
  preferencesAPI: {
    getUserPreferences: vi.fn(),
    updateUserPreferences: vi.fn(),
  },
  storageAPI: {
    uploadProfileImage: vi.fn(),
    uploadUserFile: vi.fn(),
    listUserFiles: vi.fn(),
    deleteUserFile: vi.fn(),
  },
  api: {
    auth: {
      getCurrentUser: vi.fn(),
      getUserById: vi.fn(),
      getUserByUsername: vi.fn(),
      signOut: vi.fn(),
    },
    profile: {
      updateUserProfile: vi.fn(),
      createUserProfile: vi.fn(),
      searchUsers: vi.fn(),
      updateUserAvatar: vi.fn(),
    },
    settings: {
      getUserSettings: vi.fn(),
      updateUserSettings: vi.fn(),
      addPlatformCredit: vi.fn(),
    },
    preferences: {
      getUserPreferences: vi.fn(),
      updateUserPreferences: vi.fn(),
    },
    storage: {
      uploadProfileImage: vi.fn(),
      uploadUserFile: vi.fn(),
      listUserFiles: vi.fn(),
      deleteUserFile: vi.fn(),
    },
  },
}));

// Create a wrapper for the React Query provider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('User Service Hooks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('useCurrentUser', () => {
    it('should fetch current user', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test User' };
      vi.mocked(authAPI.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for the query to resolve
      await waitFor(() => !result.current.isLoading);

      expect(result.current.data).toEqual(mockUser);
      expect(authAPI.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should handle error when fetching user fails', async () => {
      vi.mocked(authAPI.getCurrentUser).mockRejectedValue(new Error('Failed to fetch user'));

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      // Wait for the query to resolve
      await waitFor(() => !result.current.isLoading);

      expect(result.current.error).toBeDefined();
      expect(result.current.isError).toBe(true);
    });
  });

  describe('useUser', () => {
    it('should fetch user by ID', async () => {
      const userId = 'user123';
      const mockUser = { id: userId, email: 'test@example.com', name: 'Test User' };
      vi.mocked(authAPI.getUserById).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUser(userId), {
        wrapper: createWrapper(),
      });

      // Wait for the query to resolve
      await waitFor(() => !result.current.isLoading);

      expect(result.current.data).toEqual(mockUser);
      expect(authAPI.getUserById).toHaveBeenCalledWith(userId);
    });

    it('should not fetch when userId is undefined', async () => {
      const { result } = renderHook(() => useUser(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isIdle).toBe(true);
      expect(authAPI.getUserById).not.toHaveBeenCalled();
    });
  });

  describe('useUserByUsername', () => {
    it('should fetch user by username', async () => {
      const username = 'testuser';
      const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test User', username };
      vi.mocked(authAPI.getUserByUsername).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUserByUsername(username), {
        wrapper: createWrapper(),
      });

      // Wait for the query to resolve
      await waitFor(() => !result.current.isLoading);

      expect(result.current.data).toEqual(mockUser);
      expect(authAPI.getUserByUsername).toHaveBeenCalledWith(username);
    });
  });

  describe('useUpdateProfile', () => {
    it('should update user profile', async () => {
      const userId = 'user123';
      const profileData = { display_name: 'New Name', bio: 'New bio' };
      vi.mocked(profileAPI.updateUserProfile).mockResolvedValue(true);

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(),
      });

      const mutate = result.current.mutate;
      mutate({ userId, data: profileData });

      await waitFor(() => !result.current.isLoading);

      expect(profileAPI.updateUserProfile).toHaveBeenCalledWith(userId, profileData);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle update error', async () => {
      const userId = 'user123';
      const profileData = { display_name: 'New Name' };
      vi.mocked(profileAPI.updateUserProfile).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(),
      });

      const mutate = result.current.mutate;
      mutate({ userId, data: profileData });

      await waitFor(() => !result.current.isLoading);

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('useUploadProfileImage', () => {
    it('should upload profile image', async () => {
      const userId = 'user123';
      const file = new File(['test'], 'profile.jpg', { type: 'image/jpeg' });
      const imageUrl = 'https://example.com/avatars/profile.jpg';

      vi.mocked(storageAPI.uploadProfileImage).mockResolvedValue(imageUrl);

      const { result } = renderHook(() => useUploadProfileImage(), {
        wrapper: createWrapper(),
      });

      const mutate = result.current.mutate;
      mutate({ userId, file });

      await waitFor(() => !result.current.isLoading);

      expect(storageAPI.uploadProfileImage).toHaveBeenCalledWith(userId, file);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBe(imageUrl);
    });
  });

  describe('useUserSettings', () => {
    it('should fetch user settings', async () => {
      const userId = 'user123';
      const mockSettings = {
        userId,
        platformCredit: 100,
        paymentPreferences: { defaultMethod: 'stripe' },
        notifications: { email: true },
        privacy: { isPrivate: false },
      };

      vi.mocked(settingsAPI.getUserSettings).mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useUserSettings(userId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => !result.current.isLoading);

      expect(result.current.data).toEqual(mockSettings);
      expect(settingsAPI.getUserSettings).toHaveBeenCalledWith(userId);
    });
  });

  describe('useUpdateUserSettings', () => {
    it('should update user settings', async () => {
      const userId = 'user123';
      const settings = {
        platformCredit: 200,
        paymentPreferences: { autoRecharge: true },
      };

      vi.mocked(settingsAPI.updateUserSettings).mockResolvedValue(true);

      const { result } = renderHook(() => useUpdateUserSettings(), {
        wrapper: createWrapper(),
      });

      const mutate = result.current.mutate;
      mutate({ userId, settings });

      await waitFor(() => !result.current.isLoading);

      expect(settingsAPI.updateUserSettings).toHaveBeenCalledWith(userId, settings);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('useUserPreferences', () => {
    it('should fetch user preferences', async () => {
      const userId = 'user123';
      const mockPrefs = {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        notifications: { email: true, push: false },
      };

      vi.mocked(preferencesAPI.getUserPreferences).mockResolvedValue(mockPrefs);

      const { result } = renderHook(() => useUserPreferences(userId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => !result.current.isLoading);

      expect(result.current.data).toEqual(mockPrefs);
      expect(preferencesAPI.getUserPreferences).toHaveBeenCalledWith(userId);
    });
  });

  describe('useUpdateUserPreferences', () => {
    it('should update user preferences', async () => {
      const userId = 'user123';
      const preferences = {
        theme: 'light',
        notifications: { push: true },
      };

      vi.mocked(preferencesAPI.updateUserPreferences).mockResolvedValue(true);

      const { result } = renderHook(() => useUpdateUserPreferences(), {
        wrapper: createWrapper(),
      });

      const mutate = result.current.mutate;
      mutate({ userId, preferences });

      await waitFor(() => !result.current.isLoading);

      expect(preferencesAPI.updateUserPreferences).toHaveBeenCalledWith(userId, preferences);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('useSignOut', () => {
    it('should sign out user', async () => {
      vi.mocked(authAPI.signOut).mockResolvedValue(true);

      const { result } = renderHook(() => useSignOut(), {
        wrapper: createWrapper(),
      });

      const mutate = result.current.mutate;
      mutate();

      await waitFor(() => !result.current.isLoading);

      expect(authAPI.signOut).toHaveBeenCalled();
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle sign out error', async () => {
      vi.mocked(authAPI.signOut).mockRejectedValue(new Error('Sign out failed'));

      const { result } = renderHook(() => useSignOut(), {
        wrapper: createWrapper(),
      });

      const mutate = result.current.mutate;
      mutate();

      await waitFor(() => !result.current.isLoading);

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
    });
  });
});
