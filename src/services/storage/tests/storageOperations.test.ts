/**
 * Storage Operations Tests
 *
 * Unit tests for the storage operations functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storageOperations } from '../api/storageOperations';
import { storageClient } from '../api/storageClient';
import { StorageBucket } from '../core/types';

// Mock the storage client
vi.mock('../api/storageClient', () => ({
  storageClient: {
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
    getFileUrl: vi.fn(),
  },
}));

// Mock file for testing
const createMockFile = (name: string, type: string): File => {
  return new File(['test content'], name, { type });
};

describe('StorageOperations', () => {
  const userId = 'user-123';
  const mockResult = {
    success: true,
    url: 'https://example.com/file.jpg',
    path: 'path/to/file.jpg',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (storageClient.uploadFile as any).mockResolvedValue(mockResult);
    (storageClient.deleteFile as any).mockResolvedValue(true);
    (storageClient.getFileUrl as any).mockReturnValue('https://example.com/file.jpg');
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      // Arrange
      const file = createMockFile('avatar.jpg', 'image/jpeg');
      const progressCallback = vi.fn();

      // Act
      const result = await storageOperations.uploadAvatar(file, userId, progressCallback);

      // Assert
      expect(result).toEqual(mockResult);
      expect(storageClient.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: StorageBucket.AVATARS,
          file,
          options: expect.objectContaining({
            cacheControl: '86400',
            upsert: true,
          }),
        }),
        progressCallback
      );
    });

    it('should reject non-image files', async () => {
      // Arrange
      const file = createMockFile('document.pdf', 'application/pdf');

      // Act
      const result = await storageOperations.uploadAvatar(file, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid file type');
      expect(storageClient.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('uploadEventImage', () => {
    const eventId = 'event-123';

    it('should upload event image successfully', async () => {
      // Arrange
      const file = createMockFile('banner.png', 'image/png');
      const progressCallback = vi.fn();

      // Act
      const result = await storageOperations.uploadEventImage(
        file,
        eventId,
        userId,
        'banner',
        progressCallback
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(storageClient.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: StorageBucket.EVENTS,
          options: expect.objectContaining({
            cacheControl: '86400',
            upsert: true,
          }),
        }),
        progressCallback
      );
    });

    it('should reject non-image files', async () => {
      // Arrange
      const file = createMockFile('audio.mp3', 'audio/mpeg');

      // Act
      const result = await storageOperations.uploadEventImage(file, eventId, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid file type');
      expect(storageClient.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('uploadPodcastFile', () => {
    const podcastId = 'podcast-123';

    it('should upload podcast audio file successfully', async () => {
      // Arrange
      const file = createMockFile('podcast.mp3', 'audio/mp3');
      const progressCallback = vi.fn();

      // Act
      const result = await storageOperations.uploadPodcastFile(
        file,
        podcastId,
        userId,
        progressCallback
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(storageClient.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: StorageBucket.PODCASTS,
          options: expect.objectContaining({
            cacheControl: '3600',
            upsert: true,
          }),
        }),
        progressCallback
      );
    });

    it('should reject invalid audio formats', async () => {
      // Arrange
      const file = createMockFile('document.pdf', 'application/pdf');

      // Act
      const result = await storageOperations.uploadPodcastFile(file, podcastId, userId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid file type');
      expect(storageClient.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('uploadPodcastImage', () => {
    const podcastId = 'podcast-123';

    it('should upload podcast thumbnail successfully', async () => {
      // Arrange
      const file = createMockFile('thumbnail.jpg', 'image/jpeg');

      // Act
      const result = await storageOperations.uploadPodcastImage(file, podcastId, userId);

      // Assert
      expect(result).toEqual(mockResult);
      expect(storageClient.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: StorageBucket.THUMBNAILS,
          path: expect.stringContaining('thumbnail'),
          options: expect.objectContaining({
            cacheControl: '86400',
            upsert: true,
          }),
        }),
        undefined
      );
    });
  });

  describe('uploadRecording', () => {
    const sessionId = 'session-123';

    it('should upload recording successfully', async () => {
      // Arrange
      const blob = new Blob(['test recording'], { type: 'video/webm' });

      // Act
      const result = await storageOperations.uploadRecording(blob, sessionId, userId);

      // Assert
      expect(result).toEqual(mockResult);
      expect(storageClient.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: StorageBucket.RECORDINGS,
          path: expect.stringContaining('recording.webm'),
          options: expect.objectContaining({
            cacheControl: '3600',
            contentType: 'video/webm',
            upsert: true,
          }),
        }),
        undefined
      );
    });
  });

  describe('uploadTranscription', () => {
    const podcastId = 'podcast-123';

    it('should upload JSON transcription successfully', async () => {
      // Arrange
      const transcription = 'This is a test transcription';

      // Act
      const result = await storageOperations.uploadTranscription(
        transcription,
        podcastId,
        userId,
        'json'
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(storageClient.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: StorageBucket.TRANSCRIPTIONS,
          path: expect.stringContaining('transcription.json'),
          options: expect.objectContaining({
            cacheControl: '86400',
            contentType: 'application/json',
            upsert: true,
          }),
        }),
        undefined
      );
    });

    it('should upload VTT transcription successfully', async () => {
      // Arrange
      const transcription = 'Line 1\nLine 2\nLine 3';

      // Act
      const result = await storageOperations.uploadTranscription(
        transcription,
        podcastId,
        userId,
        'vtt'
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(storageClient.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: StorageBucket.TRANSCRIPTIONS,
          path: expect.stringContaining('transcription.vtt'),
          options: expect.objectContaining({
            contentType: 'text/vtt',
          }),
        }),
        undefined
      );
    });
  });

  describe('uploadGenericFile', () => {
    it('should upload generic file successfully', async () => {
      // Arrange
      const file = createMockFile('document.pdf', 'application/pdf');
      const progressCallback = vi.fn();

      // Act
      const result = await storageOperations.uploadGenericFile(
        file,
        userId,
        'documents',
        progressCallback
      );

      // Assert
      expect(result).toEqual(mockResult);
      expect(storageClient.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: StorageBucket.GENERAL,
          options: expect.objectContaining({
            cacheControl: '3600',
            upsert: true,
          }),
        }),
        progressCallback
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file by URL', async () => {
      // Arrange
      const url = 'https://example.com/file.jpg';

      // Act
      const result = await storageOperations.deleteFile(url);

      // Assert
      expect(result).toBe(true);
      expect(storageClient.deleteFile).toHaveBeenCalledWith(url);
    });
  });

  describe('getFileUrl', () => {
    it('should get file URL', () => {
      // Act
      const url = storageOperations.getFileUrl(StorageBucket.GENERAL, 'path/to/file.jpg');

      // Assert
      expect(url).toBe('https://example.com/file.jpg');
      expect(storageClient.getFileUrl).toHaveBeenCalledWith(
        StorageBucket.GENERAL,
        'path/to/file.jpg'
      );
    });
  });
});
