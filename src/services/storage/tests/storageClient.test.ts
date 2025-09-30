/**
 * Storage Client Tests
 *
 * Unit tests for the storage client functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageBucket } from '../core/types';
import { storageClient } from '../api/storageClient';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      remove: vi.fn(),
      getPublicUrl: vi.fn(),
      createSignedUploadUrl: vi.fn(),
      list: vi.fn(),
      listBuckets: vi.fn(),
      createBucket: vi.fn(),
    },
  },
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import the mocked modules to use in tests
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

describe('StorageClient', () => {
  const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
  const mockPublicUrl = 'https://example.com/storage/test.txt';

  beforeEach(() => {
    // Reset mock implementations
    vi.resetAllMocks();

    // Default mock implementations
    (supabase.storage.from as any).mockReturnThis();
    (supabase.storage.getPublicUrl as any).mockReturnValue({ data: { publicUrl: mockPublicUrl } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      // Setup mocks
      (supabase.storage.upload as any).mockResolvedValue({
        data: { path: 'test/test.txt' },
        error: null,
      });

      (supabase.storage.list as any).mockResolvedValue({
        data: [{ name: 'test.txt', metadata: { size: 12345 } }],
        error: null,
      });

      // Call the method
      const result = await storageClient.uploadFile({
        bucket: StorageBucket.GENERAL,
        path: 'test/test.txt',
        file: mockFile,
      });

      // Verify the result
      expect(result).toEqual({
        success: true,
        url: mockPublicUrl,
        path: 'test/test.txt',
        size: 12345,
      });

      // Verify the correct methods were called
      expect(supabase.storage.upload).toHaveBeenCalledWith('test/test.txt', mockFile, undefined);
    });

    it('should handle upload errors', async () => {
      // Setup mocks
      (supabase.storage.upload as any).mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      // Call the method
      const result = await storageClient.uploadFile({
        bucket: StorageBucket.GENERAL,
        path: 'test/test.txt',
        file: mockFile,
      });

      // Verify the result
      expect(result).toEqual({
        success: false,
        error: 'Upload failed',
      });

      // Verify toast error was called
      expect(toast.error).toHaveBeenCalledWith('Failed to upload file');
    });

    it('should handle progress updates', async () => {
      // Setup mocks
      (supabase.storage.createSignedUploadUrl as any).mockResolvedValue({
        data: { signedURL: 'https://signed-url.example.com' },
        error: null,
      });

      // Mock XMLHttpRequest
      const mockXhr = {
        upload: {
          addEventListener: vi.fn(),
        },
        addEventListener: vi.fn(),
        open: vi.fn(),
        send: vi.fn(),
        status: 200,
      };

      // Save original XMLHttpRequest
      const originalXHR = global.XMLHttpRequest;

      // Replace global XMLHttpRequest with mock
      global.XMLHttpRequest = vi.fn(() => mockXhr) as any;

      // Progress callback
      const progressCallback = vi.fn();

      // Mock events
      let loadCallback: Function;
      let progressEventCallback: Function;

      // Capture event listeners
      (mockXhr.addEventListener as any).mockImplementation((event, callback) => {
        if (event === 'load') loadCallback = callback;
      });

      (mockXhr.upload.addEventListener as any).mockImplementation((event, callback) => {
        if (event === 'progress') progressEventCallback = callback;
      });

      // Start upload
      const uploadPromise = storageClient.uploadFile(
        {
          bucket: StorageBucket.GENERAL,
          path: 'test/test.txt',
          file: mockFile,
        },
        progressCallback
      );

      // Simulate progress event
      progressEventCallback({
        lengthComputable: true,
        loaded: 50,
        total: 100,
      });

      // Simulate load event
      loadCallback();

      // Complete mocked responses for after load
      (supabase.storage.list as any).mockResolvedValue({
        data: [{ name: 'test.txt', metadata: { size: 12345 } }],
        error: null,
      });

      // Wait for upload to complete
      await uploadPromise;

      // Verify progress callback was called
      expect(progressCallback).toHaveBeenCalledWith({
        progress: 50,
        loaded: 50,
        total: 100,
      });

      // Restore original XMLHttpRequest
      global.XMLHttpRequest = originalXHR;
    });
  });

  describe('deleteFile', () => {
    it('should delete a file by URL', async () => {
      // Setup mocks
      (supabase.storage.remove as any).mockResolvedValue({
        data: true,
        error: null,
      });

      // Call the method with a URL
      const result = await storageClient.deleteFile(
        'https://example.com/storage/v1/object/public/bucket-name/file-path.txt'
      );

      // Verify the result
      expect(result).toBe(true);

      // Verify the correct methods were called
      expect(supabase.storage.remove).toHaveBeenCalled();
    });

    it('should delete a file by path and bucket', async () => {
      // Setup mocks
      (supabase.storage.remove as any).mockResolvedValue({
        data: true,
        error: null,
      });

      // Call the method with path and bucket
      const result = await storageClient.deleteFile('file-path.txt', 'bucket-name');

      // Verify the result
      expect(result).toBe(true);

      // Verify the correct methods were called
      expect(supabase.storage.remove).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      // Setup mocks
      (supabase.storage.remove as any).mockResolvedValue({
        data: null,
        error: { message: 'File not found' },
      });

      // Call the method
      const result = await storageClient.deleteFile('file-path.txt', 'bucket-name');

      // Verify the result
      expect(result).toBe(false);

      // Verify toast error was called
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('getFileUrl', () => {
    it('should return the public URL', () => {
      // Call the method
      const url = storageClient.getFileUrl('bucket-name', 'file-path.txt');

      // Verify the result
      expect(url).toBe(mockPublicUrl);

      // Verify the correct methods were called
      expect(supabase.storage.getPublicUrl).toHaveBeenCalled();
    });
  });

  describe('listFiles', () => {
    it('should list files in a bucket', async () => {
      // Setup mocks
      const mockFiles = [
        {
          name: 'file1.txt',
          metadata: { size: 1000, mimetype: 'text/plain' },
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
        },
        {
          name: 'file2.jpg',
          metadata: { size: 2000, mimetype: 'image/jpeg' },
          created_at: '2023-01-03T00:00:00Z',
          updated_at: '2023-01-04T00:00:00Z',
        },
      ];

      (supabase.storage.list as any).mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      // Call the method
      const result = await storageClient.listFiles('bucket-name');

      // Verify the result
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('file1.txt');
      expect(result[0].size).toBe(1000);
      expect(result[0].type).toBe('text/plain');
      expect(result[1].name).toBe('file2.jpg');

      // Verify the correct methods were called
      expect(supabase.storage.list).toHaveBeenCalled();
    });

    it('should handle list errors', async () => {
      // Setup mocks
      (supabase.storage.list as any).mockResolvedValue({
        data: null,
        error: { message: 'Bucket not found' },
      });

      // Call the method
      const result = await storageClient.listFiles('bucket-name');

      // Verify the result
      expect(result).toEqual([]);

      // Verify toast error was called
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('initializeBuckets', () => {
    it('should initialize buckets', async () => {
      // Setup mocks
      (supabase.storage.listBuckets as any).mockResolvedValue({
        data: [{ name: 'existing-bucket' }],
        error: null,
      });

      (supabase.storage.createBucket as any).mockResolvedValue({
        error: null,
      });

      // Call the method
      const result = await storageClient.initializeBuckets(['existing-bucket', 'new-bucket']);

      // Verify the result
      expect(result.existing).toContain('existing-bucket');
      expect(result.created).toContain('new-bucket');

      // Verify the correct methods were called
      expect(supabase.storage.listBuckets).toHaveBeenCalled();
      expect(supabase.storage.createBucket).toHaveBeenCalledWith('new-bucket', {
        public: true,
      });
    });

    it('should handle bucket creation errors', async () => {
      // Setup mocks
      (supabase.storage.listBuckets as any).mockResolvedValue({
        data: [],
        error: null,
      });

      (supabase.storage.createBucket as any).mockResolvedValue({
        error: { message: 'Permission denied' },
      });

      // Call the method
      const result = await storageClient.initializeBuckets(['new-bucket']);

      // Verify the result
      expect(result.failed).toContain('new-bucket');
    });
  });
});
