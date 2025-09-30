/**
 * Storage Hooks
 *
 * React hooks for storage operations with state management, error handling,
 * and progress tracking.
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { storageClient } from '../api/storageClient';
import { storageOperations } from '../api/storageOperations';
import { useAuth } from '@/providers/AuthProvider';
import {
  UploadOptions,
  UploadResult,
  UploadProgress,
  StorageError,
  StorageBucket,
  ListFilesOptions,
} from '../core/types';

interface UseUploadOptions {
  onSuccess?: (result: UploadResult) => void | undefined;
  onError?: (error: StorageError) => void | undefined;
  onProgress?: (progress: UploadProgress) => void | undefined;
}

/**
 * Generic upload hook with progress tracking
 */
export const useUpload = (options: UseUploadOptions = {}) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({ progress: 0, loaded: 0, total: 0 });
  const [isUploading, setIsUploading] = useState(false);

  const handleProgress = useCallback(
    (progressData: UploadProgress) => {
      setProgress(progressData);
      options.onProgress?.(progressData);
    },
    [options.onProgress]
  );

  const upload = useCallback(
    async (uploadOptions: UploadOptions) => {
      setIsUploading(true);
      try {
        const result = await storageClient.uploadFile(uploadOptions, handleProgress);

        options.onSuccess?.(result);
        return result;
      } catch (error) {
        const storageError = error as StorageError;
        toast.error(`Upload failed: ${storageError.message}`);
        options.onError?.(storageError);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [handleProgress, options.onSuccess, options.onError]
  );

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {

    const selectedFile = (e.target as HTMLInputElement).files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProgress({ progress: 0, loaded: 0, total: selectedFile.size });
    }
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setProgress({ progress: 0, loaded: 0, total: 0 });
    setIsUploading(false);
  }, []);

  return {
    file,
    progress,
    isUploading,
    upload,
    handleFileChange,
    reset,
  };
};

/**
 * Avatar upload hook
 */
export const useAvatarUpload = (options: UseUploadOptions = {}) => {
  const auth = useAuth();

  const {
    file,
    progress,
    isUploading,
    upload: baseUpload,
    handleFileChange,
    reset,
  } = useUpload(options);

  const upload = useCallback(
    async (uploadFile: File) => {
      if (!auth?.user) {
        throw new Error('User not authenticated');
      }

      return await storageOperations.uploadAvatar(uploadFile, auth.user.id, options.onProgress);
    },
    [auth?.user, options.onProgress]
  );

  return {
    file,
    progress,
    isUploading,
    upload,
    handleFileChange,
    reset,
  };
};

/**
 * Event image upload hook
 */
export const useEventImageUpload = (eventId: string, options: UseUploadOptions = {}) => {
  const auth = useAuth();

  const {
    file,
    progress,
    isUploading,
    upload: baseUpload,
    handleFileChange,
    reset,
  } = useUpload(options);

  const upload = useCallback(
    async (uploadFile: File, type: 'banner' | 'thumbnail' = 'banner') => {
      if (!auth?.user) {
        throw new Error('User not authenticated');
      }

      return await storageOperations.uploadEventImage(
        uploadFile,
        eventId,
        auth.user.id,
        type,
        options.onProgress
      );
    },
    [eventId, auth?.user, options.onProgress]
  );

  return {
    file,
    progress,
    isUploading,
    upload,
    handleFileChange,
    reset,
  };
};

/**
 * Podcast upload hook
 */
export const usePodcastUpload = (podcastId: string, options: UseUploadOptions = {}) => {
  const auth = useAuth();

  const {
    file,
    progress,
    isUploading,
    upload: baseUpload,
    handleFileChange,
    reset,
  } = useUpload(options);

  const uploadAudio = useCallback(
    async (uploadFile: File) => {
      if (!auth?.user) {
        throw new Error('User not authenticated');
      }

      return await storageOperations.uploadPodcastFile(
        uploadFile,
        podcastId,
        auth.user.id,
        options.onProgress
      );
    },
    [podcastId, auth?.user, options.onProgress]
  );

  const uploadImage = useCallback(
    async (uploadFile: File, type: 'cover' | 'thumbnail' = 'cover') => {
      if (!auth?.user) {
        throw new Error('User not authenticated');
      }

      return await storageOperations.uploadPodcastImage(uploadFile, podcastId, auth.user.id, type);
    },
    [podcastId, auth?.user]
  );

  return {
    file,
    progress,
    isUploading,
    uploadAudio,
    uploadImage,
    handleFileChange,
    reset,
  };
};

/**
 * List files hook
 */
export const useListFiles = (bucket: string, options: ListFilesOptions = {}) => {
  return useQuery({
    queryKey: ['storage', 'files', bucket, options],
    queryFn: () =>
      storageClient.listFiles(bucket, {
        prefix: options.prefix,
        limit: options.limit,
        offset: options.offset,
        sortBy: options.sortBy,
      }),
    enabled: !!bucket,
  });
};

/**
 * Delete file hook
 */
export const useDeleteFile = (options?: {
  onSuccess?: () => void;
  onError?: (error: StorageError) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileUrl: string) => storageClient.deleteFile(fileUrl),
    onSuccess: () => {
      toast.success('File deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      options?.onSuccess?.();
    },
    onError: (error: StorageError) => {
      toast.error(`Delete failed: ${error.message}`);
      options?.onError?.(error);
    },
  });
};
