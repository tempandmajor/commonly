/**
 * Core API functions for community service
 */
import { supabase } from '@/integrations/supabase/client';
import {
  Community,
  CommunityInsert,
  CommunityUpdate,
  CommunityWithMemberCount,
  CommunityWithMemberStatus,
  CommunityMember,
  CommunityMemberInsert,
  PaginatedCommunities,
  CommunitySearchParams,
} from '../types';

/**
 * Get a community by ID
 */
export const getCommunity = async (id: string): Promise<CommunityWithMemberCount | null> => {
  try {
    const { data, error } = await supabase.from('communities').select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching community:', error);
      return null;
    }

    return data as CommunityWithMemberCount;
  } catch (error) {
    console.error('Error in getCommunity:', error);
    return null;
  }
};

/**
 * Get a community with the current user's membership status
 */
export const getCommunityWithMemberStatus = async (
  id: string,
  userId?: string
): Promise<CommunityWithMemberStatus | null> => {
  try {
    if (!userId) {
      const community = await getCommunity(id);
      return community ? { ...community, is_member: false } : null;
    }

    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('*')
      .eq('id', id)
      .single();

    if (communityError) {
      console.error('Error fetching community:', communityError);
      return null;
    }

    const { data: membership, error: membershipError } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', id)
      .eq('user_id', userId)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      console.error('Error fetching community membership:', membershipError);
    }

    return {
      ...(community as CommunityWithMemberCount),
      is_member: !!membership,
      ...(membership && { role: membership.role }),
    };
  } catch (error) {
    console.error('Error in getCommunityWithMemberStatus:', error);
    return null;
  }

};

/**
 * Search communities with pagination and filters
 */
export const searchCommunities = async (
  params: CommunitySearchParams = {}
): Promise<PaginatedCommunities> => {
  try {
    const {
      query = '',
      tags = [],
      location,
      isPrivate,
      page = 1,
      pageSize = 10,
      sortBy = 'created_at',
      sortDirection = 'desc',
    } = params;

    let queryBuilder = supabase.from('communities').select('*', { count: 'exact' });

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (tags.length > 0) {
      queryBuilder = queryBuilder.contains('tags', tags);
    }

    if (location) {
      queryBuilder = queryBuilder.ilike('location', `%${location}%`);
    }

    if (isPrivate !== undefined) {
      queryBuilder = queryBuilder.eq('is_private', isPrivate);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Apply sorting
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortDirection === 'asc' });

    // Execute query with pagination
    const { data, error, count } = await queryBuilder.range(from, to);

    if (error) {
      console.error('Error searching communities:', error);
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
      };
    }

    return {
      items: data as CommunityWithMemberCount[],
      total: count || 0,
      page,
      pageSize,
      hasMore: count ? from + data.length < count : false,
    };
  } catch (error) {
    console.error('Error in searchCommunities:', error);
    return {
      items: [],
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      hasMore: false,
    };
  }
};

/**
 * Get communities created by a specific user
 */
export const getUserCommunities = async (userId: string): Promise<CommunityWithMemberCount[]> => {
  try {
    const { data, error } = await supabase.from('communities').select('*').eq('creator_id', userId); // Fixed: Changed from 'owner_id' to 'creator_id'

    if (error) {
      console.error('Error fetching user communities:', error);
      return [];
    }

    return data as CommunityWithMemberCount[];
  } catch (error) {
    console.error('Error in getUserCommunities:', error);
    return [];
  }
};

/**
 * Get communities that a user is a member of
 */
export const getUserMemberships = async (userId: string): Promise<CommunityWithMemberCount[]> => {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user memberships:', error);
      return [];
    }

    if (data.length === 0) {
      return [];
    }

    const communityIds = data
      .map(item => item.community_id)
      .filter((id): id is string => id !== null);

    if (communityIds.length === 0) {
      return [];
    }

    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .in('id', communityIds);

    if (communitiesError) {
      console.error('Error fetching communities by IDs:', communitiesError);
      return [];
    }

    return communities as CommunityWithMemberCount[];
  } catch (error) {
    console.error('Error in getUserMemberships:', error);
    return [];
  }
};

/**
 * Create a new community
 */
export const createCommunity = async (community: CommunityInsert): Promise<Community | null> => {
  try {
    const { data, error } = await supabase.from('communities').insert(community).select().single();

    if (error) {
      console.error('Error creating community:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createCommunity:', error);
    return null;
  }
};

/**
 * Update an existing community
 */
export const updateCommunity = async (
  id: string,
  updates: CommunityUpdate
): Promise<Community | null> => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating community:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateCommunity:', error);
    return null;
  }
};

/**
 * Delete a community
 */
export const deleteCommunity = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('communities').delete().eq('id', id);

    if (error) {
      console.error('Error deleting community:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCommunity:', error);
    return false;
  }
};

/**
 * Join a community
 */
export const joinCommunity = async (
  communityId: string,
  userId: string,
  role: string = 'member'
): Promise<boolean> => {
  try {
    const memberData: CommunityMemberInsert = {
      community_id: communityId,
      user_id: userId,
      role,
    };

    const { error } = await supabase.from('community_members').insert(memberData);

    if (error) {
      console.error('Error joining community:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in joinCommunity:', error);
    return false;
  }
};

/**
 * Leave a community
 */
export const leaveCommunity = async (communityId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error leaving community:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in leaveCommunity:', error);
    return false;
  }
};

/**
 * Get community members
 */
export const getCommunityMembers = async (
  communityId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ members: any[]; total: number; hasMore: boolean }> => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('community_members')
      .select(
        `
        *,
        user:users!community_members_user_id_fkey(
          id,
          name,
          display_name,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('community_id', communityId)
      .order('joined_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching community members:', error);
      return { members: [], total: 0, hasMore: false };
    }

    return {
      members: data,
      total: count || 0,
      hasMore: count ? from + data.length < count : false,
    };
  } catch (error) {
    console.error('Error in getCommunityMembers:', error);
    return { members: [], total: 0, hasMore: false };
  }
};

/**
 * Update a member's role in a community
 */
export const updateMemberRole = async (
  communityId: string,
  userId: string,
  role: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('community_members')
      .update({ role })
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating member role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateMemberRole:', error);
    return false;
  }
};

/**
 * Get featured communities
 */
export const getFeaturedCommunities = async (
  limit: number = 5
): Promise<CommunityWithMemberCount[]> => {
  try {
    // For now, just return the most popular communities by member count
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured communities:', error);
      return [];
    }

    return data as CommunityWithMemberCount[];
  } catch (error) {
    console.error('Error in getFeaturedCommunities:', error);
    return [];
  }
};

