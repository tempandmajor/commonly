/**
 * Comprehensive Social Features Service
 */

import { supabase } from '@/integrations/supabase/client';

export interface SocialProfile {
  id: string;
  display_name?: string | undefined;
  name?: string | undefined;
  username?: string | undefined;
  bio?: string | undefined;
  avatar_url?: string | undefined;
  cover_image_url?: string | undefined;
  location?: string | undefined;
  website?: string | undefined;
  profession?: string | undefined;
  company?: string | undefined;
  follower_count: number;
  following_count: number;
  post_count: number;
  event_count: number;
  is_verified: boolean;
  is_following?: boolean | undefined;
  last_active?: string | undefined;
  social_links?: {
    twitter?: string | undefined;
    instagram?: string | undefined;
    linkedin?: string | undefined;
    youtube?: string | undefined;
  };
}

export interface FollowRelationship {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: {
    id: string | undefined;
    display_name?: string | undefined;
    name?: string | undefined;
    avatar_url?: string | undefined;
    is_verified?: boolean | undefined;
  };
  following?: {
    id: string;
    display_name?: string;
    name?: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export interface SocialPost {
  id: string;
  content: string;
  image_url?: string | undefined;
  video_url?: string | undefined;
  created_at: string;
  updated_at?: string | undefined;
  creator: {
    id: string;
    display_name?: string | undefined;
    name?: string | undefined;
    avatar_url?: string | undefined;
    is_verified?: boolean | undefined;
  };
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked?: boolean;
  is_shared?: boolean;
  comments?: SocialComment[];
  tags?: string[];
  mentions?: string[];
}

export interface SocialComment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  commenter: {
    id: string;
    display_name?: string | undefined;
    name?: string | undefined;
    avatar_url?: string | undefined;
    is_verified?: boolean | undefined;
  };
  likes_count: number;
  is_liked?: boolean;
  replies_count: number;
  parent_comment_id?: string;
}

export interface SocialNotification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'share' | 'event_invite' | 'event_reminder';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    id: string | undefined;
    display_name?: string | undefined;
    name?: string | undefined;
    avatar_url?: string | undefined;
  };
  target_id?: string;
  target_type?: string;
}

export interface RecommendedUser {
  id: string;
  display_name?: string | undefined;
  name?: string | undefined;
  username?: string | undefined;
  avatar_url?: string | undefined;
  bio?: string | undefined;
  follower_count: number;
  mutual_connections: number;
  common_interests: string[];
  is_verified?: boolean | undefined;
}

export class SocialFeaturesService {
  // Profile Management
  static async getSocialProfile(userId: string): Promise<SocialProfile | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(
          `
          id,
          display_name,
          name,
          username,
          bio,
          avatar_url,
          cover_image_url,
          location,
          website,
          profession,
          company,
          is_verified,
          last_active,
          social_links
        `
        )
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Get follower/following counts
      const [followersResult, followingResult, postsResult, eventsResult] = await Promise.all([
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId).then(result => result),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId).then(result => result),
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', userId).then(result => result),
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', userId).then(result => result),
      ]);

      return {
          ...user,
        follower_count: followersResult.count || 0,
        following_count: followingResult.count || 0,
        post_count: postsResult.count || 0,
        event_count: eventsResult.count || 0,
        is_verified: user.is_verified || false,
      };
    } catch (error) {
      console.error('Error fetching social profile:', error);
      return null;
    }
  }

  // Follow/Unfollow
  static async followUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('follows').insert({
        follower_id: followerId,
        following_id: followingId,
      });

      if (error) throw error;

      // Create notification
      await this.createNotification({
        user_id: followingId,
        type: 'follow',
        title: 'New Follower',
        message: 'started following you',
        actor_id: followerId,
      });

      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }

  static async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  // Posts Management
  static async createPost(post: {
    creator_id: string;
    content: string;
    image_url?: string;
    video_url?: string;
    tags?: string[];
    mentions?: string[];
  }): Promise<SocialPost | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          creator_id: post.creator_id,
          content: post.content,
          image_url: post.image_url,
          video_url: post.video_url,
          tags: post.tags,
          mentions: post.mentions,
        })
        .select(
          `
          id,
          content,
          image_url,
          video_url,
          created_at,
          tags,
          mentions,
          creator:users(id, display_name, name, avatar_url, is_verified)
        `
        )
        .single();

      if (error) throw error;

      // Create notifications for mentions
      if (post.mentions && post.mentions.length > 0) {
        await Promise.all(
          post.mentions.map(mentionedUserId =>
            this.createNotification({
              user_id: mentionedUserId,
              type: 'mention',
              title: 'You were mentioned',
              message: 'mentioned you in a post',
              actor_id: post.creator_id,
              target_id: data.id,
              target_type: 'post',
            })
          )
        );
      }

      return {
          ...data,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_liked: false,
        is_shared: false,
      };
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  }

  static async getUserPosts(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<SocialPost[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          id,
          content,
          image_url,
          video_url,
          created_at,
          updated_at,
          tags,
          mentions,
          creator:users(id, display_name, name, avatar_url, is_verified)
        `
        )
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get interaction counts for each post
      const postsWithCounts = await Promise.all(
        (data || []).map(async post => {
          const [likesResult, commentsResult, sharesResult] = await Promise.all([
            supabase
              .from('post_likes')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id).then(result => result),
            supabase
              .from('post_comments')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id).then(result => result),
            supabase
              .from('post_shares')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id).then(result => result),
          ]);

          return {
          ...post,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            shares_count: sharesResult.count || 0,
            is_liked: false, // Would need to check current user's likes
            is_shared: false,
          };
        })
      );

      return postsWithCounts;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }
  }

  static async getFeedPosts(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<SocialPost[]> {
    try {
      // Get posts from followed users
      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          id,
          content,
          image_url,
          video_url,
          created_at,
          updated_at,
          tags,
          mentions,
          creator:users(id, display_name, name, avatar_url, is_verified),
          creator_id
        `
        )
        .in('creator_id', supabase.from('follows').select('following_id').eq('follower_id', userId))
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get interaction counts and user's interactions
      const postsWithCounts = await Promise.all(
        (data || []).map(async post => {
          const [likesResult, commentsResult, sharesResult, userLike, userShare] =
            await Promise.all([
              supabase
                .from('post_likes')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', post.id).then(result => result),
              supabase
                .from('post_comments')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', post.id).then(result => result),
              supabase
                .from('post_shares')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', post.id).then(result => result),
              supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', userId)
                .single(),
              supabase
                .from('post_shares')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', userId)
                .single(),
            ]);

          return {
          ...post,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            shares_count: sharesResult.count || 0,
            is_liked: !userLike.error && !!userLike.data,
            is_shared: !userShare.error && !!userShare.data,
          };
        })
      );

      return postsWithCounts;
    } catch (error) {
      console.error('Error fetching feed posts:', error);
      return [];
    }
  }

  // Like/Unlike Posts
  static async likePost(userId: string, postId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('post_likes').insert({
        user_id: userId,
        post_id: postId,
      });

      if (error) throw error;

      // Get post creator to send notification
      const { data: post } = await supabase
        .from('posts')
        .select('creator_id')
        .eq('id', postId)
        .single();

      if (post && post.creator_id !== userId) {
        await this.createNotification({
          user_id: post!.creator_id,
          type: 'like',
          title: 'Post Liked',
          message: 'liked your post',
          actor_id: userId,
          target_id: postId,
          target_type: 'post',
        });
      }

      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  }

  static async unlikePost(userId: string, postId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('post_likes')
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

  // Comments
  static async createComment(comment: {
    user_id: string;
    post_id: string;
    content: string;
    parent_comment_id?: string;
  }): Promise<SocialComment | null> {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          user_id: comment.user_id,
          post_id: comment.post_id,
          content: comment.content,
          parent_comment_id: comment.parent_comment_id,
        })
        .select(
          `
          id,
          content,
          created_at,
          post_id,
          parent_comment_id,
          commenter:users(id, display_name, name, avatar_url, is_verified)
        `
        )
        .single();

      if (error) throw error;

      // Create notification for post creator
      const { data: post } = await supabase
        .from('posts')
        .select('creator_id')
        .eq('id', comment.post_id)
        .single();

      if (post && post.creator_id !== comment.user_id) {
        await this.createNotification({
          user_id: post.creator_id,
          type: 'comment',
          title: 'New Comment',
          message: 'commented on your post',
          actor_id: comment.user_id,
          target_id: comment.post_id,
          target_type: 'post',
        });
      }

      return {
          ...data,
        likes_count: 0,
        is_liked: false,
        replies_count: 0,
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      return null;
    }
  }

  // Notifications
  static async createNotification(notification: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    actor_id?: string;
    target_id?: string;
    target_type?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actor_id: notification.actor_id,
        target_id: notification.target_id,
        target_type: notification.target_type,
        is_read: false,
      });

      return !error;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  static async getUserNotifications(
    userId: string,
    limit: number = 20
  ): Promise<SocialNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(
          `
          id,
          type,
          title,
          message,
          is_read,
          created_at,
          target_id,
          target_type,
          actor:users(id, display_name, name, avatar_url)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // User Recommendations
  static async getRecommendedUsers(userId: string, limit: number = 10): Promise<RecommendedUser[]> {
    try {
      // Get users the current user is not following
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          id,
          display_name,
          name,
          username,
          bio,
          avatar_url,
          is_verified
        `
        )
        .neq('id', userId)
        .not(
          'id',
          'in',
          `(${supabase.from('follows').select('following_id').eq('follower_id', userId)})`
        )
        .limit(limit);

      if (error) throw error;

      // Calculate follower counts and mock mutual connections for now
      const recommendations = await Promise.all(
        (data || []).map(async user => {
          const { count: followerCount } = await supabase
            .from('follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', user.id);

          return {
          ...user,
            follower_count: followerCount || 0,
            mutual_connections: Math.floor(Math.random() * 5), // Mock for now
            common_interests: ['Events', 'Community'], // Mock for now
            is_verified: user.is_verified || false,
          };
        })
      );

      return recommendations.sort((a, b) => b.follower_count - a.follower_count);
    } catch (error) {
      console.error('Error fetching recommended users:', error);
      return [];
    }
  }

  // Followers/Following
  static async getFollowers(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<FollowRelationship[]> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(
          `
          id,
          follower_id,
          following_id,
          created_at,
          follower:users(id, display_name, name, avatar_url, is_verified)
        `
        )
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  }

  static async getFollowing(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<FollowRelationship[]> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(
          `
          id,
          follower_id,
          following_id,
          created_at,
          following:users(id, display_name, name, avatar_url, is_verified)
        `
        )
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  }
}

export default SocialFeaturesService;
