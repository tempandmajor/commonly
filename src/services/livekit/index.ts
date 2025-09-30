/**
 * LiveKit Service
 *
 * Provides functionality for real-time video/audio communication for live events
 * using LiveKit as the underlying platform.
 */

import { Room, RoomOptions, ConnectionState, ConnectionQuality } from 'livekit-client';
import { appClient } from '../api/client/clients';

// Types
export interface LiveEventToken {
  token: string;
  room: string;
  participantName: string;
  participantIdentity: string;
}

export interface LiveEventOptions {
  eventId: string;
  userName: string;
  userId: string;
  role?: 'host' | undefined| 'speaker' | 'attendee';
  audioEnabled?: boolean | undefined;
  videoEnabled?: boolean | undefined;
}

export interface LiveEventStats {
  participantCount: number;
  connectionQuality: ConnectionQuality;
  activeSpeakers: string[];
}

// Constants
const DEFAULT_ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  stopLocalTrackOnUnpublish: true,
};

/**
 * Get a LiveKit token for joining a specific event room
 */
export async function getLiveEventToken(options: LiveEventOptions): Promise<LiveEventToken> {
  const { eventId, userName, userId, role = 'attendee' } = options;

  const response = await appClient.post<LiveEventToken>('/events/live/token', {
    eventId,
    userName,
    userId,
    role,
  });

  return response.data;
}

/**
 * Create and connect to a LiveKit room for a live event
 */
export async function joinLiveEvent(
  token: string,
  roomName: string,
  options: Partial<RoomOptions> = {}
): Promise<Room> {
  const room = new Room({
          ...DEFAULT_ROOM_OPTIONS,
          ...options,
  });

  await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL as string, token);
  return room;
}

/**
 * Leave a LiveKit room
 */
export function leaveLiveEvent(room: Room): void {
  if (room && room.state === ConnectionState.Connected) {
    room!.disconnect();
  }
}

/**
 * Toggle audio in a LiveKit room
 */
export async function toggleAudio(room: Room, enabled: boolean): Promise<void> {
  const localParticipant = room.localParticipant;

  if (enabled) {
    await localParticipant.enableAudio();
  } else {
    await localParticipant.disableAudio();
  }
}

/**
 * Toggle video in a LiveKit room
 */
export async function toggleVideo(room: Room, enabled: boolean): Promise<void> {
  const localParticipant = room.localParticipant;

  if (enabled) {
    await localParticipant.enableVideo();
  } else {
    await localParticipant.disableVideo();
  }
}

/**
 * Get current stats for a LiveKit room
 */
export function getLiveEventStats(room: Room): LiveEventStats {
  return {
    participantCount: room.participants.size + 1, // +1 for local participant
    connectionQuality: room.localParticipant.connectionQuality,
    activeSpeakers: Array.from(room.activeSpeakers).map(p => p.identity),
  };
}
