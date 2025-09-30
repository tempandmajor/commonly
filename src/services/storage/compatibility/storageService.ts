/**
 * Storage Service Compatibility Layer
 *
 * Provides backwards compatibility for legacy code while redirecting
 * to the new consolidated storage API.
 */

import { storageClient } from '../api/storageClient';
import { storageOperations } from '../api/storageOperations';

/**
 * @deprecated Use the consolidated storage API directly:
 * import { storageOperations } from '@/services/storage';
 */
export const uploadFile = async (
  file: File,
  bucket: string,
  path: string,
  onProgress?: (progress: number) => void
) => {
  const result = await storageClient.uploadFile(
    { bucket, path, file },
    onProgress ? { progress: progress => onProgress(progress.progress) } : undefined
  );

  return { url: result.url, path: result.path };
};

/**
 * @deprecated Use the consolidated storage API directly:
 * import { storageOperations } from '@/services/storage';
 */
export const deleteFile = async (url: string) => {
  return storageClient.deleteFile(url);
};

/**
 * @deprecated Use the consolidated storage API directly:
 * import { storageOperations } from '@/services/storage';
 */
export const getFileUrl = (bucket: string, path: string) => {
  return storageClient.getFileUrl(bucket, path);
};

/**
 * Legacy storage service class
 * @deprecated Use storageOperations.uploadGenericFile
 */
export class StorageService {
  static async uploadFile(file: File, bucket: string, path: string) {
    return uploadFile(file, bucket, path);
  }

  /**
   * @deprecated Use storageOperations.deleteFile
   */
  static async deleteFile(url: string) {
    return deleteFile(url);
  }

  /**
   * @deprecated Use storageClient.getFileUrl
   */
  static getFileUrl(bucket: string, path: string) {
    return getFileUrl(bucket, path);
  }

  /**
   * @deprecated Use storageOperations.uploadAvatarImage
   */
  static async uploadAvatarImage(file: File, userId: string) {
    return storageOperations.uploadAvatar(file, userId);
  }

  /**
   * @deprecated Use storageOperations.uploadEventImage
   */
  static async uploadEventImage(file: File, eventId: string, userId: string, type: unknown) {
    return storageOperations.uploadEventImage(
      file,
      eventId,
      userId,
      type as 'banner' | 'thumbnail'
    );
  }
}

// Default export for legacy imports
export default StorageService;
