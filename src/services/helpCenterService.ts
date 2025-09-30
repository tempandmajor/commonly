import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/utils/errorUtils';

/**
 * Represents a help article in the system
 */
export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  slug?: string | undefined;
  featured?: boolean | undefined;
  viewCount?: number | undefined;
  createdAt: string;
  updatedAt: string;
}

/**
 * Search for help articles matching a query string
 * @param query - The search query string
 * @returns Promise resolving to an array of matching help articles
 */
export const searchHelpArticles = async (query: string): Promise<HelpArticle[]> => {
  try {
    let supabaseQuery = supabase
      .from('help_articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (query && query.trim()) {
      const searchTerm = query!.toLowerCase().trim();
      supabaseQuery = supabaseQuery.or(
        `title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`
      );
    }

    const { data, error } = await supabaseQuery;

    if (error) throw error;

    if (!data || data.length === 0) return [];

    return data.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      category: item.category || 'General',
      tags: item.tags || [],
      helpful: item.helpful_count || 0,
      notHelpful: item.not_helpful_count || 0,
      lastUpdated: item.updated_at,
    }));
  } catch (error) {
    console.error('Error searching help articles:', error);
    return [];
  }
};

/**
 * Get all help articles
 * @returns Promise resolving to an array of all help articles
 */
export const getHelpArticles = async (): Promise<HelpArticle[]> => {
  return searchHelpArticles('');
};

/**
 * Get a help article by its slug
 * @param slug - The unique slug identifier for the article
 * @returns Promise resolving to the help article or null if not found
 */
export const getHelpArticleBySlug = async (slug: string): Promise<HelpArticle | null> => {
  try {
    if (!slug) return null;

    // First try to find the article by filtering ContentTest records
    const { data, error } = await supabase.from('ContentTest').select('*');

    if (error) throw error;

    if (!data || data.length === 0) return null;

    // Find the article with matching slug in the body field
    const article = data.find(item => {
      try {
        const body = JSON.parse(item.body || '{}') as any;
        return (
          (body.type === 'help_article' || body.contentType === 'help_article') &&
          (body.slug === slug || item.title?.toLowerCase().replace(/\s+/g, '-') === slug)
        );
      } catch (e) {
        return false;
      }
    });

    if (!article) return null;

    // Parse the article data
    let articleData;
    try {
      articleData = JSON.parse(article.body || '{}') as any;
    } catch (e) {
      articleData = {};
    }

    // Record a view of this article
    try {
      await supabase.from('Events').insert({
        event_type: 'help_article_view',
        event_object_id: article.id,
        event_data: JSON.stringify({
          slug,
          title: article.title,
          timestamp: new Date().toISOString(),
        }),
      });

      // Also update the view count in the article itself
      const updatedViewCount = (articleData.viewCount || 0) + 1;
      articleData.viewCount = updatedViewCount;

      await supabase
        .from('ContentTest')
        .update({
          body: JSON.stringify(articleData),
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id);
    } catch (viewError) {
      // Non-critical error, just log it
    }

    // Return formatted help article
    return {
      id: article.id,
      title: article.title || '',
      content: articleData.content || '',
      category: articleData.category || 'Uncategorized',
      tags: articleData.tags || [],
      slug: articleData.slug || article.title?.toLowerCase().replace(/\s+/g, '-') || '',
      featured: articleData.featured || false,
      viewCount: (articleData.viewCount || 0) + 1, // Increment view count
      createdAt: article.created_at || new Date().toISOString(),
      updatedAt: article.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    handleError(error, { slug }, 'Error getting help article by slug');
    return null;
  }
};

/**
 * Increment the view count for a help article
 * @param articleId - The ID of the article to increment views for
 * @returns Promise resolving to a boolean indicating success
 */
export const incrementArticleViewCount = async (articleId: string): Promise<boolean> => {
  try {
    const { data: article, error: fetchError } = await supabase
      .from('ContentTest')
      .select('body')
      .eq('id', articleId)
      .single();

    if (fetchError) throw fetchError;
    if (!article) return false;

    // Parse the article data
    let articleData;
    try {
      articleData = JSON.parse(article.body || '{}') as any;
    } catch (e) {
      articleData = {};
    }

    // Increment view count
    articleData.viewCount = (articleData.viewCount || 0) + 1;

    // Update the article
    const { error: updateError } = await supabase
      .from('ContentTest')
      .update({
        body: JSON.stringify(articleData),
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    handleError(error, { articleId }, 'Error incrementing article view count');
    return false;
  }
};
