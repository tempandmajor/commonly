import { useDataFetch } from './useDataFetch';
import { supabase } from '@/integrations/supabase/client';

export interface Report {
  id: string;
  type: string;
  title: string;
  data: unknown;
  createdAt: string;
}

const fetchReports = async (): Promise<Report[]> => {
  try {
    // Fetch reports from the database
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    // Transform data to match our Report interface
    return (data || []).map(report => ({
      id: report.id,
      type: report.report_type,
      title: report.title,
      data: report.data,
      createdAt: report.created_at,
    }));
  } catch (error) {
    return [];
  }
};

export const useReports = () => {
  const { data, isLoading, error } = useDataFetch(fetchReports, [], {
    errorMessage: 'Failed to load reports',
  });

  return {
    reports: data || [],
    isLoading,
    error,
  };
};
