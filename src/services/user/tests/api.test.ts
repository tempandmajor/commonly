/**
 * @file Unit tests for User Service API functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '../core/client';
import { authAPI, profileAPI, settingsAPI, preferencesAPI, storageAPI } from '../api';
import { DEFAULT_PREFERENCES } from '../core/constants';

// Mock Supabase client
vi.mock('../core/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
      admin: {
        getUserById: vi.fn(),
      },
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          limit: vi.fn(),
          delete: vi.fn(),
        })),
        or: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      upsert: vi.fn(),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        createSignedUrl: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  },
  getUserProfileFromDB: vi.fn(),
  clearUserCache: vi.fn(),
  tables: {
    users: vi.fn(),
    profiles: vi.fn(),
    settings: vi.fn(),
  },
  storageBuckets: {
    avatars: vi.fn(() => 'avatars'),
    uploads: vi.fn(() => 'user-uploads'),
  },
}));

describe('User Service API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Auth API', () => {
    it('should get current user', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      const mockUserData = {
        id: 'user123',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        stripe_customer_id: 'cus_123',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(require('../core/client').getUserProfileFromDB).mockResolvedValue(mockUserData);

      const result = await authAPI.getCurrentUser();

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user123');
      expect(result?.email).toBe('test@example.com');
      expect(result?.name).toBe('Test User');
      expect(result?.avatar_url).toBe('https://example.com/avatar.jpg');
      expect(result?.stripeCustomerId).toBe('cus_123');
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it('should return null when no user is authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await authAPI.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should get user by ID', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      const mockUserData = {
        id: 'user123',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      vi.mocked(supabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(require('../core/client').getUserProfileFromDB).mockResolvedValue(mockUserData);

      const result = await authAPI.getUserById('user123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user123');
      expect(result?.name).toBe('Test User');
      expect(result?.avatar_url).toBe('https://example.com/avatar.jpg');
      expect(supabase.auth.admin.getUserById).toHaveBeenCalledWith('user123');
    });

    it('should sign out user', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);

      const result = await authAPI.signOut();

      expect(result).toBe(true);
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should update user metadata', async () => {
      const metadata = { role: 'admin', bio: 'Test bio' };
      const mockUser = { id: 'user123' };

      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const result = await authAPI.updateUserMetadata(metadata);

      expect(result).toBe(true);
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: metadata,
      });
      expect(require('../core/client').clearUserCache).toHaveBeenCalledWith('user123');
    });
  });

  describe('Profile API', () => {
    it('should update user profile', async () => {
      const updates = { display_name: 'New Name', bio: 'New bio' };
      const userId = 'user123';

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await profileAPI.updateUserProfile(userId, updates);

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(require('../core/client').clearUserCache).toHaveBeenCalledWith(userId);
    });

    it('should create user profile', async () => {
      const profileData = { display_name: 'New User', bio: 'New user bio' };
      const userId = 'user123';

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await profileAPI.createUserProfile(userId, profileData);

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    it('should search users', async () => {
      const query = 'test';
      const mockUsers = [
        { id: 'user1', display_name: 'Test User 1' },
        { id: 'user2', display_name: 'Test User 2' },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await profileAPI.searchUsers('test');

      expect(result).toEqual(mockUsers);
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('id, email, display_name, avatar_url');
    });
  });

  describe('Settings API', () => {
    it('should get user settings', async () => {
      const userId = 'user123';
      const mockData = {
        id: userId,
        platform_credit: 100,
        payment_settings: {
          defaultMethod: 'stripe',
          autoRecharge: true,
          rechargeAmount: 50,
        },
        preferences: {
          notifications: {
            email: true,
            push: true,
          },
          privacy: {
            isPrivate: true,
          },
        },
        created_at: '2023-01-01',
        updated_at: '2023-01-02',
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await settingsAPI.getUserSettings(userId);

      expect(result).not.toBeNull();
      expect(result?.userId).toBe(userId);
      expect(result?.platformCredit).toBe(100);
      expect(result?.paymentPreferences.defaultMethod).toBe('stripe');
      expect(result?.notifications.email).toBe(true);
      expect(result?.privacy.isPrivate).toBe(true);
    });

    it('should update user settings', async () => {
      const userId = 'user123';
      const settings = {
        platformCredit: 150,
        paymentPreferences: {
          defaultMethod: 'stripe',
          autoRecharge: true,
          rechargeAmount: 100,
        },
        notifications: {
          email: false,
          push: true,
        },
      };

      // Mock for getting existing preferences
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { preferences: { theme: 'dark' } },
            error: null,
          }),
        }),
      });

      // Mock for update
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      } as any);

      const result = await settingsAPI.updateUserSettings(userId, settings);

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('Preferences API', () => {
    it('should get user preferences', async () => {
      const userId = 'user123';
      const mockPrefs = {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: false,
          push: true,
        },
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { preferences: mockPrefs },
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await preferencesAPI.getUserPreferences(userId);

      expect(result).toEqual(
        expect.objectContaining({
          theme: 'dark',
          language: 'en',
          notifications: expect.objectContaining({
            email: false,
            push: true,
          }),
        })
      );
    });

    it('should return default preferences when none exist', async () => {
      const userId = 'user123';

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await preferencesAPI.getUserPreferences(userId);

      expect(result).toEqual(DEFAULT_PREFERENCES);
    });

    it('should update user preferences', async () => {
      const userId = 'user123';
      const preferences = {
        theme: 'light',
        notifications: {
          email: true,
        },
      };

      // Mock for getting existing preferences
      vi.mocked(preferencesAPI.getUserPreferences).mockResolvedValue({
          ...DEFAULT_PREFERENCES,
        theme: 'dark',
        notifications: {
          ...DEFAULT_PREFERENCES.notifications,
          email: false,
        },
      });

      // Mock for update
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await preferencesAPI.updateUserPreferences(userId, preferences);

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockUpdate).toHaveBeenCalled();
      // Ensure the update includes the merged preferences
      expect(mockUpdate.mock.calls[0][0]).toHaveProperty('preferences');
      expect(mockUpdate.mock.calls[0][0].preferences).toHaveProperty('theme', 'light');
      expect(mockUpdate.mock.calls[0][0].preferences.notifications).toHaveProperty('email', true);
    });
  });

  describe('Storage API', () => {
    it('should upload profile image', async () => {
      const userId = 'user123';
      const file = new File(['test'], 'profile.jpg', { type: 'image/jpeg' });
      const publicUrl = 'https://example.com/avatars/profiles/user123/profile.jpg';

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi
          .fn()
          .mockResolvedValue({ data: { path: 'profiles/user123/profile.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl } }),
      } as any);

      // Mock for updating user avatar
      const updateAvatarSpy = vi.spyOn(profileAPI, 'updateUserAvatar').mockResolvedValue(true);

      const result = await storageAPI.uploadProfileImage(userId, file);

      expect(result).toBe(publicUrl);
      expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(updateAvatarSpy).toHaveBeenCalledWith(userId, publicUrl);
    });

    it('should list user files', async () => {
      const userId = 'user123';
      const mockFiles = [
        { name: 'file1.pdf', id: 'file1' },
        { name: 'file2.jpg', id: 'file2' },
      ];

      vi.mocked(supabase.storage.from).mockReturnValue({
        list: vi.fn().mockResolvedValue({ data: mockFiles, error: null }),
      } as any);

      const result = await storageAPI.listUserFiles(userId);

      expect(result).toEqual(mockFiles);
      expect(supabase.storage.from).toHaveBeenCalledWith('user-uploads');
    });

    it('should delete user file', async () => {
      const userId = 'user123';
      const filePath = 'user123/general/file.pdf';

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await storageAPI.deleteUserFile(userId, filePath);

      expect(result).toBe(true);
      expect(supabase.storage.from).toHaveBeenCalledWith('user-uploads');
    });

    it('should prevent deleting files not owned by user', async () => {
      const userId = 'user123';
      const filePath = 'anotheruser/general/file.pdf';

      const result = await storageAPI.deleteUserFile(userId, filePath);

      expect(result).toBe(false);
      expect(supabase.storage.from).not.toHaveBeenCalled();
    });
  });
});
