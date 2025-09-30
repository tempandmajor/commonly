import { supabase } from '@/integrations/supabase/client';
import { UploadProgress, UploadResult, UploadOptions } from './core/types';

class SupabaseStorageService {
  private buckets = {
    podcasts: 'podcasts',
    thumbnails: 'thumbnails',
    recordings: 'recordings',
    transcriptions: 'transcriptions',
  };

  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Remove automatic initialization from constructor to prevent unnecessary API calls
    // Buckets will be created lazily when needed
  }

  private async ensureBucketsInitialized(): Promise<void> {
    if (this.initialized) return;

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeBuckets();
    await this.initializationPromise;
  }

  private async initializeBuckets() {
    try {
      console.debug('StorageService: Initializing storage buckets...');

      // Get list of existing buckets once
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.warn('StorageService: Could not list buckets:', listError.message);
        this.initialized = true; // Mark as initialized to prevent retries
        return;
      }

      const existingBucketNames = existingBuckets?.map(b => b.name) || [];
      console.debug('StorageService: Found existing buckets:', existingBucketNames);

      // Only create buckets that don't exist
      for (const [name, bucket] of Object.entries(this.buckets)) {
        if (existingBucketNames.includes(bucket)) {
          console.debug(`StorageService: Bucket '${bucket}' already exists, skipping creation`);
          continue;
        }

        try {
          console.debug(`StorageService: Creating bucket '${bucket}'...`);
          const { error } = await supabase.storage.createBucket(bucket, {
            public: true,
            allowedMimeTypes: this.getAllowedMimeTypes(bucket),
            fileSizeLimit: this.getFileSizeLimit(bucket),
          });

          if (error) {
            // Handle specific error cases
            if (error.message?.includes('already exists')) {
              console.debug(`StorageService: Bucket '${bucket}' already exists (race condition)`);
              continue;
            }

            if (
              error.message?.includes('exceeded the maximum') ||
              error.message?.includes('Payload too large') ||
              error.message?.includes('413')
            ) {
              console.warn(
                `StorageService: Bucket '${bucket}' size limit too large for current plan. Consider upgrading Supabase plan or reducing file size limits.`
              );
              continue;
            }

            if (
              error.message?.includes('row-level security') ||
              error.message?.includes('permission')
            ) {
              console.warn(
                `StorageService: Permission denied for bucket '${bucket}'. This may be expected in production.`
              );
              continue;
            }

            console.warn(`StorageService: Could not create bucket '${bucket}':`, error.message);
          } else {
            console.debug(`StorageService: Successfully created bucket '${bucket}'`);
          }
        } catch (bucketError) {
          // Individual bucket operation failed - continue with others
          console.warn(`StorageService: Error creating bucket '${bucket}':`, bucketError);
        }
      }

      this.initialized = true;
      console.debug('StorageService: Bucket initialization completed');
    } catch (error) {
      console.warn('StorageService: Bucket initialization failed:', error);
      this.initialized = true; // Mark as initialized to prevent infinite retries
    }
  }

  private getAllowedMimeTypes(bucket: string): string[] {
    switch (bucket) {
      case this.buckets.podcasts:
      case this.buckets.recordings:
        return ['audio/*', 'video/*'];
      case this.buckets.thumbnails:
        return ['image/*'];
      case this.buckets.transcriptions:
        return ['text/*', 'application/json'];
      default:
        return ['*/*'];
    }
  }

  private getFileSizeLimit(bucket: string): number {
    // Reduced file size limits to stay within Supabase free tier constraints
    switch (bucket) {
      case this.buckets.podcasts:
      case this.buckets.recordings:
        return 50 * 1024 * 1024; // Reduced from 500MB to 50MB for free tier compatibility
      case this.buckets.thumbnails:
        return 5 * 1024 * 1024; // Reduced from 10MB to 5MB
      case this.buckets.transcriptions:
        return 1 * 1024 * 1024; // 1MB (unchanged)
      default:
        return 25 * 1024 * 1024; // Reduced from 50MB to 25MB
    }
  }

  async uploadPodcastFile(
    file: File,
    podcastId: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Ensure buckets are initialized before upload
    await this.ensureBucketsInitialized();

    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/${podcastId}/main.${fileExtension}`;

    return this.uploadFile(
      {
        bucket: this.buckets.podcasts,
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

  async uploadThumbnail(
    file: File,
    podcastId: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Ensure buckets are initialized before upload
    await this.ensureBucketsInitialized();

    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/${podcastId}/thumbnail.${fileExtension}`;

    return this.uploadFile(
      {
        bucket: this.buckets.thumbnails,
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

  async uploadRecording(
    file: File,
    sessionId: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Ensure buckets are initialized before upload
    await this.ensureBucketsInitialized();

    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/${sessionId}/${timestamp}.${fileExtension}`;

    return this.uploadFile(
      {
        bucket: this.buckets.recordings,
        path: fileName,
        file,
        options: {
          cacheControl: '3600',
          upsert: false,
        },
      },
      onProgress
    );
  }

  async uploadTranscription(
    content: string,
    podcastId: string,
    userId: string
  ): Promise<UploadResult> {
    // Ensure buckets are initialized before upload
    await this.ensureBucketsInitialized();

    const fileName = `${userId}/${podcastId}/transcription.json`;
    const file = new Blob([JSON.stringify({ content, timestamp: Date.now() })], {
      type: 'application/json',
    });

    return this.uploadFile({
      bucket: this.buckets.transcriptions,
      path: fileName,
      file: file as File,
      options: {
        cacheControl: '3600',
        upsert: true,
      },
    });
  }

  private async uploadFile(
    options: UploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const { bucket, path, file, options: uploadOptions } = options;

      // Validate file size
      const maxSize = this.getFileSizeLimit(bucket);
      if (file.size > maxSize) {
        return {
          success: false,
          error: `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
        };
      }

      // Upload with progress tracking
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
          ...uploadOptions,
        duplex: 'half', // Required for progress tracking
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path,
        size: file.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async getFileUrl(bucket: string, path: string): Promise<string | null> {
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      return null;
    }
  }

  async listFiles(bucket: string, path?: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(path);

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Helper method to convert transcription to WebVTT format
  private convertToVTT(transcription: string): string {
    const lines = transcription.split('\n');
    let vtt = 'WEBVTT\n\n';

    lines.forEach((line, index) => {
      if (line.trim()) {
        const startTime = this.formatVTTTime(index * 5); // 5 seconds per line
        const endTime = this.formatVTTTime((index + 1) * 5);
        vtt += `${startTime} --> ${endTime}\n${line.trim()}\n\n`;
      }
    });

    return vtt;
  }

  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  // Get storage usage statistics
  async getStorageUsage(userId: string): Promise<{
    totalSize: number;
    fileCount: number;
    byBucket: Record<string, { size: number; count: number }>;
  }> {
    let totalSize = 0;
    let fileCount = 0;
    const byBucket: Record<string, { size: number; count: number }> = {};

    for (const [name, bucket] of Object.entries(this.buckets)) {
      try {
        const files = await this.listFiles(bucket, userId);
        let bucketSize = 0;

        for (const file of files) {
          if (file.metadata?.size) {
            bucketSize += file.metadata.size;
          }
        }

        byBucket[name] = {
          size: bucketSize,
          count: files.length,
        };

        totalSize += bucketSize;
        fileCount += files.length;
      } catch (error) {
        byBucket[name] = { size: 0, count: 0 };
      }
    }

    return { totalSize, fileCount, byBucket };
  }
}

export default new SupabaseStorageService();
