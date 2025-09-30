/**
 * Unified User Service
 * Consolidates all user-related operations with proper error handling
 */

import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/lib/errors/ErrorHandler';
import {
  User,
  UserProfile,
  CreateUserData,
  UpdateUserData,
  UserSearchFilters,
  UserSearchResult,
  UserServiceResponse,
  AvatarUploadOptions,
  AvatarUploadResult,
} from './types';

export class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UserServiceResponse<User>> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'User not authenticated' },
        };
      }

      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();

      if (error) {
        const appError = handleError(error, { operation: 'getCurrentUser' });
        return {
          success: false,
          error: { code: appError.code, message: appError.message },
        };
      }

      return { success: true, data };
    } catch (error) {
      const appError = handleError(error, { operation: 'getCurrentUser' });
      return {
        success: false,
        error: { code: appError.code, message: appError.message },
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserServiceResponse<User>> {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

      if (error) {
        const appError = handleError(error, { operation: 'getUserById', userId });
        return {
          success: false,
          error: { code: appError.code, message: appError.message },
        };
      }

      return { success: true, data };
    } catch (error) {
      const appError = handleError(error, { operation: 'getUserById', userId });
      return {
        success: false,
        error: { code: appError.code, message: appError.message },
      };
    }
  }

  /**
   * Get user by display name (username)
   */
  async getUserByDisplayName(displayName: string): Promise<UserServiceResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('display_name', displayName)
        .single();

      if (error) {
        const appError = handleError(error, { operation: 'getUserByDisplayName', displayName });
        return {
          success: false,
          error: { code: appError.code, message: appError.message },
        };
      }

      return { success: true, data };
    } catch (error) {
      const appError = handleError(error, { operation: 'getUserByDisplayName', displayName });
      return {
        success: false,
        error: { code: appError.code, message: appError.message },
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: UpdateUserData
  ): Promise<UserServiceResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        const appError = handleError(error, { operation: 'updateUserProfile', userId, updates });
        return {
          success: false,
          error: { code: appError.code, message: appError.message },
        };
      }

      return { success: true, data };
    } catch (error) {
      const appError = handleError(error, { operation: 'updateUserProfile', userId, updates });
      return {
        success: false,
        error: { code: appError.code, message: appError.message },
      };
    }
  }

  /**
   * Create user profile
   */
  async createUserProfile(userData: CreateUserData): Promise<UserServiceResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        const appError = handleError(error, { operation: 'createUserProfile', userData });
        return {
          success: false,
          error: { code: appError.code, message: appError.message },
        };
      }

      return { success: true, data };
    } catch (error) {
      const appError = handleError(error, { operation: 'createUserProfile', userData });
      return {
        success: false,
        error: { code: appError.code, message: appError.message },
      };
    }
  }

  /**
   * Search users
   */
  async searchUsers(filters: UserSearchFilters): Promise<UserServiceResponse<UserSearchResult>> {
    try {
      let query = supabase.from('users').select('*', { count: 'exact' });

      // Apply filters
      if (filters.query) {
        query = query.or(`display_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      // Apply pagination
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        const appError = handleError(error, { operation: 'searchUsers', filters });
        return {
          success: false,
          error: { code: appError.code, message: appError.message },
        };
      }

      const result: UserSearchResult = {
        users: data || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      };

      return { success: true, data: result };
    } catch (error) {
      const appError = handleError(error, { operation: 'searchUsers', filters });
      return {
        success: false,
        error: { code: appError.code, message: appError.message },
      };
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(
    userId: string,
    file: File,
    options: AvatarUploadOptions = {}
  ): Promise<UserServiceResponse<AvatarUploadResult>> {
    try {
      const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
        quality = 0.8,
      } = options;

      // Validate file
      if (file.size > maxSize) {
        return {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
          },
        };
      }

      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `File type must be one of: ${allowedTypes.join(', ')}`,
          },
        };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        const appError = handleError(uploadError, { operation: 'uploadAvatar', userId, fileName });
        return {
          success: false,
          error: { code: appError.code, message: appError.message },
        };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update user profile with new avatar URL
      await this.updateUserProfile(userId, { avatar_url: publicUrl });

      const result: AvatarUploadResult = {
        url: publicUrl,
        publicId: uploadData.path,
        size: file.size,
        type: file.type,
      };

      return { success: true, data: result };
    } catch (error) {
      const appError = handleError(error, { operation: 'uploadAvatar', userId });
      return {
        success: false,
        error: { code: appError.code, message: appError.message },
      };
    }
  }

  /**
   * Check if display name is available
   */
  async checkDisplayNameAvailability(displayName: string): Promise<UserServiceResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('display_name', displayName.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        const appError = handleError(error, {
          operation: 'checkDisplayNameAvailability',
          displayName,
        });
        return {
          success: false,
          error: { code: appError.code, message: appError.message },
        };
      }

      return { success: true, data: !data }; // true if available (no existing user)
    } catch (error) {
      const appError = handleError(error, {
        operation: 'checkDisplayNameAvailability',
        displayName,
      });
      return {
        success: false,
        error: { code: appError.code, message: appError.message },
      };
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<UserServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        const appError = handleError(error, { operation: 'deleteUser', userId });
        return {
          success: false,
          error: { code: appError.code, message: appError.message },
        };
      }

      return { success: true, data: true };
    } catch (error) {
      const appError = handleError(error, { operation: 'deleteUser', userId });
      return {
        success: false,
        error: { code: appError.code, message: appError.message },
      };
    }
  }
}

// Export singleton instance
export const userService = UserService.getInstance();
