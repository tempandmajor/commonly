import { useDataFetch } from './useDataFetch';
import { supabase } from '@/integrations/supabase/client';

interface PageContent {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const fetchPageContent = async (pageId: string): Promise<PageContent | null> => {
  if (!pageId) {
    return null;
  }

  try {
    // Get page content from the content table
    const { data, error } = await supabase
      .from('page_contents')
      .select('*')
      .eq('id', pageId)
      .single();

    if (error) {
      return null;
    }

    return data as PageContent;
  } catch (error) {
    return null;
  }
};

export const usePageContent = (pageId: string) => {
  const { data, isLoading, error } = useDataFetch(() => fetchPageContent(pageId), [pageId], {
    errorMessage: 'Failed to load page content',
    fetchOnMount: !!pageId,
  });

  return {
    content: data,
    isLoading,
    error,
  };
};
