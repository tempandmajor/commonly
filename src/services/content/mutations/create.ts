import { supabase } from '@/integrations/supabase/client';
import { ContentItem } from '../types';
import { validateUniqueSlug } from '../validation';
import { toast } from 'sonner';

export const createContent = async (
  content: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to create content');
      return null;
    }

    // Validate unique slug if provided
    if (content.slug) {
      const isUniqueSlug = await validateUniqueSlug(content.slug);
      if (!isUniqueSlug) {
        toast.error('This slug is already taken');
        return null;
      }
    }

    // Create content record
    const { data, error } = await supabase
      .from('content')
      .insert({
        title: content.title,
        content: content.content,
        author_id: user.id,
        content_type: content.type || 'article',
        status: content.status || 'draft',
        tags: content.tags || [],
        metadata: {
          slug: content.slug,
          description: content.description,
          featured_image: content.featuredImage,
          seo_title: content.seoTitle,
          seo_description: content.seoDescription,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating content:', error);
      toast.error('Failed to create content');
      return null;
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      event_type: 'content_created',
      event_data: {
        content_id: data.id,
        content_type: data.content_type,
        status: data.status,
      },
      user_id: user.id,
    });

    toast.success('Content created successfully');
    return data.id;
  } catch (error) {
    console.error('Error in createContent:', error);
    toast.error('Failed to create content');
    return null;
  }
};
