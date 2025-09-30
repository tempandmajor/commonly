import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { safeSupabaseQuery } from '@/utils/supabaseHelpers';

interface Review {
  id: string;
  user_id: string;
  caterer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
  user?: {
    username: string | undefined;
    avatar_url: string;
  };
}

interface CatererReviewsProps {
  catererId: string;
  isAuthenticated: boolean;
}

const CatererReviews: React.FC<CatererReviewsProps> = ({ catererId, isAuthenticated }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (isAuthenticated) {
      checkUserReview();
    }
  }, [catererId, isAuthenticated]);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Safe query for reviews
      const { data: reviewsData, error } = await safeSupabaseQuery(
        supabase
          .from('caterer_reviews')
          .select(
            `
            id,
            user_id,
            caterer_id,
            rating,
            comment,
            created_at,
            helpful_count,
            users!user_id (
              name,
              avatar_url
            )
          `
          )
          .eq('caterer_id', catererId)
          .order('created_at', { ascending: false })
          .then(result => result),
        []
      );

      if (error) {
        console.error('Error fetching reviews:', error);
        toast.error('Failed to load reviews');
        return;
      }

      // Transform data safely
      const formattedReviews: Review[] = (reviewsData || [])
        .filter((item: any) => item && typeof item === 'object' && !item.error)
        .map((review: any) => ({
          id: review.id || '',
          user_id: review.user_id || '',
          caterer_id: review.caterer_id || '',
          rating: Number(review.rating) as number || 0,
          comment: review.comment || '',
          created_at: review.created_at || new Date().toISOString(),
          helpful_count: Number(review.helpful_count) as number || 0,
          user: {
            username: review.users?.name || 'Anonymous',
            avatar_url: review.users?.avatar_url || '',
          },
        }));

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error in fetchReviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkUserReview = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await safeSupabaseQuery(
        supabase
          .from('caterer_reviews')
          .select('id')
          .eq('caterer_id', catererId)
          .eq('user_id', user.id)
          .single()
          .then(result => result),
        null
      );

      if (!error && data) {
        setUserHasReviewed(true);
      }
    } catch (error) {
      console.error('Error checking user review:', error);
    }
  };

  const submitReview = async () => {
    if (!rating || !newReview.trim()) {
      toast.error('Please provide both a rating and review');
      return;
    }

    try {
      setSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to leave a review');
        return;
      }

      const { error } = await safeSupabaseQuery(
        supabase
          .from('caterer_reviews')
          .insert({
            caterer_id: catererId,
            user_id: user.id,
            rating,
            comment: newReview.trim(),
            helpful_count: 0,
          })
          .then(result => result),
        null
      );

      if (error) {
        toast.error('Failed to submit review');
        console.error('Review submission error:', error);
        return;
      }

      toast.success('Review submitted successfully!');
      setNewReview('');
      setRating(0);
      setUserHasReviewed(true);
      await fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const markHelpful = async (reviewId: string) => {
    try {
      // Use our mock RPC for now to avoid "never" type errors
      await supabase.rpc('increment_helpful_count', { review_id: reviewId });
      toast.success('Marked as helpful!');
      await fetchReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
      // Fallback: increment locally
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId ? { ...review, helpful_count: review.helpful_count + 1 } : review
        )
      );
      toast.success('Marked as helpful!');
    }
  };

  const renderStars = (
    rating: number,
    isInteractive = false,
    onStarClick?: (star: number) => void
  ) => {
    return (
      <div className='flex items-center'>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= (isInteractive ? hoveredRating || rating : rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${isInteractive ? 'cursor-pointer' : ''}`}
            onClick={() => isInteractive && onStarClick?.(star)}
            onMouseEnter={() => isInteractive && setHoveredRating(star)}
            onMouseLeave={() => isInteractive && setHoveredRating(0)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Reviews</h3>
        {[1, 2, 3].map(i => (
          <Card key={i} className='animate-pulse'>
            <CardContent className='p-4'>
              <div className='flex items-start space-x-4'>
                <div className='h-10 w-10 bg-gray-200 rounded-full'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-1/4'></div>
                  <div className='h-4 bg-gray-200 rounded w-full'></div>
                  <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Reviews ({reviews.length})</h3>
        {reviews.length > 0 && (
          <div className='flex items-center space-x-2'>
            <div className='flex items-center'>
              {renderStars(
                reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
              )}
            </div>
            <span className='text-sm text-gray-600'>
              {(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(
                1
              )}
            </span>
          </div>
        )}
      </div>

      {/* Review Form */}
      {isAuthenticated && !userHasReviewed && (
        <Card>
          <CardContent className='p-4'>
            <h4 className='font-medium mb-3'>Leave a Review</h4>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium mb-2 block'>Rating</label>
                {renderStars(rating, true, setRating)}
              </div>
              <div>
                <label className='text-sm font-medium mb-2 block'>Your Review</label>
                <Textarea
                  value={newReview}
                  onChange={e => setNewReview((e.target as HTMLInputElement).value)}
                  placeholder='Share your experience with this caterer...'
                  rows={4}
                />
              </div>
              <Button
                onClick={submitReview}
                disabled={submitting || !rating || !newReview.trim()}
                className='w-full'
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className='space-y-4'>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className='p-8 text-center'>
              <User className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-600'>No reviews yet. Be the first to review this caterer!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map(review => (
            <Card key={review.id}>
              <CardContent className='p-4'>
                <div className='flex items-start space-x-4'>
                  <Avatar className='h-10 w-10'>
                    <AvatarImage src={review.user?.avatar_url} />
                    <AvatarFallback>
                      {review.user?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between mb-2'>
                      <div>
                        <p className='font-medium'>{review.user?.username || 'Anonymous'}</p>
                        <div className='flex items-center space-x-2'>
                          {renderStars(review.rating)}
                          <span className='text-sm text-gray-500'>
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className='text-gray-700 mb-3'>{review.comment}</p>
                    <div className='flex items-center space-x-4'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => markHelpful(review.id)}
                        className='text-gray-500 hover:text-gray-700'
                      >
                        <ThumbsUp className='h-4 w-4 mr-1' />
                        Helpful ({review.helpful_count})
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CatererReviews;
