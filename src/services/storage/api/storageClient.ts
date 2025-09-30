/**
 * Storage Client
 *
 * Low-level wrapper around Supabase Storage with enhanced error handling,
 * progress tracking, and standardized responses.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  UploadOptions,
  UploadResult,
  UploadProgress,
  StorageError,
  StorageErrorType,
  ListFilesOptions,
  FileMetadata,
} from '../core/types';

/**
 * StorageClient provides methods for interacting with the storage backend
 */
class StorageClient {
  /**
   * Upload a file to storage
   */
  async uploadFile(
    options: UploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const { bucket, path, file, options: uploadOptions = {} } = options;

      // Simulate progress if callback provided
      if (onProgress) {
        onProgress({ progress: 0, loaded: 0, total: file.size });
      }

      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: uploadOptions.cacheControl || '3600',
        contentType: uploadOptions.contentType || file.type,
        upsert: uploadOptions.upsert || false,
      });

      if (error) {
        throw new StorageError(
          `Upload failed: ${error.message}`,
          StorageErrorType.UPLOAD_FAILED,
          error
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      // Final progress update
      if (onProgress) {
        onProgress({ progress: 100, loaded: file.size, total: file.size });
      }

      return {
        success: true,
        url: publicUrl,
        path: data.path,
        size: file.size,
      };
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      throw new StorageError('Unknown upload error', StorageErrorType.UNKNOWN_ERROR, error);
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(url: string): Promise<boolean> {
    try {
      // Extract path from URL
      const urlParts = url.split('/');
      const bucket = urlParts[urlParts.length - 3];
      const path = urlParts.slice(-2).join('/');

      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        throw new StorageError(
          `Delete failed: ${error.message}`,
          StorageErrorType.DELETE_FAILED,
          error
        );
      }

      return true;
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      throw new StorageError('Unknown delete error', StorageErrorType.UNKNOWN_ERROR, error);
    }
  }

  /**
   * Get public URL for a file
   */
  getFileUrl(bucket: string, path: string): string {
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return publicUrl;
  }

  /**
   * List files in a bucket
   */
  async listFiles(bucket: string, options: ListFilesOptions = {}): Promise<FileMetadata[]> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(options.prefix || '', {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: options.sortBy
          ? {
              column: options.sortBy.column,
              order: options.sortBy.order,
            }
          : undefined,
      });

      if (error) {
        throw new StorageError(
          `List files failed: ${error.message}`,
          StorageErrorType.UNKNOWN_ERROR,
          error
        );
      }

      return data.map(file => ({
        name: file.name,
        size: file.metadata?.size,
        lastModified: file.metadata?.lastModified,
        type: file.metadata?.mimetype,
        created_at: file.created_at,
        updated_at: file.updated_at,
      }));
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      throw new StorageError('Unknown list files error', StorageErrorType.UNKNOWN_ERROR, error);
    }
  }
}

export const storageClient = new StorageClient();
