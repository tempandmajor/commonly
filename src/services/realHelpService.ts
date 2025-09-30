/**
 * Real Help Service - Replaces placeholder help functionality
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
  user_id?: string | undefined;
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

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'responded' | 'resolved';
  created_at: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  description?: string | undefined;
  icon?: string | undefined;
  sort_order: number;
  is_active: boolean;
}

export interface SiteSettings {
  contact_email: string;
  contact_phone: string;
  support_hours: string;
  response_times: {
    general: string;
    technical: string;
    payment: string;
    urgent: string;
  };
}

class RealHelpService {
  /**
   * Get all help articles by category
   */
  async getHelpArticles(category?: string, limit = 50): Promise<HelpArticle[]> {
    try {
      let query = supabase
        .from('help_articles')
        .select(
          `
          *,
          author:users!help_articles_author_id_fkey(name, display_name, avatar_url)
        `
        )
        .eq('published', true);

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query
        .order('featured', { ascending: false })
        .order('helpful_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as HelpArticle[];
    } catch (error) {
      console.error('Error fetching help articles:', error);
      return [];
    }
  }

  /**
   * Get featured help articles
   */
  async getFeaturedArticles(limit = 6): Promise<HelpArticle[]> {
    try {
      const { data, error } = await supabase
        .from('help_articles')
        .select(
          `
          *,
          author:users!help_articles_author_id_fkey(name, display_name, avatar_url)
        `
        )
        .eq('published', true)
        .eq('featured', true)
        .order('helpful_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as HelpArticle[];
    } catch (error) {
      console.error('Error fetching featured articles:', error);
      return [];
    }
  }

  /**
   * Search help articles
   */
  async searchArticles(query: string, category?: string): Promise<HelpArticle[]> {
    try {
      let queryBuilder = supabase
        .from('help_articles')
        .select(
          `
          *,
          author:users!help_articles_author_id_fkey(name, display_name, avatar_url)
        `
        )
        .eq('published', true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

      if (category && category !== 'all') {
        queryBuilder = queryBuilder.eq('category', category);
      }

      const { data, error } = await queryBuilder
        .order('helpful_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as HelpArticle[];
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  }

  /**
   * Get article by ID and increment view count
   */
  async getArticle(id: string): Promise<HelpArticle | null> {
    try {
      const { data, error } = await supabase
        .from('help_articles')
        .select(
          `
          *,
          author:users!help_articles_author_id_fkey(name, display_name, avatar_url)
        `
        )
        .eq('id', id)
        .eq('published', true)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from('help_articles')
        .update({ view_count: data.view_count + 1 })
        .eq('id', id);

      return { ...data, view_count: data.view_count + 1 } as HelpArticle;
    } catch (error) {
      console.error('Error fetching article:', error);
      return null;
    }
  }

  /**
   * Mark article as helpful
   */
  async markHelpful(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('increment_helpful_count', {
        article_id: id,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking article as helpful:', error);
      return false;
    }
  }

  /**
   * Get FAQ categories
   */
  async getFAQCategories(): Promise<FAQCategory[]> {
    try {
      const { data, error } = await supabase
        .from('faq_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as FAQCategory[];
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      return [];
    }
  }

  /**
   * Create support ticket
   */
  async createSupportTicket(
    subject: string,
    message: string,
    category: string,
    priority: SupportTicket['priority'] = 'medium'
  ): Promise<SupportTicket | null> {
    try {
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
    } catch (error) {
      console.error('Error creating support ticket:', error);
      return null;
    }
  }

  /**
   * Create contact submission
   */
  async createContactSubmission(
    name: string,
    email: string,
    subject: string,
    message: string,
    category = 'general_inquiry',
    priority: ContactSubmission['priority'] = 'medium'
  ): Promise<ContactSubmission | null> {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .insert({
          name,
          email,
          subject,
          message,
          category,
          priority,
          status: 'unread',
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as ContactSubmission;
    } catch (error) {
      console.error('Error creating contact submission:', error);
      return null;
    }
  }

  /**
   * Get user's support tickets
   */
  async getUserTickets(): Promise<SupportTicket[]> {
    try {
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
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  }

  /**
   * Get quick start guide for specific creation type
   */
  async getQuickStartGuide(creationType: string): Promise<HelpArticle | null> {
    try {
      const { data, error } = await supabase
        .from('help_articles')
        .select(
          `
          *,
          author:users!help_articles_author_id_fkey(name, display_name, avatar_url)
        `
        )
        .eq('published', true)
        .eq('category', creationType)
        .eq('difficulty_level', 'beginner')
        .order('helpful_count', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return (data as HelpArticle) || null;
    } catch (error) {
      console.error('Error fetching quick start guide:', error);
      return null;
    }
  }

  /**
   * Get site settings for help/contact info
   */
  async getSiteSettings(): Promise<SiteSettings> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'contact_email',
          'contact_phone',
          'support_hours',
          'response_time_general',
          'response_time_technical',
          'response_time_payment',
          'response_time_urgent',
        ]);

      if (error) throw error;

      const settings: any = {};
      data?.forEach(setting => {
        settings[setting.key] = JSON.parse(setting.value) as any;
      });

      return {
        contact_email: settings.contact_email || 'hello@commonlyapp.com',
        contact_phone: settings.contact_phone || '+1 (872) 261-2607',
        support_hours: settings.support_hours || 'Monday to Friday, 9am to 6pm EST',
        response_times: {
          general: settings.response_time_general || '24 hours',
          technical: settings.response_time_technical || '12 hours',
          payment: settings.response_time_payment || '4 hours',
          urgent: settings.response_time_urgent || '1 hour',
        },
      };
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return {
        contact_email: 'hello@commonlyapp.com',
        contact_phone: '+1 (872) 261-2607',
        support_hours: 'Monday to Friday, 9am to 6pm EST',
        response_times: {
          general: '24 hours',
          technical: '12 hours',
          payment: '4 hours',
          urgent: '1 hour',
        },
      };
    }
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
    try {
      const { data: articles, error } = await supabase
        .from('help_articles')
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
    } catch (error) {
      console.error('Error fetching help stats:', error);
      return {
        total_articles: 0,
        total_views: 0,
        popular_categories: [],
        recent_articles: 0,
      };
    }
  }
}

export const realHelpService = new RealHelpService();
export default realHelpService;
