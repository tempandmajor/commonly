/**
 * Storage Service
 *
 * This file exports the unified storage service API and related types.
 *
 * New code should use the exported API objects directly:
 * import { storageOperations, useUpload } from '@/services/storage';
 *
 * Legacy code can continue to use the compatibility exports:
 * import { uploadFile, deleteFile } from '@/services/storage';
 */

// Export core API
export { storageClient } from './api/storageClient';
export { storageOperations } from './api/storageOperations';

// Export types
export type {
  UploadOptions,
  UploadResult,
  UploadProgress,
  StorageError,
  FileMetadata,
  ListFilesOptions,
} from './core/types';

// Export enums and classes (values)
export { StorageBucket, StorageErrorType } from './core/types';

// Export React hooks
export {
  useUpload,
  useAvatarUpload,
  useEventImageUpload,
  usePodcastUpload,
  useListFiles,
  useDeleteFile,
} from './hooks/useStorage';

// Export compatibility API for legacy code
export {
  uploadFile,
  deleteFile,
  getFileUrl,
  StorageService,
  default as LegacyStorageService,
} from './compatibility/storageService';
