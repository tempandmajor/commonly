import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioURL: string | null;
  isUploading: boolean;
}

export const useRecordingState = () => {
  const { user } = useAuth();
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioURL: null,
    isUploading: false,
  });

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      setMediaRecorder(recorder);

      const chunks: Blob[] = [];

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        const audioURL = URL.createObjectURL(blob);
        setState(prev => ({ ...prev, audioURL }));
      };

      recorder.start();
      setState(prev => ({ ...prev, isRecording: true, isPaused: false }));

      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder!.stop();
      mediaRecorder!.stream.getTracks().forEach(track => track.stop());
      setState(prev => ({ ...prev, isRecording: false, isPaused: false }));
      toast.success('Recording stopped');
    }
  }, [mediaRecorder]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      toast.info('Recording paused');
    }
  }, [mediaRecorder]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      toast.info('Recording resumed');
    }
  }, [mediaRecorder]);

  const uploadRecording = useCallback(
    async (fileName: string): Promise<string> => {
      if (!user || !audioBlob) {
        throw new Error('No audio data to upload');
      }

      try {
        setState(prev => ({ ...prev, isUploading: true }));

        // Create a unique filename with timestamp
        const timestamp = Date.now();
        const fileExt = fileName.split('.').pop() || 'webm';
        const uniqueFileName = `${user.id}/recordings/${timestamp}_${fileName}`;

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('podcasts')
          .upload(uniqueFileName, audioBlob, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('podcasts').getPublicUrl(uniqueFileName);

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get public URL for uploaded audio');
        }

        setState(prev => ({
          ...prev,
          isUploading: false,
        }));

        toast.success('Recording uploaded successfully');
        return urlData.publicUrl;
      } catch (error) {
        setState(prev => ({ ...prev, isUploading: false }));
        console.error('Upload error:', error);
        toast.error('Failed to upload recording');
        throw error;
      }
    },
    [user, audioBlob]
  );

  const deleteRecording = useCallback(() => {
    if (state.audioURL) {
      URL.revokeObjectURL(state.audioURL);
      setState(prev => ({ ...prev, audioURL: null, duration: 0 }));
      setAudioBlob(null);
      toast.success('Recording deleted');
    }
  }, [state.audioURL]);

  const getRecordingDuration = useCallback(() => {
    if (!audioBlob) return 0;

    // Create a temporary audio element to get duration
    const audio = new Audio(URL.createObjectURL(audioBlob));
    return new Promise<number>(resolve => {
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      audio.addEventListener('error', () => {
        resolve(0);
      });
    });
  }, [audioBlob]);

  const getRecordingSize = useCallback(() => {
    if (!audioBlob) return 0;
    return audioBlob.size;
  }, [audioBlob]);

  return {
          ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    uploadRecording,
    deleteRecording,
    getRecordingDuration,
    getRecordingSize,
    audioBlob,
  };
};
