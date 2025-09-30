/**
 * Simplified Comments Section - Clean rebuild to fix TypeScript errors
 */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { safeSupabaseQuery } from '@/utils/supabaseHelpers';

interface SimpleComment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: {
    name: string | undefined;
    avatar_url?: string | undefined;
  } | null;
}

interface SimpleCommentsSectionProps {
  entityType: 'product' | 'event' | 'venue' | 'caterer' | 'post';
  entityId: string;
  showForm?: boolean | undefined;
}

export default function SimpleCommentsSection({
  entityType,
  entityId,
  showForm = true,
}: SimpleCommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<SimpleComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [entityType, entityId]);

  const loadComments = async () => {
    setLoading(true);

    const { data, error } = await safeSupabaseQuery(
      supabase
        .from('comments')
        .select(
          `
          id,
          content,
          user_id,
          created_at,
          users:user_id (
            name,
            avatar_url
          )
        `
        )
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false }).then(result => result),
      []
    );

    if (error) {
      toast.error('Failed to load comments');
      console.error('Comments loading error:', error);
    } else {
      // Transform the data to match our interface
      const transformedComments = (data || []).map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        user_id: comment.user_id,
        created_at: comment.created_at,
        user: comment.users
          ? {
              name: comment.users.name,
              avatar_url: comment.users.avatar_url,
            }
          : null,
      }));
      setComments(transformedComments);
    }

    setLoading(false);
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) {
      toast.error('Please sign in and enter a comment');
      return;
    }

    setSubmitting(true);

    const { error } = await safeSupabaseQuery(
      supabase.from('comments').insert({
        content: newComment.trim(),
        entity_type: entityType,
        entity_id: entityId,
        user_id: user.id,
      }),
      null
    );

    if (error) {
      toast.error('Failed to post comment');
      console.error('Comment submission error:', error);
    } else {
      toast.success('Comment posted!');
      setNewComment('');
      await loadComments(); // Reload comments
    }

    setSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessageCircle className='h-5 w-5' />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <div key={i} className='flex gap-3'>
                <div className='w-10 h-10 bg-gray-200 rounded-full animate-pulse' />
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-gray-200 rounded animate-pulse w-1/4' />
                  <div className='h-16 bg-gray-200 rounded animate-pulse' />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MessageCircle className='h-5 w-5' />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Comment Form */}
        {showForm && user && (
          <div className='space-y-3'>
            <Textarea
              placeholder='Write a comment...'
              value={newComment}
              onChange={e => setNewComment((e.target as HTMLInputElement).value)}
              className='min-h-[100px]'
            />
            <div className='flex justify-end'>
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                size='sm'
              >
                <Send className='h-4 w-4 mr-2' />
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className='space-y-4'>
          {comments.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <MessageCircle className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className='flex gap-3 p-4 bg-gray-50 rounded-lg'>
                <Avatar className='h-10 w-10'>
                  <AvatarImage src={comment.user.avatar_url} />
                  <AvatarFallback>
                    {comment.user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-sm'>{comment.user.name || 'Anonymous'}</span>
                    <span className='text-xs text-gray-500'>{formatDate(comment.created_at)}</span>
                  </div>
                  <p className='text-sm text-gray-700 whitespace-pre-wrap'>{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
