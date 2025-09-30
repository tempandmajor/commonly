/**
 * Event Streaming Service - Production Implementation
 *
 * Handles virtual event streaming, viewer management, and stream lifecycle
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StreamStatus {
  isLive: boolean;
  viewerCount: number;
  startTime?: string | undefined;
  endTime?: string | undefined;
  recordingUrl?: string | undefined;
}

export interface StreamEvent {
  id: string;
  eventId: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  startTime: string;
  endTime?: string | undefined;
  viewerCount: number;
  recordingUrl?: string | undefined;
  streamUrl?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

/**
 * Updates the stream status for an event
 */
export const updateStreamStatus = async (
  eventId: string,
  streamStatus: Partial<StreamStatus>
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('event_streams').upsert(
      {
        event_id: eventId,
        status: streamStatus.isLive ? 'live' : 'ended',
        viewer_count: streamStatus.viewerCount || 0,
        start_time: streamStatus.startTime,
        end_time: streamStatus.endTime,
        recording_url: streamStatus.recordingUrl,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'event_id',
      }
    );

    if (error) throw error;

    // Update the main event table with stream status
    await supabase
      .from('events')
      .update({
        stream_status: streamStatus.isLive ? 'live' : 'ended',
        viewer_count: streamStatus.viewerCount || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    return true;
  } catch (error) {
    toast.error('Failed to update stream status');
    return false;
  }
};

/**
 * Starts a stream for an event
 */
export const startStream = async (eventId: string): Promise<string | null> => {
  try {
    const startTime = new Date().toISOString();

    // Create or update stream record
    const { data, error } = await supabase
      .from('event_streams')
      .upsert(
        {
          event_id: eventId,
          status: 'live',
          start_time: startTime,
          viewer_count: 0,
          created_at: startTime,
          updated_at: startTime,
        },
        {
          onConflict: 'event_id',
        }
      )
      .select()
      .single();

    if (error) throw error;

    // Update event status
    await supabase
      .from('events')
      .update({
        stream_status: 'live',
        stream_start_time: startTime,
        updated_at: startTime,
      })
      .eq('id', eventId);

    // Generate stream URL (in production, this would integrate with streaming service)
    const streamUrl = `https://stream.commonly.app/live/${eventId}`;

    // Update with stream URL
    await supabase
      .from('event_streams')
      .update({
        stream_url: streamUrl,
      })
      .eq('event_id', eventId);

    toast.success('Stream started successfully');
    return streamUrl;
  } catch (error) {
    toast.error('Failed to start stream');
    return null;
  }
};

/**
 * Ends a stream for an event
 */
export const endStream = async (eventId: string, recordingUrl?: string): Promise<boolean> => {
  try {
    const endTime = new Date().toISOString();

    // Update stream record
    const { error } = await supabase
      .from('event_streams')
      .update({
        status: 'ended',
        end_time: endTime,
        recording_url: recordingUrl,
        updated_at: endTime,
      })
      .eq('event_id', eventId);

    if (error) throw error;

    // Update event status
    await supabase
      .from('events')
      .update({
        stream_status: 'ended',
        stream_end_time: endTime,
        recording_url: recordingUrl,
        updated_at: endTime,
      })
      .eq('id', eventId);

    toast.success('Stream ended successfully');
    return true;
  } catch (error) {
    toast.error('Failed to end stream');
    return false;
  }
};

/**
 * Cancels a scheduled stream
 */
export const cancelStream = async (eventId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('event_streams')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    if (error) throw error;

    // Update event status
    await supabase
      .from('events')
      .update({
        stream_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    toast.success('Stream cancelled successfully');
    return true;
  } catch (error) {
    toast.error('Failed to cancel stream');
    return false;
  }
};

/**
 * Get upcoming streams for discover page
 */
export const getUpcomingStreams = async (limit = 6): Promise<StreamEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('event_streams')
      .select(
        `
        *,
        events!inner(
          id,
          title,
          description,
          start_date,
          end_date,
          image_url,
          organizer_id
        )
      `
      )
      .eq('status', 'scheduled')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (
      data?.map(stream => ({
        id: stream.id,
        eventId: stream.event_id,
        status: stream.status as 'scheduled' | 'live' | 'ended' | 'cancelled',
        startTime: stream.start_time,
        endTime: stream.end_time,
        viewerCount: stream.viewer_count || 0,
        recordingUrl: stream.recording_url,
        streamUrl: stream.stream_url,
        createdAt: stream.created_at,
        updatedAt: stream.updated_at,
      })) || []
    );
  } catch (error) {
    return [];
  }
};

/**
 * Updates viewer count for a live stream
 */
export const updateViewerCount = async (eventId: string, viewerCount: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('event_streams')
      .update({
        viewer_count: viewerCount,
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);

    if (error) throw error;

    // Also update the events table for quick access
    await supabase
      .from('events')
      .update({
        viewer_count: viewerCount,
      })
      .eq('id', eventId);

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get stream status for an event
 */
export const getStreamStatus = async (eventId: string): Promise<StreamStatus | null> => {
  try {
    const { data, error } = await supabase
      .from('event_streams')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No stream found, return default status
        return {
          isLive: false,
          viewerCount: 0,
        };
      }
      throw error;
    }

    return {
      isLive: data.status === 'live',
      viewerCount: data.viewer_count || 0,
      startTime: data.start_time,
      endTime: data.end_time,
      recordingUrl: data.recording_url,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Subscribe to stream status changes
 */
export const subscribeToStreamStatus = (
  eventId: string,
  callback: (status: StreamStatus) => void
): (() => void) => {
  const subscription = supabase
    .channel(`stream_status:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_streams',
        filter: `event_id=eq.${eventId}`,
      },
      payload => {
        const data = payload.new as unknown;
        if (data) {
          callback({
            isLive: data.status === 'live',
            viewerCount: data.viewer_count || 0,
            startTime: data.start_time,
            endTime: data.end_time,
            recordingUrl: data.recording_url,
          });
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};
