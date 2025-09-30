import React, { useState, useEffect, useCallback } from 'react';
import { useLiveEvent } from '@/services/livekit/hooks/useLiveEvent';
import { Event, StreamStatus } from '@/lib/types/event';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Play,
  Square,
  Settings,
  Clock,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface VirtualEventHostProps {
  event: Event;
  onStreamStatusChange?: (status: StreamStatus) => void | undefined;
  onEnd?: () => void | undefined;
}

const VirtualEventHost: React.FC<VirtualEventHostProps> = ({
  event,
  onStreamStatusChange,
  onEnd,
}) => {
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(StreamStatus.Scheduled);
  const [streamDuration, setStreamDuration] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Get room name from event ID
  const roomName = `event-${event.id}`;
  const hostName = event.organizer?.name || 'Event Host';

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
    userName: hostName,
    userId: event.organizer?.id || 'host',
    role: 'host',
    autoConnect: false,
    onConnected: () => {
      setStreamStatus(StreamStatus.Live);
      toast.success('Stream started successfully!');
    },
    onDisconnected: () => {
      setStreamStatus(StreamStatus.Ended);
      toast.info('Stream ended');
    },
    onError: error => {
      toast.error(`Stream error: ${error.message}`);
      setStreamStatus(StreamStatus.Cancelled);
    },
  });

  // Stream duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (streamStatus === StreamStatus.Live) {
      interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [streamStatus]);

  // Notify parent of status changes
  useEffect(() => {
    onStreamStatusChange?.(streamStatus);
  }, [streamStatus, onStreamStatusChange]);

  const handleStartStream = useCallback(async () => {
    setStreamStatus(StreamStatus.Live);
    try {
      await connect();
    } catch (error) {
      setStreamStatus(StreamStatus.Cancelled);
      toast.error('Failed to start stream');
    }
  }, [connect]);

  const handleEndStream = useCallback(async () => {
    try {
      await disconnect();
      setStreamDuration(0);
      onEnd?.();
    } catch (error) {
      toast.error('Failed to end stream');
    }
  }, [disconnect, onEnd]);

  const handleToggleAudio = useCallback(async () => {
    try {
      await toggleAudio(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {
      toast.error('Failed to toggle audio');
    }
  }, [isAudioEnabled, toggleAudio]);

  const handleToggleVideo = useCallback(async () => {
    try {
      await toggleVideo(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      toast.error('Failed to toggle video');
    }
  }, [isVideoEnabled, toggleVideo]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: StreamStatus) => {
    switch (status) {
      case StreamStatus.Live:
        return 'bg-red-500';
      case StreamStatus.Scheduled:
        return 'bg-yellow-500';
      case StreamStatus.Ended:
        return 'bg-gray-500';
      case StreamStatus.Cancelled:
        return 'bg-red-600';
      default:
        return 'bg-gray-400';
    }
  };

  const shareStreamLink = () => {
    const streamUrl = `${window.location.origin}/events/${event.id}`;
    navigator.clipboard.writeText(streamUrl);
    toast.success('Stream link copied to clipboard!');
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
                LiveKit • {format(new Date(event.startDate), 'PPp')}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Badge className={getStatusColor(streamStatus)}>
                {streamStatus === StreamStatus.Live && (
                  <div className='w-2 h-2 bg-white rounded-full animate-pulse mr-1' />
                )}
                {streamStatus}
              </Badge>
              {streamStatus === StreamStatus.Live && (
                <Badge variant='outline' className='font-mono'>
                  <Clock className='w-3 h-3 mr-1' />
                  {formatDuration(streamDuration)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Video Preview/Stream */}
      <Card>
        <CardContent className='p-0'>
          <div className='aspect-video bg-black rounded-lg overflow-hidden relative'>
            {/* Video stream would be rendered here */}
            <div className='absolute inset-0 flex items-center justify-center'>
              {isConnected ? (
                <div className='text-white text-center'>
                  <Video className='w-12 h-12 mx-auto mb-2' />
                  <p>Live Stream Active</p>
                  <p className='text-sm opacity-75'>{participants.length} participants</p>
                </div>
              ) : (
                <div className='text-gray-400 text-center'>
                  <VideoOff className='w-12 h-12 mx-auto mb-2' />
                  <p>Stream Preview</p>
                  <p className='text-sm'>Click "Start Stream" to go live</p>
                </div>
              )}
            </div>

            {/* Stream Controls Overlay */}
            <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2'>
              <div className='flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2'>
                <Button
                  size='sm'
                  variant={isAudioEnabled ? 'default' : 'destructive'}
                  onClick={handleToggleAudio}
                  disabled={!isConnected}
                >
                  {isAudioEnabled ? <Mic className='w-4 h-4' /> : <MicOff className='w-4 h-4' />}
                </Button>

                <Button
                  size='sm'
                  variant={isVideoEnabled ? 'default' : 'destructive'}
                  onClick={handleToggleVideo}
                  disabled={!isConnected}
                >
                  {isVideoEnabled ? (
                    <Video className='w-4 h-4' />
                  ) : (
                    <VideoOff className='w-4 h-4' />
                  )}
                </Button>

                <Button size='sm' variant='outline' onClick={shareStreamLink}>
                  <Share2 className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stream Management */}
      <div className='grid md:grid-cols-2 gap-4'>
        {/* Stream Controls */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Stream Controls</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {streamStatus === StreamStatus.Scheduled || streamStatus === StreamStatus.Cancelled ? (
              <Button onClick={handleStartStream} disabled={isConnecting} className='w-full'>
                <Play className='w-4 h-4 mr-2' />
                {isConnecting ? 'Starting...' : 'Start Stream'}
              </Button>
            ) : (
              <Button onClick={handleEndStream} variant='destructive' className='w-full'>
                <Square className='w-4 h-4 mr-2' />
                End Stream
              </Button>
            )}

            <div className='grid grid-cols-2 gap-2'>
              <Button
                variant='outline'
                onClick={handleToggleAudio}
                disabled={!isConnected}
                className={!isAudioEnabled ? 'bg-red-50 border-red-200' : ''}
              >
                {isAudioEnabled ? <Mic className='w-4 h-4' /> : <MicOff className='w-4 h-4' />}
              </Button>

              <Button
                variant='outline'
                onClick={handleToggleVideo}
                disabled={!isConnected}
                className={!isVideoEnabled ? 'bg-red-50 border-red-200' : ''}
              >
                {isVideoEnabled ? <Video className='w-4 h-4' /> : <VideoOff className='w-4 h-4' />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Users className='w-5 h-5' />
              Participants ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 max-h-32 overflow-y-auto'>
              {participants.length === 0 ? (
                <p className='text-sm text-muted-foreground'>No participants yet</p>
              ) : (
                participants.map(participant => (
                  <div key={participant.identity} className='flex items-center gap-2 text-sm'>
                    <div className='w-2 h-2 bg-green-500 rounded-full' />
                    {participant.name || participant.identity}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='pt-6'>
            <p className='text-red-600 text-sm'>Stream Error: {error.message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VirtualEventHost;
