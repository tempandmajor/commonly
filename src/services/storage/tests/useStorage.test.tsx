/**
 * Storage Hooks Tests
 *
 * Unit tests for the storage React hooks functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useUpload,
  useAvatarUpload,
  useEventImageUpload,
  usePodcastUpload,
  useListFiles,
  useDeleteFile,
} from '../hooks/useStorage';
import { storageOperations } from '../api/storageOperations';
import { storageClient } from '../api/storageClient';
import { StorageBucket } from '../core/types';

// Mock the storage operations
vi.mock('../api/storageOperations', () => ({
  storageOperations: {
    uploadAvatar: vi.fn(),
    uploadEventImage: vi.fn(),
    uploadPodcastFile: vi.fn(),
    uploadGenericFile: vi.fn(),
    deleteFile: vi.fn(),
  },
}));

// Mock the storage client
vi.mock('../api/storageClient', () => ({
  storageClient: {
    listFiles: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import the mocked toast
import { toast } from 'sonner';

// Mock useUser hook from auth-helpers-react
vi.mock('@supabase/auth-helpers-react', () => ({
  useUser: () => ({ id: 'mock-user-id' }),
}));

// Create a wrapper with QueryClientProvider for testing hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Create mock file for testing
const createMockFile = (name = 'test.jpg', type = 'image/jpeg'): File => {
  return new File(['test content'], name, { type });
};

describe('Storage Hooks', () => {
  const mockResult = {
    success: true,
    url: 'https://example.com/file.jpg',
    path: 'path/to/file.jpg',
  };

  beforeEach(() => {
    vi.resetAllMocks();

    // Set up default mock implementations
    (storageOperations.uploadAvatar as any).mockResolvedValue(mockResult);
    (storageOperations.uploadEventImage as any).mockResolvedValue(mockResult);
    (storageOperations.uploadPodcastFile as any).mockResolvedValue(mockResult);
    (storageOperations.uploadGenericFile as any).mockResolvedValue(mockResult);
    (storageOperations.deleteFile as any).mockResolvedValue(true);
    (storageClient.listFiles as any).mockResolvedValue([
      {
        name: 'file1.jpg',
        url: 'https://example.com/file1.jpg',
        size: 1000,
        type: 'image/jpeg',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
      },
    ]);
  });

  describe('useUpload', () => {
    it('should initialize with correct default state', () => {
      // Arrange & Act
      const { result } = renderHook(() => useUpload(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.file).toBeNull();
      expect(result.current.isUploading).toBe(false);
      expect(result.current.progress).toEqual({ progress: 0, loaded: 0, total: 0 });
    });

    it('should set file when handleFileChange is called', () => {
      // Arrange
      const { result } = renderHook(() => useUpload(), {
        wrapper: createWrapper(),
      });

      // Act
      const mockFile = createMockFile();
      act(() => {
        result.current.handleFileChange({
          target: { files: [mockFile] },
        } as any);
      });

      // Assert
      expect(result.current.file).toBe(mockFile);
    });

    it('should upload file when upload is called', async () => {
      // Arrange
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useUpload({ onSuccess }), {
        wrapper: createWrapper(),
      });

      // Set file
      const mockFile = createMockFile();
      act(() => {
        result.current.handleFileChange({
          target: { files: [mockFile] },
        } as any);
      });

      // Act
      await act(async () => {
        await result.current.upload({
          bucket: StorageBucket.GENERAL,
          path: 'test/file.jpg',
          file: mockFile,
        });
      });

      // Assert
      expect(storageOperations.uploadGenericFile).toHaveBeenCalledWith(
        mockFile,
        'mock-user-id',
        'test',
        expect.any(Function)
      );
      expect(result.current.isUploading).toBe(false);
      expect(onSuccess).toHaveBeenCalledWith(mockResult);
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle upload failure', async () => {
      // Arrange
      (storageOperations.uploadGenericFile as any).mockResolvedValue({
        success: false,
        error: 'Upload failed',
      });

      const onError = vi.fn();
      const { result } = renderHook(() => useUpload({ onError }), {
        wrapper: createWrapper(),
      });

      // Set file
      const mockFile = createMockFile();
      act(() => {
        result.current.handleFileChange({
          target: { files: [mockFile] },
        } as any);
      });

      // Act
      await act(async () => {
        await result.current.upload({
          bucket: StorageBucket.GENERAL,
          path: 'test/file.jpg',
          file: mockFile,
        });
      });

      // Assert
      expect(result.current.isUploading).toBe(false);
      expect(onError).toHaveBeenCalledWith('Upload failed');
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('useAvatarUpload', () => {
    it('should upload avatar when uploadAvatar is called', async () => {
      // Arrange
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useAvatarUpload({ onSuccess }), {
        wrapper: createWrapper(),
      });

      // Set file
      const mockFile = createMockFile();
      act(() => {
        result.current.handleFileChange({
          target: { files: [mockFile] },
        } as any);
      });

      // Act
      await act(async () => {
        await result.current.uploadAvatar();
      });

      // Assert
      expect(storageOperations.uploadAvatar).toHaveBeenCalledWith(
        mockFile,
        'mock-user-id',
        expect.any(Function)
      );
      expect(onSuccess).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('useEventImageUpload', () => {
    const eventId = 'event-123';

    it('should upload event image when uploadEventImage is called', async () => {
      // Arrange
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useEventImageUpload(eventId, { onSuccess }), {
        wrapper: createWrapper(),
      });

      // Set file
      const mockFile = createMockFile();
      act(() => {
        result.current.handleFileChange({
          target: { files: [mockFile] },
        } as any);
      });

      // Act
      await act(async () => {
        await result.current.uploadEventImage('banner');
      });

      // Assert
      expect(storageOperations.uploadEventImage).toHaveBeenCalledWith(
        mockFile,
        eventId,
        'mock-user-id',
        'banner',
        expect.any(Function)
      );
      expect(onSuccess).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('usePodcastUpload', () => {
    const podcastId = 'podcast-123';

    it('should upload podcast file when uploadPodcast is called', async () => {
      // Arrange
      const onSuccess = vi.fn();
      const { result } = renderHook(() => usePodcastUpload(podcastId, { onSuccess }), {
        wrapper: createWrapper(),
      });

      // Set file
      const mockFile = createMockFile('audio.mp3', 'audio/mp3');
      act(() => {
        result.current.handleFileChange({
          target: { files: [mockFile] },
        } as any);
      });

      // Act
      await act(async () => {
        await result.current.uploadPodcast();
      });

      // Assert
      expect(storageOperations.uploadPodcastFile).toHaveBeenCalledWith(
        mockFile,
        podcastId,
        'mock-user-id',
        expect.any(Function)
      );
      expect(onSuccess).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('useListFiles', () => {
    it('should return files from the specified bucket', async () => {
      // Arrange & Act
      const { result, waitFor } = renderHook(() => useListFiles(StorageBucket.GENERAL), {
        wrapper: createWrapper(),
      });

      // Wait for query to resolve
      await waitFor(() => !result.current.isLoading);

      // Assert
      expect(storageClient.listFiles).toHaveBeenCalledWith(StorageBucket.GENERAL, undefined);
      expect(result.current.data).toEqual([
        {
          name: 'file1.jpg',
          url: 'https://example.com/file1.jpg',
          size: 1000,
          type: 'image/jpeg',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
        },
      ]);
    });

    it('should apply options when provided', async () => {
      // Arrange
      const options = {
        prefix: 'test/',
        limit: 10,
        sortBy: {
          column: 'created_at' as const,
          order: 'desc' as const,
        },
      };

      // Act
      const { result, waitFor } = renderHook(() => useListFiles(StorageBucket.GENERAL, options), {
        wrapper: createWrapper(),
      });

      // Wait for query to resolve
      await waitFor(() => !result.current.isLoading);

      // Assert
      expect(storageClient.listFiles).toHaveBeenCalledWith(StorageBucket.GENERAL, options);
    });
  });

  describe('useDeleteFile', () => {
    it('should delete file when mutate is called', async () => {
      // Arrange
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useDeleteFile({ onSuccess }), {
        wrapper: createWrapper(),
      });

      // Act
      await act(async () => {
        await result.current.mutate('https://example.com/file.jpg');
      });

      // Assert
      expect(storageOperations.deleteFile).toHaveBeenCalledWith('https://example.com/file.jpg');
      expect(onSuccess).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle delete failure', async () => {
      // Arrange
      (storageOperations.deleteFile as any).mockResolvedValue(false);

      const onError = vi.fn();
      const { result } = renderHook(() => useDeleteFile({ onError }), {
        wrapper: createWrapper(),
      });

      // Act
      await act(async () => {
        await result.current.mutate('https://example.com/file.jpg');
      });

      // Assert
      expect(onError).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
