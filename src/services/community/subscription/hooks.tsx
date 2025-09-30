/**
 * React hooks for community subscription management
 * Updated to fix import caching issue
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import * as SubscriptionAPI from './api';
import { CommunitySubscriptionSettings } from '../types';

/**
 * Hook to fetch subscription settings for a community
 */
export const useCommunitySubscriptionSettings = (communityId: string | undefined) => {
  return useQuery({
    queryKey: ['community', communityId, 'subscription-settings'],
    queryFn: () =>
      communityId ? SubscriptionAPI.getCommunitySubscriptionSettings(communityId) : null,
    enabled: !!communityId,
  });
};

/**
 * Hook to update subscription settings for a community
 */
export const useUpdateCommunitySubscriptionSettings = (communityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<CommunitySubscriptionSettings>) => {
      return SubscriptionAPI.updateCommunitySubscriptionSettings(communityId, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['community', communityId, 'subscription-settings'],
      });
    },
  });
};

/**
 * Hook to fetch subscribers for a community
 */
export const useCommunitySubscribers = (
  communityId: string | undefined,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: ['community', communityId, 'subscribers', page, pageSize],
    queryFn: () =>
      communityId
        ? SubscriptionAPI.getCommunitySubscribers(communityId, page, pageSize)
        : { subscribers: [], total: 0, hasMore: false },
    enabled: !!communityId,
    placeholderData: previousData => previousData,
  });
};

/**
 * Hook to subscribe to a community
 */
export const useSubscribeToCommunity = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      communityId,
      interval,
    }: {
      communityId: string;
      interval: 'month' | 'year';
    }) => {
      if (!user) throw new Error('User must be logged in to subscribe');
      return SubscriptionAPI.subscribeToCommunity(communityId, user.id, interval);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['community', variables.communityId, 'subscribers'],
      });
    },
  });
};

/**
 * Hook to unsubscribe from a community
 */
export const useUnsubscribeFromCommunity = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (communityId: string) => {
      if (!user) throw new Error('User must be logged in to unsubscribe');
      return SubscriptionAPI.unsubscribeFromCommunity(communityId, user.id);
    },
    onSuccess: (_, communityId) => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'subscribers'] });
    },
  });
};

/**
 * Hook to create a recurring event for community subscribers
 */
export const useCreateCommunityEvent = (communityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventData: {
      title: string;
      description: string;
      startDate: Date;
      endDate: Date;
      location?: string;
      isVirtual: boolean;
      meetingUrl?: string;
    }) => {
      return SubscriptionAPI.createCommunityEvent(communityId, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'events'] });
    },
  });
};

/**
 * Hook to fetch events for a community
 */
export const useCommunityEvents = (
  communityId: string | undefined,
  includeSubscribersOnly: boolean = false
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['community', communityId, 'events', includeSubscribersOnly, user?.id],
    queryFn: () =>
      communityId
        ? SubscriptionAPI.getCommunityEvents(communityId, includeSubscribersOnly, user?.id)
        : [],
    enabled: !!communityId,
  });
};
