import { useQueryClient } from '@tanstack/react-query';
import { getPodcast } from '@/services/podcast';
import { useCallback } from 'react';

export const usePodcastCache = () => {
  const queryClient = useQueryClient();

  // Prefetch a podcast by ID (useful for optimizing navigation)
  const prefetchPodcast = useCallback(
    async (podcastId: string) => {
      return queryClient.prefetchQuery({
        queryKey: ['podcast', podcastId],
        queryFn: () => getPodcast(podcastId),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
    [queryClient]
  );

  // Invalidate podcast cache when data changes
  const invalidatePodcast = useCallback(
    (podcastId: string) => {
      queryClient.invalidateQueries({
        queryKey: ['podcast', podcastId],
      });
    },
    [queryClient]
  );

  // Invalidate all podcasts listings
  const invalidatePodcastsList = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['podcasts'],
    });
  }, [queryClient]);

  return {
    prefetchPodcast,
    invalidatePodcast,
    invalidatePodcastsList,
  };
};
