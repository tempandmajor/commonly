/**
 * Storage Service Types
 *
 * Core types and interfaces for the Storage Service.
 */

/**
 * Available storage buckets in the system
 */
export enum StorageBucket {
  PODCASTS = 'podcasts',
  THUMBNAILS = 'thumbnails',
  RECORDINGS = 'recordings',
  TRANSCRIPTIONS = 'transcriptions',
  AVATARS = 'avatars',
  EVENTS = 'events',
  GENERAL = 'general',
}

/**
 * File upload options
 */
export interface UploadOptions {
  /** Target storage bucket */
  bucket: string;
  /** File path including filename */
  path: string;
  /** File object to upload */
  file: File | Blob;
  /** Additional upload options */
  options?: {
    /** Cache control header */
    cacheControl?: string | undefined;
    /** Content type of the file */
    contentType?: string | undefined;
    /** Whether to replace existing file */
    upsert?: boolean | undefined;
  };
}

/**
 * Result of a file upload operation
 */
export interface UploadResult {
  /** Whether the upload was successful */
  success: boolean;
  /** Public URL of the uploaded file */
  url?: string | undefined;
  /** Storage path of the file */
  path?: string | undefined;
  /** Error message if upload failed */
  error?: string | undefined;
  /** Size of the uploaded file in bytes */
  size?: number | undefined;
}

/**
 * Progress information during upload
 */
export interface UploadProgress {
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Bytes uploaded so far */
  loaded: number;
  /** Total bytes to upload */
  total: number;
}

/**
 * Storage error types
 */
export enum StorageErrorType {
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  BUCKET_NOT_FOUND = 'BUCKET_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for storage operations
 */
export class StorageError extends Error {
  type: StorageErrorType;
  details?: unknown;

  constructor(message: string, type: StorageErrorType, details?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.type = type;
    this.details = details;
  }
}

/**
 * File metadata interface
 */
export interface FileMetadata {
  /** File name */
  name: string;
  /** Last modified timestamp */
  lastModified?: number | undefined;
  /** Size in bytes */
  size?: number | undefined;
  /** MIME type */
  type?: string | undefined;
  /** Created timestamp */
  created_at?: string | undefined;
  /** Updated timestamp */
  updated_at?: string | undefined;
}

/**
 * Options for listing files in a bucket
 */
export interface ListFilesOptions {
  /** File path prefix for filtering */
  prefix?: string | undefined;
  /** Maximum number of files to return */
  limit?: number | undefined;
  /** Offset for pagination */
  offset?: number | undefined;
  /** Sort direction */
  sortBy?: {
    /** Column to sort by */
    column: 'name' | undefined| 'created_at' | 'updated_at' | 'size';
    /** Sort order */
    order: 'asc' | 'desc';
  };
}
