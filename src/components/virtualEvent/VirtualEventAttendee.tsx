import React, { useState, useEffect } from 'react';
import { useLiveEvent } from '@/services/livekit/hooks/useLiveEvent';
import { Event } from '@/lib/types/event';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Users, UserCheck, VolumeX, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';

interface VirtualEventAttendeeProps {
  event: Event;
  onLeave?: () => void | undefined;
}

const VirtualEventAttendee: React.FC<VirtualEventAttendeeProps> = ({ event, onLeave }) => {
  const { user } = useAuth();
  const [isJoined, setIsJoined] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const userName = user?.name || user?.display_name || 'Attendee';
  const userId = user?.id || 'guest';

  const {
    room,
    isConnecting,
    isConnected,
    error,
    participants,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
  } = useLiveEvent({
    eventId: event.id,
    userName,
    userId,
    role: 'attendee',
    autoConnect: false,
    onConnected: () => {
      setIsJoined(true);
      toast.success('Joined the event successfully!');
    },
    onDisconnected: () => {
      setIsJoined(false);
      toast.info('Left the event');
    },
    onError: error => {
      toast.error(`Connection error: ${error.message}`);
    },
  });

  const handleJoinEvent = async () => {
    try {
      await connect();
    } catch (error) {
      toast.error('Failed to join event');
    }
  };

  const handleLeaveEvent = async () => {
    try {
      await disconnect();
      onLeave?.();
    } catch (error) {
      toast.error('Failed to leave event');
    }
  };

  const handleToggleAudio = async () => {
    try {
      await toggleAudio(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {
      toast.error('Failed to toggle microphone');
    }
  };

  const handleToggleVideo = async () => {
    try {
      await toggleVideo(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      toast.error('Failed to toggle camera');
    }
  };

  return (
    <div className='space-y-6'>
      {/* Event Info Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-xl'>{event.title}</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Hosted by {event.organizer?.name} • {format(new Date(event.startDate), 'PPp')}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {isConnected && (
                <Badge className='bg-green-500'>
                  <div className='w-2 h-2 bg-white rounded-full animate-pulse mr-1' />
                  Live
                </Badge>
              )}
              <Badge variant='outline'>
                <Users className='w-3 h-3 mr-1' />
                {participants.length} viewing
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Video Stream */}
      <Card>
        <CardContent className='p-0'>
          <div className='aspect-video bg-black rounded-lg overflow-hidden relative'>
            {isConnected ? (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='text-white text-center'>
                  <Video className='w-12 h-12 mx-auto mb-2' />
                  <p>Live Stream</p>
                  <p className='text-sm opacity-75'>You're watching the event</p>
                </div>
              </div>
            ) : (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='text-gray-400 text-center'>
                  <VideoOff className='w-12 h-12 mx-auto mb-2' />
                  <p>Event Stream</p>
                  <p className='text-sm'>Join to watch the live event</p>
                </div>
              </div>
            )}

            {/* Attendee Controls Overlay */}
            {isConnected && (
              <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2'>
                <div className='flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2'>
                  <Button
                    size='sm'
                    variant={isAudioEnabled ? 'default' : 'secondary'}
                    onClick={handleToggleAudio}
                    title='Toggle Microphone'
                  >
                    {isAudioEnabled ? <Mic className='w-4 h-4' /> : <MicOff className='w-4 h-4' />}
                  </Button>

                  <Button
                    size='sm'
                    variant={isVideoEnabled ? 'default' : 'secondary'}
                    onClick={handleToggleVideo}
                    title='Toggle Camera'
                  >
                    {isVideoEnabled ? (
                      <Video className='w-4 h-4' />
                    ) : (
                      <VideoOff className='w-4 h-4' />
                    )}
                  </Button>

                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setIsMuted(!isMuted)}
                    title='Toggle Audio Output'
                  >
                    {isMuted ? <VolumeX className='w-4 h-4' /> : <Volume2 className='w-4 h-4' />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Controls */}
      <div className='grid md:grid-cols-2 gap-4'>
        {/* Join/Leave Controls */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Event Access</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {!isConnected ? (
              <Button onClick={handleJoinEvent} disabled={isConnecting} className='w-full'>
                <UserCheck className='w-4 h-4 mr-2' />
                {isConnecting ? 'Joining...' : 'Join Event'}
              </Button>
            ) : (
              <Button onClick={handleLeaveEvent} variant='outline' className='w-full'>
                Leave Event
              </Button>
            )}

            {isConnected && (
              <div className='grid grid-cols-2 gap-2'>
                <Button
                  variant='outline'
                  onClick={handleToggleAudio}
                  className={!isAudioEnabled ? 'bg-red-50 border-red-200' : ''}
                  title='Toggle your microphone'
                >
                  {isAudioEnabled ? <Mic className='w-4 h-4' /> : <MicOff className='w-4 h-4' />}
                </Button>

                <Button
                  variant='outline'
                  onClick={handleToggleVideo}
                  className={!isVideoEnabled ? 'bg-red-50 border-red-200' : ''}
                  title='Toggle your camera'
                >
                  {isVideoEnabled ? (
                    <Video className='w-4 h-4' />
                  ) : (
                    <VideoOff className='w-4 h-4' />
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Information */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Event Details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <p className='text-sm font-medium'>Description</p>
              <p className='text-sm text-muted-foreground'>
                {event.description || 'No description available'}
              </p>
            </div>

            <div>
              <p className='text-sm font-medium'>Duration</p>
              <p className='text-sm text-muted-foreground'>Duration not specified</p>
            </div>

            <div>
              <p className='text-sm font-medium'>
                {participants.length === 0
                  ? 'No participants yet'
                  : `${participants.length} participant${participants.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='pt-6'>
            <p className='text-red-600 text-sm'>Connection Error: {error.message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VirtualEventAttendee;
