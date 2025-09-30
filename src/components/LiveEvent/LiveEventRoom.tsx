/**
 * LiveEventRoom Component
 *
 * A component for displaying and participating in live events using LiveKit.
 */

import { useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  ControlBar,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';

interface LiveEventRoomProps {
  eventId: string;
  userId: string;
  userName: string;
  role?: 'host' | undefined| 'speaker' | 'attendee';
  onLeave?: () => void | undefined;
}

export function LiveEventRoom({
  eventId,
  userId,
  userName,
  role = 'attendee',
  onLeave,
}: LiveEventRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use our custom hook to get a token
  const handleJoinRoom = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Import dynamically to avoid loading the entire service if not needed
      const { getLiveEventToken } = await import('@/services/livekit');

      const tokenData = await getLiveEventToken({
        eventId,
        userId,
        userName,
        role,
        audioEnabled: role !== 'attendee', // Only enable audio for hosts and speakers by default
        videoEnabled: role === 'host', // Only enable video for hosts by default
      });

      setToken(tokenData.token);
      setRoomName(tokenData.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
      console.error('Error joining live event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle leaving the room
  const handleLeaveRoom = () => {
    setToken(null);
    setRoomName(null);
    onLeave?.();
  };

  // If we don't have a token yet, show the join button
  if (!token || !roomName) {
    return (
      <div className='flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md'>
        <h2 className='text-2xl font-bold mb-4'>Join Live Event</h2>
        {error && <div className='mb-4 p-3 bg-red-100 text-red-700 rounded-md'>{error}</div>}
        <button
          onClick={handleJoinRoom}
          disabled={isLoading}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
        >
          {isLoading ? 'Joining...' : 'Join Event'}
        </button>
      </div>
    );
  }

  // Once we have a token, render the LiveKit room
  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL as string}
      onDisconnected={handleLeaveRoom}
      className='h-full w-full'
    >
      {/* Audio renderer for room sounds */}
      <RoomAudioRenderer />

      {/* Main video conference UI with all participants */}
      <VideoConference />

      {/* Control bar with buttons for mic, camera, screen share, etc. */}
      <ControlBar />
    </LiveKitRoom>
  );
}
