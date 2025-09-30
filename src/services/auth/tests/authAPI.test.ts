import { expect, describe, it, vi, beforeEach } from 'vitest';
import { authAPI } from '../api/authAPI';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      auth: {
        signInWithPassword: vi.fn(),
        signInWithOtp: vi.fn(),
        signInWithOAuth: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
        getUser: vi.fn(),
        updateUser: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        verifyOtp: vi.fn(),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
      })),
    })),
  };
});

// Mock toast notifications
vi.mock('sonner', () => {
  return {
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('Auth API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {
      full_name: 'Test User',
    },
  };

  const mockSession = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    user: mockUser,
  };

  const mockProfile = {
    id: 'user-123',
    full_name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('should sign in user with email and password', async () => {
      const supabase = await import('@supabase/supabase-js');
      const mockClient = supabase.createClient();

      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authAPI.signInWithEmail({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockUser);
    });

    it('should handle sign-in errors', async () => {
      const supabase = await import('@supabase/supabase-js');
      const mockClient = supabase.createClient();

      const mockError = new Error('Invalid login credentials');
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(
        authAPI.signInWithEmail({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow();
    });
  });

  describe('signUp', () => {
    it('should sign up a new user', async () => {
      const supabase = await import('@supabase/supabase-js');
      const mockClient = supabase.createClient();

      mockClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      mockClient.from().insert().select().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await authAPI.signUp({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
      });

      expect(mockClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User',
            phone: undefined,
          },
        },
      });

      expect(mockClient.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user with profile', async () => {
      const supabase = await import('@supabase/supabase-js');
      const mockClient = supabase.createClient();

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockClient.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await authAPI.getCurrentUser();

      expect(mockClient.auth.getUser).toHaveBeenCalled();
      expect(mockClient.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual({
          ...mockUser,
        profile: mockProfile,
      });
    });

    it('should return null if no user is logged in', async () => {
      const supabase = await import('@supabase/supabase-js');
      const mockClient = supabase.createClient();

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authAPI.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const supabase = await import('@supabase/supabase-js');
      const mockClient = supabase.createClient();

      mockClient.from().update().eq().select().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await authAPI.updateProfile('user-123', {
        full_name: 'Updated Name',
      });

      expect(mockClient.from).toHaveBeenCalledWith('profiles');
      expect(mockClient.auth.updateUser).toHaveBeenCalled();
      expect(result).toEqual(mockProfile);
    });
  });

  describe('signOut', () => {
    it('should sign out the user', async () => {
      const supabase = await import('@supabase/supabase-js');
      const mockClient = supabase.createClient();

      mockClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      await authAPI.signOut();

      expect(mockClient.auth.signOut).toHaveBeenCalled();
    });
  });
});
