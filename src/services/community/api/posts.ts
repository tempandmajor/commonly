/**
 * API functions for community posts management
 */
import { supabase } from '@/integrations/supabase/client';

export interface CommunityPost {
  id: string;
  community_id: string;
  user_id: string;
  title?: string | undefined;
  content: string;
  image_url?: string | undefined;
  attachment_urls?: string[] | undefined;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string | undefined;
    name?: string | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
  };
}

export interface CreatePostData {
  community_id: string;
  title?: string | undefined;
  content: string;
  image_url?: string | undefined;
  attachment_urls?: string[] | undefined;
}

export interface UpdatePostData {
  title?: string | undefined;
  content?: string | undefined;
  image_url?: string | undefined;
  attachment_urls?: string[] | undefined;
  is_pinned?: boolean | undefined;
}

/**
 * Get posts for a community
 */
export const getCommunityPosts = async (
  communityId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ posts: CommunityPost[]; total: number; hasMore: boolean }> => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('community_posts')
      .select(
        `
        *,
        user:users!community_posts_user_id_fkey(
          id,
          name,
          display_name,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('community_id', communityId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching community posts:', error);
      return { posts: [], total: 0, hasMore: false };
    }

    return {
      posts: data as CommunityPost[],
      total: count || 0,
      hasMore: count ? from + data.length < count : false,
    };
  } catch (error) {
    console.error('Error in getCommunityPosts:', error);
    return { posts: [], total: 0, hasMore: false };
  }
};

/**
 * Create a new post in a community
 */
export const createCommunityPost = async (
  postData: CreatePostData,
  userId: string
): Promise<CommunityPost | null> => {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
          ...postData,
        user_id: userId,
      })
      .select(
        `
        *,
        user:users!community_posts_user_id_fkey(
          id,
          name,
          display_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error('Error creating community post:', error);
      return null;
    }

    return data as CommunityPost;
  } catch (error) {
    console.error('Error in createCommunityPost:', error);
    return null;
  }
};

/**
 * Update a community post
 */
export const updateCommunityPost = async (
  postId: string,
  updates: UpdatePostData
): Promise<CommunityPost | null> => {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .update({
          ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select(
        `
        *,
        user:users!community_posts_user_id_fkey(
          id,
          name,
          display_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating community post:', error);
      return null;
    }

    return data as CommunityPost;
  } catch (error) {
    console.error('Error in updateCommunityPost:', error);
    return null;
  }
};

/**
 * Delete a community post
 */
export const deleteCommunityPost = async (postId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('community_posts').delete().eq('id', postId);

    if (error) {
      console.error('Error deleting community post:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCommunityPost:', error);
    return false;
  }
};

/**
 * Toggle pin status of a post
 */
export const togglePostPin = async (postId: string, isPinned: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('community_posts')
      .update({
        is_pinned: isPinned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      console.error('Error toggling post pin:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in togglePostPin:', error);
    return false;
  }
};
