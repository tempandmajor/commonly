import { supabase } from '@/integrations/supabase/client';
import { ContentItem, ContentType, ContentStatus } from './types';

export const getContentById = async (id: string): Promise<ContentItem | null> => {
  try {
    const { data, error } = await supabase.from('pages').select('*').eq('id', id).single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      slug: data.slug,
      type: 'page' as ContentType,
      status: data.status as ContentStatus,
      author: data.author_id || 'system',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error fetching content by ID:', error);
    return null;
  }
};

export const getContentBySlug = async (
  slug: string,
  type: ContentType
): Promise<ContentItem | null> => {
  try {
    const tableName = type === 'blog' ? 'blog_posts' : 'pages';

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      slug: data.slug,
      type,
      status: data.published ? 'published' : ('draft' as ContentStatus),
      author: data.author_id || 'system',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error fetching content by slug:', error);
    return null;
  }
};

export const listContentByType = async (
  type: ContentType,
  status?: ContentStatus,
  limit = 10,
  offset = 0
): Promise<ContentItem[]> => {
  try {
    const tableName = type === 'blog' ? 'blog_posts' : 'pages';

    let query = supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === 'published') {
      query = query.eq('published', true);
    } else if (status === 'draft') {
      query = query.eq('published', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      slug: item.slug,
      type,
      status: item.published ? 'published' : ('draft' as ContentStatus),
      author: item.author_id || 'system',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error listing content by type:', error);
    return [];
  }
};
