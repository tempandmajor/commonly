/**
 * Rating System Service
 * Handles ratings for products, events, venues, and users
 */
import { supabase } from '@/integrations/supabase/client';

export interface Rating {
  id: string;
  reviewer_id: string;
  reviewee_type: 'product' | 'event' | 'venue' | 'caterer' | 'user';
  reviewee_id: string;
  rating: number;
  title?: string | undefined;
  content?: string | undefined;
  helpful_count: number;
  verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  reviewer?: {
    name: string | undefined;
    avatar_url?: string | undefined;
  };
}

export interface RatingStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    [key: number]: number; // rating value (1-5) -> count
  };
}

class RatingService {
  /**
   * Create a new rating/review
   */
  async createRating(
    revieweeType: Rating['reviewee_type'],
    revieweeId: string,
    rating: number,
    title?: string,
    content?: string,
    verifiedPurchase = false
  ): Promise<Rating> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: user.id,
        reviewee_type: revieweeType,
        reviewee_id: revieweeId,
        rating,
        title,
        content,
        verified_purchase: verifiedPurchase,
      })
      .select(
        `
        *,
        reviewer:users!reviews_reviewer_id_fkey(name, avatar_url)
      `
      )
      .single();

    if (error) throw error;
    return data as Rating;
  }

  /**
   * Get ratings for a specific item
   */
  async getRatings(
    revieweeType: Rating['reviewee_type'],
    revieweeId: string,
    page = 1,
    limit = 10
  ): Promise<{ ratings: Rating[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('reviews')
      .select(
        `
        *,
        reviewer:users!reviews_reviewer_id_fkey(name, avatar_url)
      `,
        { count: 'exact' }
      )
      .eq('reviewee_type', revieweeType)
      .eq('reviewee_id', revieweeId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      ratings: data as Rating[],
      total: count || 0,
    };
  }

  /**
   * Get rating statistics for an item
   */
  async getRatingStats(
    revieweeType: Rating['reviewee_type'],
    revieweeId: string
  ): Promise<RatingStats> {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_type', revieweeType)
      .eq('reviewee_id', revieweeId);

    if (error) throw error;

    const ratings = data || [];
    const totalReviews = ratings.length;

    if (totalReviews === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sum = ratings.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = sum / totalReviews;

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    return {
      average_rating: averageRating,
      total_reviews: totalReviews,
      rating_distribution: distribution,
    };
  }

  /**
   * Update a rating
   */
  async updateRating(
    ratingId: string,
    updates: Partial<Pick<Rating, 'rating' | 'title' | 'content'>>
  ): Promise<Rating> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', ratingId)
      .eq('reviewer_id', user.id) // Ensure user can only update their own ratings
      .select(
        `
        *,
        reviewer:users!reviews_reviewer_id_fkey(name, avatar_url)
      `
      )
      .single();

    if (error) throw error;
    return data as Rating;
  }

  /**
   * Delete a rating
   */
  async deleteRating(ratingId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', ratingId)
      .eq('reviewer_id', user.id);

    if (error) throw error;
  }

  /**
   * Mark a rating as helpful
   */
  async markHelpful(ratingId: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .update({ helpful_count: supabase.raw('helpful_count + 1') })
      .eq('id', ratingId);

    if (error) throw error;
  }

  /**
   * Check if user has already rated an item
   */
  async hasUserRated(revieweeType: Rating['reviewee_type'], revieweeId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', user.id)
      .eq('reviewee_type', revieweeType)
      .eq('reviewee_id', revieweeId)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  }

  /**
   * Get user's rating for an item
   */
  async getUserRating(
    revieweeType: Rating['reviewee_type'],
    revieweeId: string
  ): Promise<Rating | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('reviews')
      .select(
        `
        *,
        reviewer:users!reviews_reviewer_id_fkey(name, avatar_url)
      `
      )
      .eq('reviewer_id', user.id)
      .eq('reviewee_type', revieweeType)
      .eq('reviewee_id', revieweeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as Rating) || null;
  }

  /**
   * Get top-rated items of a specific type
   */
  async getTopRatedItems(
    revieweeType: Rating['reviewee_type'],
    limit = 10
  ): Promise<Array<{ reviewee_id: string; average_rating: number; total_reviews: number }>> {
    const { data, error } = await supabase
      .from('reviews')
      .select('reviewee_id, rating')
      .eq('reviewee_type', revieweeType);

    if (error) throw error;

    // Group by reviewee_id and calculate averages
    const grouped = (data || []).reduce(
      (acc, review) => {
        if (!acc[review.reviewee_id]) {
          acc[review.reviewee_id] = { ratings: [], total: 0 };
        }
        acc[review.reviewee_id].ratings.push(review.rating);
        acc[review.reviewee_id].total++;
        return acc;
      },
      {} as Record<string, { ratings: number[]; total: number }>
    );

    // Calculate averages and sort
    const topRated = Object.entries(grouped)
      .map(([revieweeId, data]) => ({
        reviewee_id: revieweeId,
        average_rating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.total,
        total_reviews: data.total,
      }))
      .filter(item => item.total_reviews >= 3) // Minimum 3 reviews to be considered
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, limit);

    return topRated;
  }

  /**
   * Get recent reviews across all types
   */
  async getRecentReviews(limit = 20): Promise<Rating[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(
        `
        *,
        reviewer:users!reviews_reviewer_id_fkey(name, avatar_url)
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Rating[];
  }
}

export const ratingService = new RatingService();
export default ratingService;
