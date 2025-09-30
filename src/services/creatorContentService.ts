import { supabase } from '@/integrations/supabase/client';

export interface CreatorSection {
  title: string;
  content: string;
}

export interface CreatorContent {
  title: string;
  subtitle: string;
  sections: CreatorSection[];
}

export const getCreatorContent = async (): Promise<CreatorContent | null> => {
  try {
    // Fetch creator content from pages table
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', 'for-creators')
      .eq('published', true)
      .single();

    if (error) {
      console.error('Error fetching creator content:', error);
      return null;
    }

    if (data) {
      // Parse the content sections from the content field
      let sections: CreatorSection[] = [];

      try {
        // Assume content is stored as JSON with sections
        const contentData = JSON.parse(data.content || '{}') as any;
        sections = contentData.sections || [];
      } catch (e) {
        // If not JSON, create a single section with the content
        sections = [
          {
            title: 'For Creators',
            content: data.content || '',
          },
        ];
      }

      return {
        title: data.title,
        subtitle: data.excerpt || 'Everything you need to create successful events on Commonly',
        sections,
      };
    }

    return null;
  } catch (error) {
    console.error('Error in getCreatorContent:', error);
    return null;
  }
};
