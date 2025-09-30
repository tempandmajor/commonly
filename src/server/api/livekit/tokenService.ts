/**
 * LiveKit Token Service
 *
 * Server-side service for generating LiveKit tokens with appropriate permissions.
 */

import { AccessToken } from 'livekit-server-sdk';

// Types
export interface TokenRequest {
  eventId: string;
  userId: string;
  userName: string;
  role?: 'host' | undefined| 'speaker' | 'attendee';
}

export interface TokenResponse {
  token: string;
  room: string;
  participantName: string;
  participantIdentity: string;
}

/**
 * Generate a LiveKit token for a specific room and user
 */
export function generateLiveKitToken(request: TokenRequest): TokenResponse {
  const { eventId, userId, userName, role = 'attendee' } = request;

  // Validate environment variables
  const apiKey = process.env.NEXT_PUBLIC_LIVEKIT_API_KEY as string;
  const apiSecret = process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET as string;

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit API key and secret must be configured in environment variables');
  }

  // Create room name from event ID
  const roomName = `event-${eventId}`;

  // Create token with appropriate permissions
  const token = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
  });

  // Add permissions based on role
  if (role === 'host') {
    token.addGrant({
      roomJoin: true,
      roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: true,
    });
  } else if (role === 'speaker') {
    token.addGrant({
      roomJoin: true,
      roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
  } else {
    token.addGrant({
      roomJoin: true,
      roomName,
      canPublish: false,
      canSubscribe: true,
    });
  }

  return {
    token: token.toJwt(),
    room: roomName,
    participantName: userName,
    participantIdentity: userId,
  };
}
