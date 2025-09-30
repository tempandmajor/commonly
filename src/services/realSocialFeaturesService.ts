/**
 * Real Social Features Service - Replaces placeholder social functionality
 */
import { supabase } from '@/integrations/supabase/client';

export interface SocialPost {
  id: string;
  creator_id: string;
  content: string;
  image_url?: string | undefined;
  video_url?: string | undefined;
  tags: string[];
  mentions: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked?: boolean | undefined;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    name: string;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
    is_verified?: boolean | undefined;
  };
}

export interface RecommendedUser {
  id: string;
  name: string;
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  bio?: string | undefined;
  follower_count: number;
  is_verified?: boolean | undefined;
}

export interface SocialNotification {
  id: string;
  user_id: string;
  actor_id?: string | undefined;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'share';
  message: string;
  post_id?: string | undefined;
  comment_id?: string | undefined;
  is_read: boolean;
  created_at: string;
  actor?: {
    id: string | undefined;
    name: string;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
  };
}

export interface TrendingTag {
  tag: string;
  post_count: number;
  engagement_score: number;
}

export interface UserSocialStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
  likes_received_count: number;
  likes_given_count: number;
}

class RealSocialFeaturesService {
  /**
   * Get feed posts for a user
   */
  async getFeedPosts(userId: string, limit = 20): Promise<SocialPost[]> {
    try {
      // Get posts from users the current user follows, plus their own posts
      const { data: posts, error } = await supabase
        .from('social_posts')
        .select(
          `
          *,
          creator:users!social_posts_creator_id_fkey(id, name, display_name, avatar_url, is_verified)
        `
        )
        .eq('is_published', true)
        .or(
          `creator_id.eq.${userId},creator_id.in.(
          SELECT following_id FROM user_follows WHERE follower_id = '${userId}'
        )`
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Check which posts the user has liked
      const postIds = posts?.map(p => p.id) || [];
      const { data: likedPosts } = await supabase
        .from('social_post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      const likedPostIds = new Set(likedPosts?.map(l => l.post_id) || []);

      return (posts || []).map(post => ({
          ...post,
        is_liked: likedPostIds.has(post.id),
      })) as SocialPost[];
    } catch (error) {
      console.error('Error fetching feed posts:', error);
      return [];
    }
  }

  /**
   * Create a new social post
   */
  async createPost(postData: {
    creator_id: string;
    content: string;
    image_url?: string;
    tags?: string[];
    mentions?: string[];
  }): Promise<SocialPost | null> {
    try {
      const { data: post, error } = await supabase
        .from('social_posts')
        .insert({
          creator_id: postData.creator_id,
          content: postData.content,
          image_url: postData.image_url,
          tags: postData.tags || [],
          mentions: postData.mentions || [],
          is_published: true,
        })
        .select(
          `
          *,
          creator:users!social_posts_creator_id_fkey(id, name, display_name, avatar_url, is_verified)
        `
        )
        .single();

      if (error) throw error;

      return post as SocialPost;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  }

  /**
   * Like a post
   */
  async likePost(userId: string, postId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('social_post_likes').insert({
        user_id: userId,
        post_id: postId,
      });

      if (error) throw error;

      // Create notification for post creator
      const { data: post } = await supabase
        .from('social_posts')
        .select('creator_id')
        .eq('id', postId)
        .single();

      if (post && post.creator_id !== userId) {
        await supabase.from('social_notifications').insert({
          user_id: post!.creator_id,
          actor_id: userId,
          type: 'like',
          message: 'liked your post',
          post_id: postId,
        });
      }

      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(userId: string, postId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unliking post:', error);
      return false;
    }
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_follows').insert({
        follower_id: followerId,
        following_id: followingId,
      });

      if (error) throw error;

      // Create notification
      await supabase.from('social_notifications').insert({
        user_id: followingId,
        actor_id: followerId,
        type: 'follow',
        message: 'started following you',
      });

      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }

  /**
   * Get recommended users
   */
  async getRecommendedUsers(userId: string, limit = 5): Promise<RecommendedUser[]> {
    try {
      // Get users not already followed, with follower counts
      const { data: users, error } = await supabase
        .from('users')
        .select(
          `
          id,
          name,
          display_name,
          avatar_url,
          is_verified,
          bio,
          user_social_stats(followers_count)
        `
        )
        .neq('id', userId)
        .not(
          'id',
          'in',
          `(
          SELECT following_id FROM user_follows WHERE follower_id = '${userId}'
        )`
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (users || []).map(user => ({
        id: user.id,
        name: user.name,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        follower_count: user.user_social_stats?.[0]?.followers_count || 0,
        is_verified: user.is_verified || false,
      }));
    } catch (error) {
      console.error('Error fetching recommended users:', error);
      return [];
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit = 10): Promise<SocialNotification[]> {
    try {
      const { data: notifications, error } = await supabase
        .from('social_notifications')
        .select(
          `
          *,
          actor:users!social_notifications_actor_id_fkey(id, name, display_name, avatar_url)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return notifications as SocialNotification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get trending tags
   */
  async getTrendingTags(limit = 10): Promise<TrendingTag[]> {
    try {
      const { data: tags, error } = await supabase
        .from('trending_tags')
        .select('tag, post_count, engagement_score')
        .order('trending_rank', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return tags || [];
    } catch (error) {
      console.error('Error fetching trending tags:', error);
      return [];
    }
  }

  /**
   * Get user social statistics
   */
  async getUserSocialStats(userId: string): Promise<UserSocialStats> {
    try {
      const { data: stats, error } = await supabase
        .from('user_social_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return (
        stats || {
          posts_count: 0,
          followers_count: 0,
          following_count: 0,
          likes_received_count: 0,
          likes_given_count: 0,
        }
      );
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        posts_count: 0,
        followers_count: 0,
        following_count: 0,
        likes_received_count: 0,
        likes_given_count: 0,
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Search posts by content or tags
   */
  async searchPosts(query: string, limit = 20): Promise<SocialPost[]> {
    try {
      const { data: posts, error } = await supabase
        .from('social_posts')
        .select(
          `
          *,
          creator:users!social_posts_creator_id_fkey(id, name, display_name, avatar_url, is_verified)
        `
        )
        .eq('is_published', true)
        .or(`content.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return posts as SocialPost[];
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }
}

export const realSocialFeaturesService = new RealSocialFeaturesService();
export default realSocialFeaturesService;
