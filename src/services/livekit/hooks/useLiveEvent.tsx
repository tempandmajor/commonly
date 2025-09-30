/**
 * LiveKit React Hooks
 *
 * Custom React hooks for using LiveKit in components.
 */

import { useState, useEffect, useCallback } from 'react';
import { Room, RoomEvent, ConnectionState, Participant } from 'livekit-client';
import { getLiveEventToken, joinLiveEvent, leaveLiveEvent, LiveEventOptions } from '..';

export interface UseLiveEventOptions extends LiveEventOptions {
  onConnected?: (room: Room) => void;
  onDisconnected?: () => void;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (participant: Participant) => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

export interface UseLiveEventResult {
  room: Room | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: Error | null;
  participants: Participant[];
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleAudio: (enabled: boolean) => Promise<void>;
  toggleVideo: (enabled: boolean) => Promise<void>;
}

/**
 * React hook for joining and managing a LiveKit room for live events
 */
export function useLiveEvent(options: UseLiveEventOptions): UseLiveEventResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Connect to the room
  const connect = useCallback(async () => {
    if (room && room.state === ConnectionState.Connected) {
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Get token from server
      const tokenData = await getLiveEventToken(options);

      // Connect to room
      const newRoom = await joinLiveEvent(tokenData.token, tokenData.room, {
        audioCaptureDefaults: {
          enabled: options.audioEnabled ?? false,
        },
        videoCaptureDefaults: {
          enabled: options.videoEnabled ?? false,
        },
      });

      setRoom(newRoom);
      setIsConnected(true);
      options.onConnected?.(newRoom);

      // Initialize participants
      const initialParticipants = Array.from(newRoom.participants.values());
      setParticipants(initialParticipants);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      options.onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsConnecting(false);
    }
  }, [options, room]);

  // Disconnect from the room
  const disconnect = useCallback(() => {
    if (room) {
      leaveLiveEvent(room);
      setIsConnected(false);
      options.onDisconnected?.();
    }
  }, [room, options]);

  // Toggle audio
  const toggleAudio = useCallback(
    async (enabled: boolean) => {
      if (!room) return;

      try {
        const localParticipant = room.localParticipant;
        if (enabled) {
          await localParticipant.enableAudio();
        } else {
          await localParticipant.disableAudio();
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        options.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [room, options]
  );

  // Toggle video
  const toggleVideo = useCallback(
    async (enabled: boolean) => {
      if (!room) return;

      try {
        const localParticipant = room.localParticipant;
        if (enabled) {
          await localParticipant.enableVideo();
        } else {
          await localParticipant.disableVideo();
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        options.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [room, options]
  );

  // Set up event listeners when room changes
  useEffect(() => {
    if (!room) return;

    const handleParticipantConnected = (participant: Participant) => {
      setParticipants(prev => [...prev, participant]);
      options.onParticipantJoined?.(participant);
    };

    const handleParticipantDisconnected = (participant: Participant) => {
      setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
      options.onParticipantLeft?.(participant);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setParticipants([]);
      options.onDisconnected?.();
    };

    const handleError = (err: Error) => {
      setError(err);
      options.onError?.(err);
    };

    // Add event listeners
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.ConnectionStateChanged, state => {
      setIsConnected(state === ConnectionState.Connected);
    });
    room.on(RoomEvent.MediaDevicesError, handleError);
    room.on(RoomEvent.SignalConnected, () => {
      // Room is connected to signaling server but not fully connected yet
    });

    // Clean up event listeners
    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.ConnectionStateChanged);
      room.off(RoomEvent.MediaDevicesError, handleError);
      room.off(RoomEvent.SignalConnected);
    };
  }, [room, options]);

  // Auto-connect if specified
  useEffect(() => {
    if (options.autoConnect && !room && !isConnecting && !isConnected) {
      connect();
    }

    // Clean up on unmount
    return () => {
      if (room && room.state === ConnectionState.Connected) {
        leaveLiveEvent(room);
      }
    };
  }, [connect, isConnected, isConnecting, options.autoConnect, room]);

  return {
    room,
    isConnecting,
    isConnected,
    error,
    participants,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
  };
}
