/**
 * User Profile Service - React Hooks
 *
 * This file provides React hooks for using profile functionality in components.
 */

import { useState, useEffect, useCallback } from 'react';
import { profileAPI } from '../api/profileAPI';
import {
  UserProfile,
  ProfileError,
  ProfileUpdateData,
  ProfileSearchParams,
  ProfileSearchResult,
} from '../core/types';

/**
 * Hook to get a user profile by ID
 */
export function useProfileById(userId: string, options = { skip: false }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(!options.skip);
  const [error, setError] = useState<ProfileError | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (options.skip || !userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await profileAPI.getProfileById(userId);
        if (isMounted) {
          setProfile(data);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            error instanceof ProfileError ? error : new ProfileError('Failed to fetch profile')
          );
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [userId, options.skip]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await profileAPI.getProfileById(userId);
      setProfile(data);
      setLoading(false);
    } catch (error) {
      setError(
        error instanceof ProfileError ? error : new ProfileError('Failed to refresh profile')
      );
      setLoading(false);
    }
  }, [userId]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
  };
}

/**
 * Hook to get a user profile by username
 */
export function useProfileByUsername(username: string, options = { skip: false }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(!options.skip);
  const [error, setError] = useState<ProfileError | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (options.skip || !username) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await profileAPI.getProfileByUsername(username);
        if (isMounted) {
          setProfile(data);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            error instanceof ProfileError
              ? error
              : new ProfileError('Failed to fetch profile by username')
          );
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [username, options.skip]);

  return {
    profile,
    loading,
    error,
  };
}

/**
 * Hook to update a user profile
 */
export function useProfileUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ProfileError | null>(null);

  const updateProfile = useCallback(async (profileId: string, data: ProfileUpdateData) => {
    setLoading(true);
    setError(null);

    try {
      const updatedProfile = await profileAPI.updateProfile(profileId, data);
      setLoading(false);
      return updatedProfile;
    } catch (error) {
      setError(
        error instanceof ProfileError ? error : new ProfileError('Failed to update profile')
      );
      setLoading(false);
      throw error;
    }
  }, []);

  const updateProfileAvatar = useCallback(async (profileId: string, file: File) => {
    setLoading(true);
    setError(null);

    try {
      const updatedProfile = await profileAPI.updateProfileAvatar(profileId, file);
      setLoading(false);
      return updatedProfile;
    } catch (error) {
      setError(
        error instanceof ProfileError ? error : new ProfileError('Failed to update profile avatar')
      );
      setLoading(false);
      throw error;
    }
  }, []);

  return {
    updateProfile,
    updateProfileAvatar,
    loading,
    error,
  };
}

/**
 * Hook to search for profiles
 */
export function useProfileSearch(initialParams: ProfileSearchParams = {}) {
  const [searchParams, setSearchParams] = useState<ProfileSearchParams>(initialParams);
  const [results, setResults] = useState<ProfileSearchResult>({
    data: [],
    meta: { total: 0, page: 1, limit: 20 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ProfileError | null>(null);

  const search = useCallback(
    async (params?: ProfileSearchParams) => {
      const searchParamsToUse = params || searchParams;

      setLoading(true);
      setError(null);

      try {
        const results = await profileAPI.searchProfiles(searchParamsToUse);
        setResults(results);
        if (params) {
          setSearchParams(params);
        }
        setLoading(false);
        return results;
      } catch (error) {
        setError(
          error instanceof ProfileError ? error : new ProfileError('Failed to search profiles')
        );
        setLoading(false);
        throw error;
      }
    },
    [searchParams]
  );

  // Initial search when parameters change
  useEffect(() => {
    search();
  }, [search]);

  const nextPage = useCallback(() => {
    if (results.data.length < results.meta.limit) {
      return null; // No more data
    }

    const nextPageParams = {
          ...searchParams,
      page: (searchParams.page || 1) + 1,
    };

    return search(nextPageParams);
  }, [search, searchParams, results]);

  const previousPage = useCallback(() => {
    if ((searchParams.page || 1) <= 1) {
      return null; // Already on the first page
    }

    const prevPageParams = {
          ...searchParams,
      page: (searchParams.page || 1) - 1,
    };

    return search(prevPageParams);
  }, [search, searchParams]);

  return {
    results,
    loading,
    error,
    search,
    nextPage,
    previousPage,
    searchParams,
    setSearchParams,
  };
}

/**
 * Hook to check username availability
 */
export function useUsernameCheck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ProfileError | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const checkUsername = useCallback(async (username: string, excludeProfileId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const available = await profileAPI.isUsernameAvailable(username, excludeProfileId);
      setIsAvailable(available);
      setLoading(false);
      return available;
    } catch (error) {
      setError(
        error instanceof ProfileError ? error : new ProfileError('Failed to check username')
      );
      setLoading(false);
      throw error;
    }
  }, []);

  return {
    isAvailable,
    loading,
    error,
    checkUsername,
  };
}

/**
 * Hook to get suggested usernames
 */
export function useSuggestedUsernames() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ProfileError | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const getSuggestions = useCallback(async (baseName: string, count: number = 5) => {
    setLoading(true);
    setError(null);

    try {
      const suggestedNames = await profileAPI.getSuggestedUsernames(baseName, count);
      setSuggestions(suggestedNames);
      setLoading(false);
      return suggestedNames;
    } catch (error) {
      setError(
        error instanceof ProfileError
          ? error
          : new ProfileError('Failed to get username suggestions')
      );
      setLoading(false);
      throw error;
    }
  }, []);

  return {
    suggestions,
    loading,
    error,
    getSuggestions,
  };
}
