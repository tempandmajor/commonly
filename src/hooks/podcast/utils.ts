export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const createMediaRecorderOptions = (): MediaRecorderOptions => {
  try {
    // Try high quality codec first
    return { mimeType: 'video/webm; codecs=vp9' };
  } catch (e) {
    try {
      // Fall back to more compatible codec
      return { mimeType: 'video/webm; codecs=vp8' };
    } catch (e) {
      // Last resort - use default
      return {};
    }
  }
};
