/**
 * Storage Operations
 *
 * High-level storage operations with business logic and convenient methods
 * for common file upload scenarios like avatars, events, podcasts, etc.
 */

import { storageClient } from './storageClient';
import { UploadResult, UploadProgress, StorageBucket } from '../core/types';

/**
 * High-level storage operations
 */
class StorageOperations {
  /**
   * Upload avatar image for a user
   */
  async uploadAvatar(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/avatar.${fileExt}`;

    return storageClient.uploadFile(
      {
        bucket: StorageBucket.AVATARS,
        path: fileName,
        file,
        options: {
          cacheControl: '3600',
          upsert: true,
        },
      },
      onProgress
    );
  }

  /**
   * Upload event image
   */
  async uploadEventImage(
    file: File,
    eventId: string,
    userId: string,
    type: 'banner' | 'thumbnail' = 'banner',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${eventId}/${type}.${fileExt}`;

    return storageClient.uploadFile(
      {
        bucket: StorageBucket.EVENTS,
        path: fileName,
        file,
        options: {
          cacheControl: '3600',
          upsert: true,
        },
      },
      onProgress
    );
  }

  /**
   * Upload podcast file
   */
  async uploadPodcastFile(
    file: File,
    podcastId: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop() || 'mp3';
    const fileName = `${podcastId}/audio.${fileExt}`;

    return storageClient.uploadFile(
      {
        bucket: StorageBucket.PODCASTS,
        path: fileName,
        file,
        options: {
          cacheControl: '3600',
          upsert: true,
        },
      },
      onProgress
    );
  }

  /**
   * Upload podcast image
   */
  async uploadPodcastImage(
    file: File,
    podcastId: string,
    userId: string,
    type: 'cover' | 'thumbnail' = 'cover'
  ): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${podcastId}/${type}.${fileExt}`;

    return storageClient.uploadFile({
      bucket: StorageBucket.PODCASTS,
      path: fileName,
      file,
      options: {
        cacheControl: '3600',
        upsert: true,
      },
    });
  }

  /**
   * Upload generic file
   */
  async uploadGenericFile(
    file: File,
    bucket: string,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    return storageClient.uploadFile(
      {
        bucket,
        path,
        file,
        options: {
          cacheControl: '3600',
          upsert: false,
        },
      },
      onProgress
    );
  }

  /**
   * Delete file by URL
   */
  async deleteFile(url: string): Promise<boolean> {
    return storageClient.deleteFile(url);
  }

  /**
   * Get file URL
   */
  getFileUrl(bucket: string, path: string): string {
    return storageClient.getFileUrl(bucket, path);
  }
}

export const storageOperations = new StorageOperations();
