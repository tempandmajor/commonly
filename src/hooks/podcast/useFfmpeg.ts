/**
 * FFmpeg Hook for Podcast/Video Timeline Processing
 * Rebuilt with proper TypeScript types and patterns
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { TimelineClip } from '@/lib/types/podcast-editor';

/**
 * FFmpeg load options
 */
export interface FFmpegLoadOptions {
  corePath?: string | undefined;
  useWorker?: boolean | undefined;
  log?: boolean | undefined;
}

/**
 * Video export options
 */
export interface VideoExportOptions {
  width?: number | undefined;
  height?: number | undefined;
  fps?: number | undefined;
  start?: number | undefined;
  end?: number | undefined;
  outName?: string | undefined;
  mode?: 'overlay' | undefined| 'concat-per-track';
  tracksOrder?: string[] | undefined;
}

/**
 * Audio export options
 */
export interface AudioExportOptions {
  outName?: string | undefined;
  sampleRate?: number | undefined;
  start?: number | undefined;
  end?: number | undefined;
  loudness?: boolean | undefined;
}

/**
 * Video dimensions
 */
export interface VideoDimensions {
  width: number;
  height: number;
}

/**
 * FFmpeg instance type
 */
interface FFmpegInstance {
  load(): Promise<void>;
  run(...args: string[]): Promise<void>;
  FS(method: 'writeFile', filename: string, data: Uint8Array): void;
  FS(method: 'readFile', filename: string): Uint8Array;
}

/**
 * Hook for managing FFmpeg operations in the browser
 */
export function useFfmpeg() {
  const ffmpegRef = useRef<FFmpegInstance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (ffmpegRef.current) {
        ffmpegRef.current = null;
      }
    };
  }, []);

  /**
   * Load FFmpeg with optional configuration
   */
  const load = useCallback(async (options: FFmpegLoadOptions = {}) => {
    if (isReady || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const { createFFmpeg } = await import('@ffmpeg/ffmpeg');

      const envCorePath = process.env.NEXT_PUBLIC_FFMPEG_CORE_PATH as string;

      const ffmpegConfig = {
        log: options.log ?? false,
        corePath: options.corePath ?? envCorePath,
        worker: options.useWorker ?? true,
      };

      const ffmpeg = createFFmpeg(ffmpegConfig);
      await ffmpeg.load();

      ffmpegRef.current = ffmpeg;
      setIsReady(true);
    } catch (err: any) {
      const errorMessage = err?.message ?? 'Failed to load FFmpeg';
      setError(errorMessage);
      console.error('[useFfmpeg] Load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, isLoading]);

  /**
   * Probe video dimensions using HTMLVideoElement
   */
  const probeVideoDimensions = useCallback((url: string): Promise<VideoDimensions> => {
    return new Promise((resolve, reject) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          const width = video.videoWidth || 1280;
          const height = video.videoHeight || 720;
          URL.revokeObjectURL(video.src);
          resolve({ width, height });
        };

        video.onerror = () => {
          reject(new Error('Failed to load video metadata'));
        };

        video.src = url;
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  /**
   * Fetch binary data from URL
   */
  const fetchBinary = useCallback(async (url: string): Promise<Uint8Array> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (err) {
      console.error('[useFfmpeg] Fetch binary failed:', err);
      throw err;
    }
  }, []);

  /**
   * Build video filter string from clip properties
   */
  const buildVideoFilterFromClip = useCallback((clip: TimelineClip): string => {
    const filterParts: string[] = [];

    const brightness = clip.brightness ?? 1;
    const contrast = clip.contrast ?? 1;
    const saturation = clip.saturate ?? 1;

    if (brightness !== 1 || contrast !== 1 || saturation !== 1) {
      const brightnessOffset = (brightness - 1).toFixed(2);
      const contrastValue = contrast.toFixed(2);
      const saturationValue = saturation.toFixed(2);
      filterParts.push(`eq=brightness=${brightnessOffset}:contrast=${contrastValue}:saturation=${saturationValue}`);
    }

    const blur = clip.blur ?? 0;
    if (blur > 0) {
      const blurValue = Math.min(50, blur).toFixed(2);
      filterParts.push(`gblur=sigma=${blurValue}`);
    }

    return filterParts.join(',');
  }, []);

  /**
   * Export timeline as composite video
   */
  const exportTimelineVideoComposite = useCallback(async (
    clips: TimelineClip[],
    options: VideoExportOptions = {}
  ): Promise<Uint8Array> => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded. Call load() first.');
    }

    const ffmpeg = ffmpegRef.current;
    const validClips = clips.filter(Boolean);

    if (!validClips.length) {
      throw new Error('No valid video clips provided');
    }

    // Determine video dimensions
    let baseWidth = options.width;
    let baseHeight = options.height;

    if (!baseWidth || !baseHeight) {
      try {
        const dimensions = await probeVideoDimensions(validClips[0].src);
        baseWidth = baseWidth || dimensions.width;
        baseHeight = baseHeight || dimensions.height;
      } catch {
        baseWidth = baseWidth || 1280;
        baseHeight = baseHeight || 720;
      }
    }

    const width = baseWidth;
    const height = baseHeight;
    const fps = options.fps ?? 30;
    const rangeStart = options.start ?? 0;
    const rangeEnd = options.end ?? Math.max(...validClips.map(c => c.end));
    const duration = Math.max(0.001, rangeEnd - rangeStart);
    const outputName = options.outName ?? 'timeline_video.mp4';

    // Prepare inputs - first input is black background
    const inputs: string[] = [
      '-f', 'lavfi',
      '-t', duration.toFixed(3),
      '-i', `color=size=${width}x${height}:rate=${fps}:color=black`,
    ];

    // Write clip files to FFmpeg filesystem
    for (let i = 0; i < validClips.length; i++) {
      const clip = validClips[i];
      const extension = clip.src.split('?')[0].split('#')[0].split('.').pop() || 'mp4';
      const inputFileName = `video_${i}.${extension}`;

      const binaryData = await fetchBinary(clip.src);
      ffmpeg.FS('writeFile', inputFileName, binaryData);
      inputs.push('-i', inputFileName);
    }

    // Build filter graph
    const filterChains: string[] = [];
    let baseLabel = 'background';
    filterChains.push(`[0:v]setpts=PTS-STARTPTS[${baseLabel}]`);

    const scaleFitFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;

    if ((options.mode ?? 'overlay') === 'overlay') {
      // Overlay mode: each clip overlays on the base
      for (let i = 0; i < validClips.length; i++) {
        const clip = validClips[i];
        const videoFilter = buildVideoFilterFromClip(clip);

        const adjustedStart = Math.max(rangeStart, clip.start);
        const adjustedEnd = Math.min(rangeEnd, clip.end);

        if (adjustedEnd <= adjustedStart) continue;

        const clipDuration = (adjustedEnd - adjustedStart).toFixed(3);
        const padDuration = Math.max(0, adjustedStart - rangeStart).toFixed(3);
        const inputIndex = i + 1; // Account for background at index 0

        const clipLabel = `clip_${i}`;
        const paddedLabel = `padded_${i}`;
        const outputLabel = `overlay_${i}`;

        const effectsFilter = videoFilter ? `,${videoFilter}` : '';

        filterChains.push(
          `[${inputIndex}:v]trim=0:${clipDuration},setpts=PTS-STARTPTS,${scaleFitFilter}${effectsFilter}[${clipLabel}]`
        );
        filterChains.push(`[${clipLabel}]tpad=start_duration=${padDuration}[${paddedLabel}]`);
        filterChains.push(`[${baseLabel}][${paddedLabel}]overlay=shortest=1:format=auto[${outputLabel}]`);

        baseLabel = outputLabel;
      }

      const filterGraph = filterChains.join(';');

      await ffmpeg.run(
          ...inputs,
        '-filter_complex', filterGraph,
        '-map', `[${baseLabel}]`,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        outputName
      );

      return ffmpeg.FS('readFile', outputName);
    } else {
      // concat-per-track mode
      const trackMap = new Map<string, Array<{ index: number; clip: TimelineClip }>>();

      for (let i = 0; i < validClips.length; i++) {
        const clip = validClips[i];
        const trackId = (clip as any).trackId ?? 'default_track';

        if (!trackMap.has(trackId)) {
          trackMap.set(trackId, []);
        }
        trackMap.get(trackId)!.push({ index: i, clip });
      }

      // Process tracks in specified order
      const trackIds = options.tracksOrder ?? Array.from(trackMap.keys());
      const trackOutputLabels: string[] = [];
      let chainIndex = 0;

      for (const trackId of trackIds) {
        const trackItems = (trackMap.get(trackId) || []).sort((a, b) => a.clip.start - b.clip.start);
        const segmentLabels: string[] = [];
        let cursor = rangeStart;

        for (const { index, clip } of trackItems) {
          const adjustedStart = Math.max(rangeStart, clip.start);
          const adjustedEnd = Math.min(rangeEnd, clip.end);

          if (adjustedEnd <= adjustedStart) continue;

          const clipDuration = (adjustedEnd - adjustedStart).toFixed(3);
          const gapDuration = Math.max(0, adjustedStart - cursor).toFixed(3);
          const inputIndex = index + 1;

          const inputLabel = `track_${chainIndex}_input`;
          const paddedLabel = `track_${chainIndex}_padded`;

          const videoFilter = buildVideoFilterFromClip(clip);
          const effectsFilter = videoFilter ? `,${videoFilter}` : '';

          filterChains.push(
            `[${inputIndex}:v]trim=0:${clipDuration},setpts=PTS-STARTPTS,${scaleFitFilter}${effectsFilter}[${inputLabel}]`
          );
          filterChains.push(`[${inputLabel}]tpad=start_duration=${gapDuration}[${paddedLabel}]`);

          segmentLabels.push(`[${paddedLabel}]`);
          cursor = adjustedEnd;
          chainIndex++;
        }

        if (!segmentLabels.length) continue;

        const trackOutputLabel = `track_output_${trackId}`;

        if (segmentLabels.length === 1) {
          // Single segment, just rename
          filterChains.push(`${segmentLabels[0].slice(0, -1)}${trackOutputLabel}]`);
        } else {
          // Multiple segments, concatenate
          filterChains.push(`${segmentLabels.join('')}concat=n=${segmentLabels.length}:v=1:a=0[${trackOutputLabel}]`);
        }

        trackOutputLabels.push(`[${trackOutputLabel}]`);
      }

      // Overlay track outputs onto base
      for (let i = 0; i < trackOutputLabels.length; i++) {
        const overlayLabel = `track_overlay_${i}`;
        filterChains.push(`[${baseLabel}]${trackOutputLabels[i]}overlay=shortest=1:format=auto[${overlayLabel}]`);
        baseLabel = overlayLabel;
      }

      const filterGraph = filterChains.join(';');

      await ffmpeg.run(
          ...inputs,
        '-filter_complex', filterGraph,
        '-map', `[${baseLabel}]`,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        outputName
      );

      return ffmpeg.FS('readFile', outputName);
    }
  }, [fetchBinary, buildVideoFilterFromClip, probeVideoDimensions]);

  /**
   * Export timeline as mixed audio
   */
  const exportTimelineAudioMix = useCallback(async (
    clips: TimelineClip[],
    options: AudioExportOptions = {}
  ): Promise<Uint8Array> => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded. Call load() first.');
    }

    const ffmpeg = ffmpegRef.current;
    const outputName = options.outName ?? 'timeline_audio.mp3';
    const sampleRate = options.sampleRate ?? 44100;

    const audioClips = clips.filter(Boolean);
    if (!audioClips.length) {
      throw new Error('No audio clips provided');
    }

    // Load audio files
    const inputs: string[] = [];
    for (let i = 0; i < audioClips.length; i++) {
      const clip = audioClips[i];
      const extension = clip.src.split('?')[0].split('#')[0].split('.').pop() || 'mp3';
      const inputFileName = `audio_${i}.${extension}`;

      const binaryData = await fetchBinary(clip.src);
      ffmpeg.FS('writeFile', inputFileName, binaryData);
      inputs.push('-i', inputFileName);
    }

    // Build filter graph for audio mixing
    const filterParts: string[] = [];
    const outputLabels: string[] = [];

    for (let i = 0; i < audioClips.length; i++) {
      const clip = audioClips[i];
      const volume = clip.volume ?? 1;
      const delayStart = Math.max(0, clip.start || 0);
      const clipEnd = Math.max(clip.end, delayStart);

      // Apply global range if specified
      const rangeStart = options.start ?? 0;
      const rangeEnd = options.end ?? Number.POSITIVE_INFINITY;
      const adjustedStart = Math.max(delayStart, rangeStart);
      const adjustedEnd = Math.min(clipEnd, rangeEnd);
      const duration = Math.max(0.001, adjustedEnd - adjustedStart);
      const delayMs = Math.max(0, Math.round(adjustedStart * 1000));

      // Apply volume, delay, trim, and set presentation timestamps
      filterParts.push(
        `[${i}:a]volume=${volume},adelay=${delayMs}|${delayMs},atrim=0:${duration.toFixed(3)},asetpts=N/(${sampleRate})/TB[audio_${i}]`
      );
      outputLabels.push(`[audio_${i}]`);
    }

    const loudnessFilter = options.loudness ? ',loudnorm=I=-16:TP=-1.5:LRA=11,acompressor' : '';
    const mixFilter = `${outputLabels.join('')}amix=inputs=${outputLabels.length}:normalize=0,volume=1${loudnessFilter}[output_audio]`;

    const filterGraph = [...filterParts, mixFilter].join(';');

    await ffmpeg.run(
          ...inputs,
      '-filter_complex', filterGraph,
      '-map', '[output_audio]',
      '-ar', String(sampleRate) as string,
      outputName
    );

    return ffmpeg.FS('readFile', outputName);
  }, [fetchBinary]);

  /**
   * Mux video and audio streams
   */
  const muxVideoAudio = useCallback(async (
    videoData: Uint8Array,
    audioData: Uint8Array,
    outputName = 'final_output.mp4'
  ): Promise<Uint8Array> => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded. Call load() first.');
    }

    const ffmpeg = ffmpegRef.current;

    const videoFileName = 'temp_video.mp4';
    const audioFileName = 'temp_audio.mp3';

    ffmpeg.FS('writeFile', videoFileName, videoData);
    ffmpeg.FS('writeFile', audioFileName, audioData);

    await ffmpeg.run(
      '-i', videoFileName,
      '-i', audioFileName,
      '-c:v', 'copy',
      '-c:a', 'aac',
      outputName
    );

    return ffmpeg.FS('readFile', outputName);
  }, []);

  /**
   * Transcode audio from binary data
   */
  const transcodeAudio = useCallback(async (
    inputData: Uint8Array,
    outputName = 'transcoded_audio.mp3'
  ): Promise<Uint8Array> => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded. Call load() first.');
    }

    const ffmpeg = ffmpegRef.current;
    const inputFileName = 'input_audio.wav';

    ffmpeg.FS('writeFile', inputFileName, inputData);

    await ffmpeg.run(
      '-i', inputFileName,
      '-b:a', '192k',
      outputName
    );

    return ffmpeg.FS('readFile', outputName);
  }, []);

  /**
   * Transcode audio from URL
   */
  const transcodeAudioFromUrl = useCallback(async (
    url: string,
    outputName = 'transcoded_audio.mp3'
  ): Promise<Uint8Array> => {
    const binaryData = await fetchBinary(url);
    return transcodeAudio(binaryData, outputName);
  }, [fetchBinary, transcodeAudio]);

  /**
   * Remux video from URL
   */
  const remuxVideoFromUrl = useCallback(async (
    url: string,
    outputName = 'remuxed_video.mp4'
  ): Promise<Uint8Array> => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded. Call load() first.');
    }

    const ffmpeg = ffmpegRef.current;
    const extension = url.split('?')[0].split('#')[0].split('.').pop() || 'mp4';
    const inputFileName = `input_video.${extension}`;

    const binaryData = await fetchBinary(url);
    ffmpeg.FS('writeFile', inputFileName, binaryData);

    // Try stream copy first for speed, fallback to re-encoding audio only
    try {
      await ffmpeg.run('-i', inputFileName, '-c', 'copy', outputName);
    } catch {
      await ffmpeg.run('-i', inputFileName, '-c:v', 'copy', '-c:a', 'aac', outputName);
    }

    return ffmpeg.FS('readFile', outputName);
  }, [fetchBinary]);

  /**
   * Transcode video with filters from URL
   */
  const transcodeVideoFromUrlWithFilters = useCallback(async (
    url: string,
    clip: TimelineClip,
    outputName = 'filtered_video.mp4'
  ): Promise<Uint8Array> => {
    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded. Call load() first.');
    }

    const ffmpeg = ffmpegRef.current;
    const extension = url.split('?')[0].split('#')[0].split('.').pop() || 'mp4';
    const inputFileName = `input_video.${extension}`;

    const binaryData = await fetchBinary(url);
    ffmpeg.FS('writeFile', inputFileName, binaryData);

    const videoFilter = buildVideoFilterFromClip(clip);

    if (videoFilter) {
      await ffmpeg.run(
        '-i', inputFileName,
        '-vf', videoFilter,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '192k',
        outputName
      );
    } else {
      await ffmpeg.run('-i', inputFileName, '-c', 'copy', outputName);
    }

    return ffmpeg.FS('readFile', outputName);
  }, [fetchBinary, buildVideoFilterFromClip]);

  return {
    // State
    ffmpeg: ffmpegRef.current,
    isReady,
    isLoading,
    error,

    // Core methods
    load,
    fetchBinary,

    // Audio processing
    transcodeAudio,
    transcodeAudioFromUrl,
    exportTimelineAudioMix,

    // Video processing
    remuxVideoFromUrl,
    transcodeVideoFromUrlWithFilters,
    exportTimelineVideoComposite,
    probeVideoDimensions,

    // Utility
    muxVideoAudio,
    buildVideoFilterFromClip,
  };
}