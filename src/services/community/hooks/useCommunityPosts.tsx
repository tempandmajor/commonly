/**
 * React hooks for community posts management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import * as PostsAPI from '../api/posts';
import { CreatePostData, UpdatePostData } from '../api/posts';
import { toast } from 'sonner';

/**
 * Hook to fetch community posts
 */
export const useCommunityPosts = (
  communityId: string | undefined,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: ['community', communityId, 'posts', page, pageSize],
    queryFn: () =>
      communityId
        ? PostsAPI.getCommunityPosts(communityId, page, pageSize)
        : { posts: [], total: 0, hasMore: false },
    enabled: !!communityId,
    placeholderData: previousData => previousData,
  });
};

/**
 * Hook to create a new community post
 */
export const useCreateCommunityPost = (communityId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (postData: CreatePostData) => {
      if (!user) throw new Error('User must be logged in to create a post');
      return PostsAPI.createCommunityPost(postData, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'posts'] });
      toast.success('Post created successfully');
    },
    onError: error => {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    },
  });
};

/**
 * Hook to update a community post
 */
export const useUpdateCommunityPost = (communityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, updates }: { postId: string; updates: UpdatePostData }) => {
      return PostsAPI.updateCommunityPost(postId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'posts'] });
      toast.success('Post updated successfully');
    },
    onError: error => {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    },
  });
};

/**
 * Hook to delete a community post
 */
export const useDeleteCommunityPost = (communityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => {
      return PostsAPI.deleteCommunityPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'posts'] });
      toast.success('Post deleted successfully');
    },
    onError: error => {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    },
  });
};

/**
 * Hook to toggle pin status of a post
 */
export const useTogglePostPin = (communityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, isPinned }: { postId: string; isPinned: boolean }) => {
      return PostsAPI.togglePostPin(postId, isPinned);
    },
    onSuccess: (_, { isPinned }) => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'posts'] });
      toast.success(isPinned ? 'Post pinned successfully' : 'Post unpinned successfully');
    },
    onError: error => {
      console.error('Error toggling post pin:', error);
      toast.error('Failed to update post');
    },
  });
};
