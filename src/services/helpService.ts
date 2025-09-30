/**
 * Help Service - Documentation, Guides, and Support
 */
import { supabase } from '@/integrations/supabase/client';

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_time?: string | undefined;
  view_count: number;
  helpful_count: number;
  author_id?: string | undefined;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    name: string | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
  };
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string | undefined;
  resolution?: string | undefined;
  created_at: string;
  updated_at: string;
}

class HelpService {
  /**
   * Get creation guides by content type
   */
  async getCreationGuides(contentType?: string): Promise<HelpArticle[]> {
    let query = supabase
      .from('creation_guides')
      .select(
        `
        *,
        author:users!creation_guides_author_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('published', true)
      .order('featured', { ascending: false })
      .order('helpful_count', { ascending: false });

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as HelpArticle[];
  }

  /**
   * Get featured guides
   */
  async getFeaturedGuides(limit = 6): Promise<HelpArticle[]> {
    const { data, error } = await supabase
      .from('creation_guides')
      .select(
        `
        *,
        author:users!creation_guides_author_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('published', true)
      .eq('featured', true)
      .order('helpful_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as HelpArticle[];
  }

  /**
   * Search help articles
   */
  async searchArticles(query: string, category?: string): Promise<HelpArticle[]> {
    let queryBuilder = supabase
      .from('creation_guides')
      .select(
        `
        *,
        author:users!creation_guides_author_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('published', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const { data, error } = await queryBuilder
      .order('helpful_count', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data as HelpArticle[];
  }

  /**
   * Get article by ID and increment view count
   */
  async getArticle(id: string): Promise<HelpArticle> {
    // Get article
    const { data, error } = await supabase
      .from('creation_guides')
      .select(
        `
        *,
        author:users!creation_guides_author_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('id', id)
      .eq('published', true)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase
      .from('creation_guides')
      .update({ view_count: data.view_count + 1 })
      .eq('id', id);

    return { ...data, view_count: data.view_count + 1 } as HelpArticle;
  }

  /**
   * Mark article as helpful
   */
  async markHelpful(id: string): Promise<void> {
    const { error } = await supabase
      .from('creation_guides')
      .update({ helpful_count: supabase.raw('helpful_count + 1') })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get popular articles
   */
  async getPopularArticles(limit = 10): Promise<HelpArticle[]> {
    const { data, error } = await supabase
      .from('creation_guides')
      .select(
        `
        *,
        author:users!creation_guides_author_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('published', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as HelpArticle[];
  }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(category: string): Promise<HelpArticle[]> {
    const { data, error } = await supabase
      .from('creation_guides')
      .select(
        `
        *,
        author:users!creation_guides_author_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('published', true)
      .eq('category', category)
      .order('helpful_count', { ascending: false });

    if (error) throw error;
    return data as HelpArticle[];
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('creation_guides')
      .select('category')
      .eq('published', true);

    if (error) throw error;

    const categories = [...new Set((data || []).map(item => item.category).filter(Boolean))];
    return categories;
  }

  /**
   * Create support ticket
   */
  async createSupportTicket(
    subject: string,
    message: string,
    category: string,
    priority: SupportTicket['priority'] = 'medium'
  ): Promise<SupportTicket> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        message,
        category,
        priority,
        status: 'open',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as SupportTicket;
  }

  /**
   * Get user's support tickets
   */
  async getUserTickets(): Promise<SupportTicket[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SupportTicket[];
  }

  /**
   * Get quick start guides for specific creation type
   */
  async getQuickStartGuide(creationType: string): Promise<HelpArticle | null> {
    const { data, error } = await supabase
      .from('creation_guides')
      .select(
        `
        *,
        author:users!creation_guides_author_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('published', true)
      .eq('content_type', creationType)
      .eq('difficulty_level', 'beginner')
      .order('helpful_count', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as HelpArticle) || null;
  }

  /**
   * Get help statistics
   */
  async getHelpStats(): Promise<{
    total_articles: number;
    total_views: number;
    popular_categories: Array<{ category: string; count: number }>;
    recent_articles: number;
  }> {
    const { data: articles, error } = await supabase
      .from('creation_guides')
      .select('category, view_count, created_at')
      .eq('published', true);

    if (error) throw error;

    const totalArticles = articles.length;
    const totalViews = articles.reduce((sum, article) => sum + (article.view_count || 0), 0);

    // Calculate popular categories
    const categoryCount: Record<string, number> = {};
    articles.forEach(article => {
      if (article.category) {
        categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
      }
    });

    const popularCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent articles (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentArticles = articles.filter(
      article => new Date(article.created_at) > thirtyDaysAgo
    ).length;

    return {
      total_articles: totalArticles,
      total_views: totalViews,
      popular_categories: popularCategories,
      recent_articles: recentArticles,
    };
  }

  /**
   * Get community help - articles by other users
   */
  async getCommunityHelp(): Promise<HelpArticle[]> {
    const { data, error } = await supabase
      .from('creation_guides')
      .select(
        `
        *,
        author:users!creation_guides_author_id_fkey(name, display_name, avatar_url)
      `
      )
      .eq('published', true)
      .not('author_id', 'is', null)
      .order('helpful_count', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data as HelpArticle[];
  }

  /**
   * Contact support - create a support request
   */
  async contactSupport(
    name: string,
    email: string,
    subject: string,
    message: string,
    category = 'general'
  ): Promise<void> {
    // In a real implementation, this would send an email or create a ticket
    // For now, we'll create a support ticket if user is authenticated
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await this.createSupportTicket(subject, `From: ${name} (${email})\n\n${message}`, category);
      } else {
        // For non-authenticated users, log the contact attempt
        console.log('Support contact:', { name, email, subject, message, category });
      }
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      // Don't throw - contact form should always succeed
    }
  }
}

export const helpService = new HelpService();
export default helpService;
