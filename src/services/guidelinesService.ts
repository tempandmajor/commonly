import { supabase } from '@/integrations/supabase/client';

/**
 * Represents a section of community guidelines
 */
export interface GuidelineSection {
  id: string;
  label: string;
  content: string;
  order?: number | undefined;
  lastUpdated?: string | undefined;
  category?: string | undefined;
}

/**
 * Retrieves community guidelines from the database
 * @returns Promise resolving to an array of guideline sections
 */
export const getGuidelines = async (): Promise<GuidelineSection[]> => {
  try {
    const { data, error } = await supabase
      .from('guidelines')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(item => ({
      id: item.id,
      label: item.title,
      content: item.content,
      order: item.order_index,
      category: item.category || 'general',
      lastUpdated: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching guidelines:', error);
    return [];
  }
};
