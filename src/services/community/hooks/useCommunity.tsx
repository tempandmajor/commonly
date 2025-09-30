/**
 * React hooks for community service
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import * as CommunityAPI from '../api/core';
import { CommunityInsert, CommunityUpdate, CommunitySearchParams } from '../types';

/**
 * Hook to fetch a community by ID
 */
export const useCommunity = (id: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['community', id],
    queryFn: () => (id ? CommunityAPI.getCommunityWithMemberStatus(id, user?.id) : null),
    enabled: !!id,
  });
};

/**
 * Hook to search communities with pagination and filters
 */
export const useSearchCommunities = (params: CommunitySearchParams) => {
  return useQuery({
    queryKey: ['communities', 'search', params],
    queryFn: () => CommunityAPI.searchCommunities(params),
    placeholderData: previousData => previousData,
  });
};

/**
 * Hook to get featured communities
 */
export const useFeaturedCommunities = (limit: number = 5) => {
  return useQuery({
    queryKey: ['communities', 'featured', limit],
    queryFn: () => CommunityAPI.getFeaturedCommunities(limit),
  });
};

/**
 * Hook to fetch communities created by the current user
 */
export const useUserCommunities = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['communities', 'user', user?.id],
    queryFn: () => (user ? CommunityAPI.getUserCommunities(user.id) : []),
    enabled: !!user,
  });
};

/**
 * Hook to fetch communities the current user is a member of
 */
export const useUserMemberships = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['communities', 'memberships', user?.id],
    queryFn: () => (user ? CommunityAPI.getUserMemberships(user.id) : []),
    enabled: !!user,
  });
};

/**
 * Hook to create a new community
 */
export const useCreateCommunity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (community: CommunityInsert) => {
      return CommunityAPI.createCommunity({
          ...community,
        ...(user && { creator_id: user.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['communities', 'user', user.id] });
      }
    },

  });
};

/**
 * Hook to update an existing community
 */
export const useUpdateCommunity = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: CommunityUpdate) => {
      return CommunityAPI.updateCommunity(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', id] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });
};

/**
 * Hook to delete a community
 */
export const useDeleteCommunity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => {
      return CommunityAPI.deleteCommunity(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['communities', 'user', user.id] });
      }
    },
  });
};

/**
 * Hook to join a community
 */
export const useJoinCommunity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ communityId, role = 'member' }: { communityId: string; role?: string }) => {
      if (!user) throw new Error('User must be logged in to join a community');
      return CommunityAPI.joinCommunity(communityId, user.id, role);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community', variables.communityId] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['communities', 'memberships', user.id] });
      }
    },
  });
};

/**
 * Hook to leave a community
 */
export const useLeaveCommunity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (communityId: string) => {
      if (!user) throw new Error('User must be logged in to leave a community');
      return CommunityAPI.leaveCommunity(communityId, user.id);
    },
    onSuccess: (_, communityId) => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['communities', 'memberships', user.id] });
      }
    },
  });
};

/**
 * Hook to fetch community members
 */
export const useCommunityMembers = (
  communityId: string | undefined,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: ['community', communityId, 'members', page, pageSize],
    queryFn: () =>
      communityId
        ? CommunityAPI.getCommunityMembers(communityId, page, pageSize)
        : { members: [], total: 0, hasMore: false },
    enabled: !!communityId,
    placeholderData: previousData => previousData,
  });
};

/**
 * Hook to update a member's role
 */
export const useUpdateMemberRole = (communityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => {
      return CommunityAPI.updateMemberRole(communityId, userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'members'] });
    },
  });
};
