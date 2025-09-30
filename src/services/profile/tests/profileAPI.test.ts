/**
 * User Profile Service - Tests
 *
 * This file contains tests for the profile API functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';
import {
  getProfileById,
  getProfileByUsername,
  createProfile,
  updateProfile,
  updateProfileAvatar,
  deleteProfile,
  searchProfiles,
  isUsernameAvailable,
  getSuggestedUsernames,
} from '../api/profileAPI';
import { ProfileStatus, AccountType, ProfileError, ProfileErrorType } from '../core/types';

// Mock the dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockSingle = vi.fn();
const mockIn = vi.fn();
const mockOr = vi.fn();
const mockRange = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

describe('Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      in: mockIn,
      or: mockOr,
      range: mockRange,
      order: mockOrder,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
      neq: mockNeq,
    });

    mockNeq.mockReturnValue({
      single: mockSingle,
    });

    mockOr.mockReturnValue({
      eq: mockEq,
    });

    mockRange.mockReturnValue({
      order: mockOrder,
    });

    mockOrder.mockReturnValue({});

    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProfileById', () => {
    it('should return a profile when found', async () => {
      // Arrange
      const mockProfile = {
        id: '123',
        user_id: 'user123',
        username: 'testuser',
        status: ProfileStatus.ACTIVE,
        account_type: AccountType.PERSONAL,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      // Act
      const result = await getProfileById('user123');

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user123');
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });

    it('should return null when profile is not found', async () => {
      // Arrange
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      // Act
      const result = await getProfileById('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw an error when database error occurs', async () => {
      // Arrange
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'ERROR', message: 'Database error' },
      });

      // Act & Assert
      await expect(getProfileById('user123')).rejects.toThrow(ProfileError);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('getProfileByUsername', () => {
    it('should return a profile when found by username', async () => {
      // Arrange
      const mockProfile = {
        id: '123',
        user_id: 'user123',
        username: 'testuser',
        status: ProfileStatus.ACTIVE,
        account_type: AccountType.PERSONAL,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      // Act
      const result = await getProfileByUsername('testuser');

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('username', 'testuser');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('createProfile', () => {
    it('should create a profile successfully', async () => {
      // Arrange
      const newProfile = {
        userId: 'user123',
        username: 'newuser',
        full_name: 'New User',
        account_type: AccountType.PERSONAL,
      };

      const createdProfile = {
        id: '123',
        user_id: 'user123',
        username: 'newuser',
        full_name: 'New User',
        status: ProfileStatus.PENDING_VERIFICATION,
        account_type: AccountType.PERSONAL,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      // Mock username check
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock profile creation
      mockFrom.mockReturnValue({
        insert: mockInsert,
      });

      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      mockSingle.mockResolvedValueOnce({
        data: createdProfile,
        error: null,
      });

      // Act
      const result = await createProfile(newProfile);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockInsert).toHaveBeenCalled();
      expect(result).toEqual(createdProfile);
      expect(toast.success).toHaveBeenCalled();
    });

    it('should throw an error when username is already taken', async () => {
      // Arrange
      const newProfile = {
        userId: 'user123',
        username: 'existinguser',
        full_name: 'New User',
      };

      // Mock username check - already exists
      mockSingle.mockResolvedValueOnce({
        data: { id: 'existing123' },
        error: null,
      });

      // Act & Assert
      await expect(createProfile(newProfile)).rejects.toThrow(
        new ProfileError(
          `Username 'existinguser' is already taken`,
          ProfileErrorType.USERNAME_TAKEN
        )
      );
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update a profile successfully', async () => {
      // Arrange
      const profileId = 'profile123';
      const updateData = {
        bio: 'Updated bio',
        display_name: 'Updated Name',
      };

      const updatedProfile = {
        id: profileId,
        user_id: 'user123',
        username: 'testuser',
        bio: 'Updated bio',
        display_name: 'Updated Name',
        status: ProfileStatus.ACTIVE,
        account_type: AccountType.PERSONAL,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };

      // Mock profile update
      mockFrom.mockReturnValue({
        update: mockUpdate,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      mockSingle.mockResolvedValueOnce({
        data: updatedProfile,
        error: null,
      });

      // Act
      const result = await updateProfile(profileId, updateData);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', profileId);
      expect(result).toEqual(updatedProfile);
      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('searchProfiles', () => {
    it('should search profiles with the provided parameters', async () => {
      // Arrange
      const searchParams = {
        query: 'test',
        page: 1,
        limit: 10,
      };

      const mockProfiles = [
        {
          id: '123',
          user_id: 'user123',
          username: 'testuser',
          status: ProfileStatus.ACTIVE,
          account_type: AccountType.PERSONAL,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: '124',
          user_id: 'user124',
          username: 'testuser2',
          status: ProfileStatus.ACTIVE,
          account_type: AccountType.PERSONAL,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      // Mock search query
      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      mockSelect.mockReturnValue({
        or: mockOr,
      });

      mockOr.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        range: mockRange,
      });

      mockRange.mockReturnValue({
        order: mockOrder,
      });

      mockOrder.mockResolvedValue({
        data: mockProfiles,
        error: null,
        count: 2,
      });

      // Act
      const result = await searchProfiles(searchParams);

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockOr).toHaveBeenCalled();
      expect(result.data).toEqual(mockProfiles);
      expect(result.meta.total).toEqual(2);
      expect(result.meta.page).toEqual(1);
      expect(result.meta.limit).toEqual(10);
    });
  });
});
