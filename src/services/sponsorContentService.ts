import { supabase } from '@/integrations/supabase/client';

export interface SponsorSection {
  title: string;
  content: string;
}

export interface SponsorContent {
  title: string;
  subtitle: string;
  sections: SponsorSection[];
}

export const getSponsorContent = async (): Promise<SponsorContent | null> => {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('slug', 'for-sponsors')
      .eq('published', true)
      .single();

    if (error) {
      console.error('Error fetching sponsor content:', error);
      return null;
    }

    if (data) {
      try {
        // Parse content sections from the content field
        const contentData = JSON.parse(data.content || '{}') as any;

        if (contentData.sections) {
          return {
            title: data.title,
            subtitle:
              data.excerpt || 'Connect with engaged audiences and support the events that matter',
            sections: contentData.sections,
          };
        }
      } catch (e) {
        // If not JSON, create a single section with the content
        return {
          title: data.title,
          subtitle:
            data.excerpt || 'Connect with engaged audiences and support the events that matter',
          sections: [
            {
              title: data.title,
              content: data.content || '',
            },
          ],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error in getSponsorContent:', error);
    return null;
  }
};
