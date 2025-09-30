/**
 * React hooks for community media management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import * as MediaAPI from '../api/media';
import { UploadMediaData } from '../api/media';
import { toast } from 'sonner';

/**
 * Hook to fetch community media
 */
export const useCommunityMedia = (
  communityId: string | undefined,
  fileType?: 'image' | 'video' | 'audio' | 'document',
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: ['community', communityId, 'media', fileType, page, pageSize],
    queryFn: () =>
      communityId
        ? MediaAPI.getCommunityMedia(communityId, fileType, page, pageSize)
        : { media: [], total: 0, hasMore: false },
    enabled: !!communityId,
    placeholderData: previousData => previousData,
  });
};

/**
 * Hook to upload media to a community
 */
export const useUploadCommunityMedia = (communityId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (mediaData: UploadMediaData) => {
      if (!user) throw new Error('User must be logged in to upload media');
      return MediaAPI.uploadCommunityMedia(mediaData, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'media'] });
      toast.success('Media uploaded successfully');
    },
    onError: error => {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media');
    },
  });
};

/**
 * Hook to delete community media
 */
export const useDeleteCommunityMedia = (communityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: string) => {
      return MediaAPI.deleteCommunityMedia(mediaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'media'] });
      toast.success('Media deleted successfully');
    },
    onError: error => {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete media');
    },
  });
};

/**
 * Hook to update media description
 */
export const useUpdateCommunityMediaDescription = (communityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mediaId, description }: { mediaId: string; description: string }) => {
      return MediaAPI.updateCommunityMediaDescription(mediaId, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', communityId, 'media'] });
      toast.success('Media description updated successfully');
    },
    onError: error => {
      console.error('Error updating media description:', error);
      toast.error('Failed to update media description');
    },
  });
};
