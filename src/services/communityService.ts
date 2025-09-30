import { supabase } from '@/integrations/supabase/client';
import { Community } from '../lib/types/community';

export interface CommunityQueryOptions {
  searchQuery?: string | undefined;
  tags?: string[] | undefined;
  category?: string | undefined;
  limit?: number | undefined;
}

export interface CommunityQueryResult {
  communities: Community[];
  hasMore: boolean;
  total: number;
  lastId?: string | undefined| null;
}

export const getCommunitiesPaginated = async (
  lastId: string | null = null,
  options: CommunityQueryOptions = {}
): Promise<CommunityQueryResult> => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select(
        `
        *,
        community_members(count)
      `
      )
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .limit(options.limit || 10);

    if (error) throw error;

    const communities: Community[] = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      creatorId: item.creator_id || '', // Fixed: Added null check
      members: [], // Will be populated by separate query if needed
      createdAt: new Date(item.created_at || new Date()), // Fixed: Added null check
      updatedAt: new Date(item.updated_at || new Date()), // Fixed: Added null check
      isPrivate: item.is_private || false, // Fixed: Added null check
      memberCount: item.member_count || 0,
      category: 'General', // TODO: Add category field to communities table
      tags: item.tags || [],
    }));

    return {
      communities,
      hasMore: false,
      total: communities.length,
      lastId: null,
    };
  } catch (error) {
    console.error('Error fetching communities:', error);
    return {
      communities: [],
      hasMore: false,
      total: 0,
      lastId: null,
    };
  }
};

export const getCommunity = async (communityId: string): Promise<Community | null> => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select(
        `
        *,
        community_members(count)
      `
      )
      .eq('id', communityId)
      .single();

    if (error) throw error;
    if (!data) return null;

    const typedData = data as any;
    return {
      id: typedData.id,
      name: typedData.name,
      description: typedData.description || '',
      creatorId: typedData.creator_id || '', // Fixed: Added null check
      members: [], // Will be populated by separate query if needed
      createdAt: new Date(typedData.created_at || new Date()), // Fixed: Added null check
      updatedAt: new Date(typedData.updated_at || new Date()), // Fixed: Added null check
      isPrivate: typedData.is_private || false, // Fixed: Added null check
      memberCount: typedData.member_count || 0,
      category: 'General', // TODO: Add category field to communities table
      tags: typedData.tags || [],
    };
  } catch (error) {
    console.error('Error fetching community:', error);
    return null;
  }
};

/**
 * Retrieves all communities a user is a member of or has created
 * @param userId - The user ID to get communities for
 * @returns Promise resolving to an array of communities
 */
export const getUserCommunities = async (userId: string): Promise<Community[]> => {
  try {
    // First get all community memberships for the user
    const { data: memberships, error: membershipError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId);

    if (membershipError) throw membershipError;

    if (!memberships || memberships.length === 0) {
      return [];
    }

    // Get IDs of communities the user is a member of
    const communityIds = memberships
      .map(m => m.community_id)
      .filter((id): id is string => id !== null);

    if (communityIds.length === 0) {
      return [];
    }

    // Fetch communities user is a member of
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .in('id', communityIds);

    if (communitiesError) throw communitiesError;

    // Get communities created by the user (might overlap with memberships)
    const { data: createdCommunities, error: createdError } = await supabase
      .from('communities')
      .select('*')
      .eq('creator_id', userId);

    if (createdError) throw createdError;

    // Combine and deduplicate communities
    const allCommunities = [...(communities || []), ...(createdCommunities || [])];
    const uniqueCommunities = Array.from(
      new Map(allCommunities.map(community => [community.id, community])).values()
    );

    return uniqueCommunities.map((community: any) => ({
      id: community.id,
      name: community.name,
      description: community.description || '',
      creatorId: community.creator_id || '',
      members: [],
      createdAt: new Date(community.created_at || new Date()),
      updatedAt: new Date(community.updated_at || new Date()),
      isPrivate: community.is_private || false,
      memberCount: community.member_count || 0,
      category: 'General',
      tags: community.tags?.filter((tag): tag is string => tag !== null) || [], // Fixed: Proper type guard
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Gets count of communities created by and joined by the user
 * @param userId - The user ID to get community counts for
 * @returns Promise resolving to counts of created and joined communities
 */
export const getCommunityCounts = async (userId: string) => {
  try {
    // Get count of communities created by user
    const { count: createdCount, error: createdError } = await supabase
      .from('communities')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', userId);

    if (createdError) throw createdError;

    // Get count of communities joined by user (excluding ones created by user)
    const { count: joinedCount, error: joinedError } = await supabase
      .from('community_members')
      .select('community_id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (joinedError) throw joinedError;

    return {
      created: createdCount || 0,
      joined: (joinedCount || 0) - (createdCount || 0), // Subtract created to avoid double counting
    };
  } catch (error) {
    return { created: 0, joined: 0 };
  }
};

export const createCommunity = async (communityData: Partial<Community>, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .insert({
        name: communityData.name || '', // Fixed: Added default value
        description: communityData.description,
        creator_id: userId, // Changed from 'owner_id' to 'creator_id'
        is_private: communityData.isPrivate || false,
        category: communityData.category || 'General',
        tags: communityData.tags || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    throw error;
  }
};

export const updateCommunity = async (id: string, updates: Partial<Community>) => {
  try {
    const { error } = await supabase
      .from('communities')
      .update({
        name: updates.name,
        description: updates.description,
        is_private: updates.isPrivate,
        category: updates.category,
        tags: updates.tags,
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

export const deleteCommunity = async (id: string) => {
  try {
    const { error } = await supabase.from('communities').delete().eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

export const joinCommunity = async (communityId: string, userId: string) => {
  return true;
};

export const leaveCommunity = async (communityId: string, userId: string) => {
  return true;
};

export const requestToJoin = async (communityId: string, userId: string) => {
  return true;
};

export const handleJoinRequest = async (
  communityId: string,
  requestUserId: string,
  status: 'approved' | 'rejected'
) => {
  return true;
};
