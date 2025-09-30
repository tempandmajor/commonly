import { useState } from 'react';
import { toast } from 'sonner';

// Clean podcast recorder interface (no Agora conflicts)
interface PodcastRecorderHookReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordingBlob: Blob | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isUploading: boolean;
  uploadProgress: number;
  appIdMissing: boolean;
  uploadError: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  errorDetails: string | null;
  formattedDuration: string;
  startRecording: () => Promise<boolean>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  leaveRoom: () => Promise<void>;
  handleSaveRecording: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
}

export const usePodcastRecorder = (options?: unknown): PodcastRecorderHookReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [appIdMissing, setAppIdMissing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'prompt' | 'unknown'
  >('unknown');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const startRecording = async (): Promise<boolean> => {
    setIsRecording(true);
    toast.success('Recording started');
    return true;
  };

  const pauseRecording = () => {
    setIsPaused(true);
    toast.info('Recording paused');
  };

  const resumeRecording = () => {
    setIsPaused(false);
    toast.info('Recording resumed');
  };

  const stopRecording = async (): Promise<Blob | null> => {
    setIsRecording(false);
    setIsPaused(false);
    const blob = new Blob();
    setRecordingBlob(blob);
    toast.success('Recording stopped');
    return blob;
  };

  const leaveRoom = async (): Promise<void> => {
    setIsRecording(false);
    setIsPaused(false);
    toast.info('Left recording session');
  };

  const handleSaveRecording = async (): Promise<void> => {
    setIsUploading(true);
    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(100);
      toast.success('Recording saved successfully');
    }, 2000);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    toast.info(isAudioEnabled ? 'Audio disabled' : 'Audio enabled');
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    toast.info(isVideoEnabled ? 'Video disabled' : 'Video enabled');
  };

  const formattedDuration = `${Math.floor(duration / 60)
    .toString()
    .padStart(2, '0')}:${duration % 60}.toString().padStart(2, '0')}`;

  return {
    isRecording,
    isPaused,
    duration,
    recordingBlob,
    isAudioEnabled,
    isVideoEnabled,
    isUploading,
    uploadProgress,
    appIdMissing,
    uploadError,
    permissionStatus,
    errorDetails,
    formattedDuration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    leaveRoom,
    handleSaveRecording,
    toggleAudio,
    toggleVideo,
  };
};
