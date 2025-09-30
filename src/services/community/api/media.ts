/**
 * API functions for community media management
 */
import { supabase } from '@/integrations/supabase/client';

export interface CommunityMedia {
  id: string;
  community_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'video' | 'audio' | 'document';
  file_size?: number | undefined;
  mime_type?: string | undefined;
  description?: string | undefined;
  created_at: string;
  user?: {
    id: string | undefined;
    name?: string | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
  };
}

export interface UploadMediaData {
  community_id: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'video' | 'audio' | 'document';
  file_size?: number | undefined;
  mime_type?: string | undefined;
  description?: string | undefined;
}

/**
 * Get media files for a community
 */
export const getCommunityMedia = async (
  communityId: string,
  fileType?: 'image' | 'video' | 'audio' | 'document',
  page: number = 1,
  pageSize: number = 20
): Promise<{ media: CommunityMedia[]; total: number; hasMore: boolean }> => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('community_media')
      .select(
        `
        *,
        user:users!community_media_user_id_fkey(
          id,
          name,
          display_name,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('community_id', communityId);

    if (fileType) {
      query = query.eq('file_type', fileType);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching community media:', error);
      return { media: [], total: 0, hasMore: false };
    }

    return {
      media: data as CommunityMedia[],
      total: count || 0,
      hasMore: count ? from + data.length < count : false,
    };
  } catch (error) {
    console.error('Error in getCommunityMedia:', error);
    return { media: [], total: 0, hasMore: false };
  }
};

/**
 * Upload media to a community
 */
export const uploadCommunityMedia = async (
  mediaData: UploadMediaData,
  userId: string
): Promise<CommunityMedia | null> => {
  try {
    const { data, error } = await supabase
      .from('community_media')
      .insert({
          ...mediaData,
        user_id: userId,
      })
      .select(
        `
        *,
        user:users!community_media_user_id_fkey(
          id,
          name,
          display_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error('Error uploading community media:', error);
      return null;
    }

    return data as CommunityMedia;
  } catch (error) {
    console.error('Error in uploadCommunityMedia:', error);
    return null;
  }
};

/**
 * Delete media from a community
 */
export const deleteCommunityMedia = async (mediaId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('community_media').delete().eq('id', mediaId);

    if (error) {
      console.error('Error deleting community media:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteCommunityMedia:', error);
    return false;
  }
};

/**
 * Update media description
 */
export const updateCommunityMediaDescription = async (
  mediaId: string,
  description: string
): Promise<CommunityMedia | null> => {
  try {
    const { data, error } = await supabase
      .from('community_media')
      .update({ description })
      .eq('id', mediaId)
      .select(
        `
        *,
        user:users!community_media_user_id_fkey(
          id,
          name,
          display_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating media description:', error);
      return null;
    }

    return data as CommunityMedia;
  } catch (error) {
    console.error('Error in updateCommunityMediaDescription:', error);
    return null;
  }
};
