import { supabase } from '@/integrations/supabase/client';
import { ContentItem } from '../types';
import { validateUniqueSlug } from '../validation';
import { toast } from 'sonner';

export const updateContent = async (
  id: string,
  content: Partial<ContentItem>
): Promise<boolean> => {
  try {
    // Validate unique slug if slug is being updated
    if (content.slug) {
      const isUnique = await validateUniqueSlug(content.slug, id);
      if (!isUnique) {
        toast.error('A page with this URL already exists');
        return false;
      }
    }

    // Update content in the ContentTest table (using existing pattern)
    const { error } = await (supabase as any)
      .from('ContentTest')
      .update({
        title: content.title,
        body: JSON.stringify({
          type: content.type || 'page',
          slug: content.slug,
          content: content.content,
          excerpt: content.excerpt,
          featuredImage: content.featuredImage,
          author: content.author,
          status: content.status || 'published',
          metadata: content.metadata || {},
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating content:', error);
      toast.error('Failed to update content');
      return false;
    }

    toast.success('Content updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating content:', error);
    toast.error('Failed to update content');
    return false;
  }
};
