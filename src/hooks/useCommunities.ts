import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  getUserCommunities,
  getCommunity,
  createCommunity,
  updateCommunity,
  joinCommunity,
  leaveCommunity,
  deleteCommunity,
  getCommunityCounts,
  requestToJoin,
  handleJoinRequest as processJoinRequest,
} from '@/services/communityService';
import { Community } from '@/lib/types/community';
import { toast } from 'sonner';
import * as Sentry from '@sentry/react';
import { trackEvent } from '@/services/analyticsService';

/**
 * Hook for managing community data and operations
 * @param communityId Optional ID of a specific community to fetch
 * @returns Community-related data and functions
 */
export const useCommunities = (communityId?: string) => {
  const { user, isAdmin } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({ created: 0, joined: 0 });
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Function to refresh the data
  const refreshData = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userCommunities = await getUserCommunities(user.id);
        setCommunities(userCommunities);

        const counts = await getCommunityCounts(user.id);
        setStats(counts);
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            component: 'useCommunities',
            action: 'fetchCommunities',
          },
          extra: {
            userId: user.id,
          },
        });
        toast.error('Failed to load your communities');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, [user, refreshCounter]);

  useEffect(() => {
    const fetchCommunity = async () => {
      if (!communityId) {
        setCurrentCommunity(null);
        return;
      }

      setLoading(true);
      try {
        const community = await getCommunity(communityId);
        setCurrentCommunity(community);
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            component: 'useCommunities',
            action: 'fetchCommunity',
          },
          extra: {
            communityId,
          },
        });
        toast.error('Failed to load community');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [communityId, refreshCounter]);

  const handleCreateCommunity = async (communityData: Partial<Community>) => {
    if (!user) {
      toast.error('You must be logged in to create a community');
      return null;
    }

    try {
      const newCommunityId = await createCommunity(communityData, user.id);
      if (newCommunityId) {
        // Track successful community creation
        trackEvent('community_management', 'community_created', communityData.name);

        // Refresh data
        refreshData();
      }
      return newCommunityId;
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: 'useCommunities',
          action: 'createCommunity',
        },
        extra: {
          userId: user.id,
          communityName: communityData.name,
        },
      });
      toast.error('Failed to create community');
      return null;
    }
  };

  const handleUpdateCommunity = async (communityId: string, data: Partial<Community>) => {
    const success = await updateCommunity(communityId, data);
    if (success) {
      setCommunities(prev =>
        prev.map(community =>
          community.id === communityId ? { ...community, ...data } : community
        )
      );

      if (currentCommunity?.id === communityId) {
        setCurrentCommunity(prev => (prev ? { ...prev, ...data } : prev));
      }
    }
    return success;
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) {
      toast.error('You must be logged in to join a community');
      return false;
    }

    const success = await joinCommunity(communityId, user.id);
    if (success) {
      const updatedCommunities = await getUserCommunities(user.id);
      setCommunities(updatedCommunities);

      const counts = await getCommunityCounts(user.id);
      setStats(counts);
    }
    return success;
  };

  const handleLeaveCommunity = async (communityId: string) => {
    if (!user) return false;

    const success = await leaveCommunity(communityId, user.id);
    if (success) {
      setCommunities(prev => prev.filter(community => community.id !== communityId));

      const counts = await getCommunityCounts(user.id);
      setStats(counts);
    }
    return success;
  };

  const handleDeleteCommunity = async (communityId: string) => {
    const success = await deleteCommunity(communityId);
    if (success) {
      setCommunities(prev => prev.filter(community => community.id !== communityId));

      const counts = await getCommunityCounts(user.id);
      setStats(counts);
    }
    return success;
  };

  const handleJoinRequest = async (communityId: string) => {
    if (!user) {
      toast.error('You must be logged in to join a community');
      return false;
    }

    const success = await requestToJoin(communityId, user.id);
    return success;
  };

  const handleRequestResponse = async (requestUserId: string, status: 'approved' | 'rejected') => {
    if (!communityId || !isAdmin) return false;
    const success = await processJoinRequest(communityId, requestUserId, status);
    return success;
  };

  return {
    communities,
    currentCommunity,
    loading,
    stats,
    refreshData,
    createCommunity: handleCreateCommunity,
    updateCommunity: handleUpdateCommunity,
    joinCommunity: handleJoinCommunity,
    leaveCommunity: handleLeaveCommunity,
    deleteCommunity: handleDeleteCommunity,
    handleJoinRequest,
    handleRequestResponse,
  };
};
