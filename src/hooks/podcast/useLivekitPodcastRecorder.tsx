import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  ConnectionState,
  LocalParticipant,
  RemoteParticipant,
  DisconnectReason,
} from 'livekit-client';
import { toast } from 'sonner';
import { getLiveEventToken, joinLiveEvent } from '../../services/livekit';

interface PodcastRecorderOptions {
  podcastId: string;
  userId: string;
  userName: string;
  role?: 'host' | undefined| 'speaker';
  onParticipantJoined?: (participant: RemoteParticipant) => void | undefined;
  onParticipantLeft?: (participant: RemoteParticipant) => void | undefined;
  onError?: (error: Error) => void | undefined;
  onConnectionStateChanged?: (state: ConnectionState) => void | undefined;
}

export function useLivekitPodcastRecorder(options: PodcastRecorderOptions) {
  const {
    podcastId,
    userId,
    userName,
    role = 'host',
    onParticipantJoined,
    onParticipantLeft,
    onError,
    onConnectionStateChanged,
  } = options;

  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const roomRef = useRef<Room | null>(null);
  const timerRef = useRef<number | null>(null);

  // Clean up function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    setIsRecording(false);
    setIsConnecting(false);
    setParticipants([]);
    setLocalParticipant(null);
  }, []);

  // Set up event listeners for the room
  const setupRoomListeners = useCallback(
    (room: Room) => {
      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        setParticipants(prev => [...prev, participant]);
        if (onParticipantJoined) onParticipantJoined(participant);
        toast.success(`${participant.name} joined the podcast`);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
        if (onParticipantLeft) onParticipantLeft(participant);
        toast.info(`${participant.name} left the podcast`);
      });

      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (onConnectionStateChanged) onConnectionStateChanged(state);

        if (state === ConnectionState.Disconnected) {
          cleanup();
        }
      });

      room.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
        const errorMessage = reason ? `Disconnected: ${reason}` : 'Disconnected from podcast';
        setErrorDetails(errorMessage);
        if (onError) onError(new Error(errorMessage));
        toast.error(errorMessage);
        cleanup();
      });

      room.on(RoomEvent.MediaDevicesError, (error: Error) => {
        setErrorDetails(error.message);
        if (onError) onError(error);
        toast.error(`Media device error: ${error.message}`);
      });
    },
    [cleanup, onConnectionStateChanged, onError, onParticipantJoined, onParticipantLeft]
  );

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setIsConnecting(true);
      setErrorDetails(null);

      const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL as string;
      if (!livekitUrl) {
        const error = 'LiveKit URL is not configured';
        setErrorDetails(error);
        toast.error(error);
        setIsConnecting(false);
        return false;
      }

      // Get token from backend
      const tokenResponse = await getLiveEventToken({
        eventId: podcastId,
        userId,
        userName,
        role: role === 'host' ? 'host' : 'speaker',
      });

      if (!tokenResponse || !tokenResponse.token) {
        const error = 'Failed to get LiveKit token';
        setErrorDetails(error);
        toast.error(error);
        setIsConnecting(false);
        return false;
      }

      // Create and connect to room
      const room = await joinLiveEvent(tokenResponse.token, tokenResponse.room, {
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up event listeners
      setupRoomListeners(room);

      // Enable audio
      await room.localParticipant.setMicrophoneEnabled(true);

      // Store references
      roomRef.current = room;
      setLocalParticipant(room.localParticipant);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      setIsRecording(true);
      setIsConnecting(false);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error) as string;
      setErrorDetails(errorMessage);
      if (onError && error instanceof Error) onError(error);
      toast.error(`Failed to start recording: ${errorMessage}`);
      cleanup();
      return false;
    }
  }, [podcastId, userId, userName, role, setupRoomListeners, cleanup, onError]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      cleanup();
      toast.success('Recording stopped');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error) as string;
      setErrorDetails(errorMessage);
      if (onError && error instanceof Error) onError(error);
      toast.error(`Failed to stop recording: ${errorMessage}`);
      return false;
    }
  }, [cleanup, onError]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    if (!roomRef.current || !roomRef.current.localParticipant) return;

    try {
      const enabled = !audioEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
      setAudioEnabled(enabled);
      toast.info(enabled ? 'Microphone enabled' : 'Microphone disabled');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error) as string;
      toast.error(`Failed to toggle audio: ${errorMessage}`);
    }
  }, [audioEnabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnecting,
    isRecording,
    startRecording,
    stopRecording,
    toggleAudio,
    audioEnabled,
    participants,
    localParticipant,
    duration,
    error: errorDetails,
  };
}

export default useLivekitPodcastRecorder;
