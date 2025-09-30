import { useDataFetch } from './useDataFetch';
import { supabase } from '@/integrations/supabase/client';

interface ReportedEvent {
  id: string;
  eventId: string;
  eventTitle: string;
  reason: string;
  reportedBy: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reportedAt: string;
}

const fetchReportedEvents = async (): Promise<ReportedEvent[]> => {
  try {
    // Get all reported events with additional event information
    const { data, error } = await supabase
      .from('reported_events')
      .select(
        `
        id,
        event_id,
        reason,
        reported_by,
        status,
        created_at,
        events:event_id (title)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    // Map the data to match our interface
    return (data || []).map(report => ({
      id: report.id,
      eventId: report.event_id,
      eventTitle: report.events?.title || 'Unknown Event',
      reason: report.reason,
      reportedBy: report.reported_by,
      status: report.status,
      reportedAt: report.created_at,
    }));
  } catch (error) {
    return [];
  }
};

export const useReportedEvents = () => {
  const { data, isLoading, error } = useDataFetch(fetchReportedEvents, [], {
    errorMessage: 'Failed to load reported events',
  });

  return {
    reportedEvents: data || [],
    isLoading,
    error,
  };
};
