import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import {
  Heart,
  MessageSquare,
  Share2,
  MoreVertical,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Send,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string | undefined;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string | undefined;
    name: string;
    username: string;
    avatar_url: string;
  };
  has_liked?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  user?: {
    id: string | undefined;
    name: string;
    username: string;
    avatar_url: string;
  };
}

interface PostsTabProps {
  userId: string;
  isOwnProfile: boolean;
  username: string;
}

const PostsTab: React.FC<PostsTabProps> = ({ userId, isOwnProfile, username }) => {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [userId]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      // Fetch posts without join first
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch user information for the posts
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, username, avatar_url')
          .eq('id', userId)
          .single();

        // Check if current user has liked each post
        let likedPostIds = new Set();
        if (currentUser) {
          const postIds = data!.map(post => post.id);
          const { data: likes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', currentUser.id)
            .in('post_id', postIds);

          likedPostIds = new Set(likes?.map(like => like.post_id) || []);
        }

        const postsWithUserAndLikes = data!.map(post => ({
          ...post,
          user: userData,
          has_liked: likedPostIds.has(post.id),
        }));

        setPosts(postsWithUserAndLikes);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim() || !currentUser) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          content: newPostContent.trim(),
          visibility: 'public',
        })
        .select(
          `
          *,
          user:users(id, name, username, avatar_url)
        `
        )
        .single();

      if (error) throw error;

      setPosts([data, ...posts]);
      setNewPostContent('');
      toast.success('Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleLike = async (post: Post) => {
    if (!currentUser) {
      toast.error('Please sign in to like posts');
      return;
    }

    try {
      if (post.has_liked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);

        setPosts(
          posts.map(p =>
            p.id === post.id ? { ...p, likes_count: p.likes_count - 1, has_liked: false } : p
          )
        );
      } else {
        // Like
        await supabase.from('post_likes').insert({
          post_id: post.id,
          user_id: currentUser.id,
        });

        setPosts(
          posts.map(p =>
            p.id === post.id ? { ...p, likes_count: p.likes_count + 1, has_liked: true } : p
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const loadComments = async (postId: string) => {
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch user information for each comment
        const userIds = [...new Set(data.map(comment => comment.user_id))];
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, username, avatar_url')
          .in('id', userIds);

        const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);

        const commentsWithUsers = data.map(comment => ({
          ...comment,
          user: usersMap.get(comment.user_id),
        }));

        setComments(commentsWithUsers);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const createComment = async () => {
    if (!newComment.trim() || !currentUser || !selectedPost) return;

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: selectedPost.id,
          user_id: currentUser.id,
          content: newComment.trim(),
        })
        .select('*')
        .single();

      if (error) throw error;

      // Add the comment with user data
      const commentWithUser = {
          ...data,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username || currentUser.display_name,
          avatar_url: currentUser.avatar_url,
        },
      };

      setComments([commentWithUser, ...comments]);
      setNewComment('');

      // Update comment count
      setPosts(
        posts.map(p =>
          p.id === selectedPost.id ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );

      toast.success('Comment added');
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', currentUser?.id);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
      toast.success('Post deleted');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center py-8'>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Create Post */}
      {isOwnProfile && (
        <Card>
          <CardContent className='p-4'>
            <div className='flex gap-3'>
              <Avatar className='h-10 w-10'>
                <AvatarImage src={currentUser?.avatar_url} />
                <AvatarFallback>{currentUser?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <Textarea
                  placeholder="What's on your mind?"
                  value={newPostContent}
                  onChange={e => setNewPostContent((e.target as HTMLInputElement).value)}
                  className='min-h-[80px] resize-none'
                />
                <div className='flex justify-between items-center mt-3'>
                  <Button variant='ghost' size='sm'>
                    <ImageIcon className='h-4 w-4 mr-2' />
                    Add Image
                  </Button>
                  <Button onClick={createPost} disabled={!newPostContent.trim() || isCreating}>
                    {isCreating ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      {posts.length > 0 ? (
        <div className='space-y-4'>
          {posts.map(post => (
            <Card key={post.id}>
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={post.user?.avatar_url} />
                      <AvatarFallback>{post.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className='flex items-center gap-2'>
                        <h4 className='font-semibold'>{post.user?.name || post.user?.username}</h4>
                        {post.is_pinned && (
                          <Badge variant='secondary' className='text-xs'>
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <Button variant='ghost' size='icon' onClick={() => deletePost(post.id)}>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                <p className='whitespace-pre-wrap mb-4'>{post.content}</p>

                {/* Post Actions */}
                <div className='flex items-center gap-4 pt-3 border-t'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => toggleLike(post)}
                    className={post.has_liked ? 'text-red-500' : ''}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${post.has_liked ? 'fill-current' : ''}`} />
                    {post.likes_count}
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setSelectedPost(post);
                          loadComments(post.id);
                        }}
                      >
                        <MessageSquare className='h-4 w-4 mr-1' />
                        {post.comments_count}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
                      <DialogHeader>
                        <DialogTitle>Comments</DialogTitle>
                      </DialogHeader>

                      {/* Add Comment */}
                      {currentUser && (
                        <div className='flex gap-3 mb-4'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage src={currentUser.avatar_url} />
                            <AvatarFallback>{currentUser.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className='flex-1 flex gap-2'>
                            <Textarea
                              placeholder='Write a comment...'
                              value={newComment}
                              onChange={e => setNewComment((e.target as HTMLInputElement).value)}
                              className='min-h-[60px] resize-none'
                            />
                            <Button
                              size='icon'
                              onClick={createComment}
                              disabled={!newComment.trim()}
                            >
                              <Send className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Comments List */}
                      {isLoadingComments ? (
                        <div className='flex justify-center py-4'>
                          <LoadingSpinner />
                        </div>
                      ) : comments.length > 0 ? (
                        <div className='space-y-4'>
                          {comments.map(comment => (
                            <div key={comment.id} className='flex gap-3'>
                              <Avatar className='h-8 w-8'>
                                <AvatarImage src={comment.user?.avatar_url} />
                                <AvatarFallback>
                                  {comment.user?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className='flex-1'>
                                <div className='bg-muted rounded-lg p-3'>
                                  <p className='font-semibold text-sm'>
                                    {comment.user?.name || comment.user?.username}
                                  </p>
                                  <p className='text-sm mt-1'>{comment.content}</p>
                                </div>
                                <p className='text-xs text-muted-foreground mt-1'>
                                  {formatDistanceToNow(new Date(comment.created_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className='text-center text-muted-foreground py-4'>No comments yet</p>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button variant='ghost' size='sm'>
                    <Share2 className='h-4 w-4 mr-1' />
                    {post.shares_count}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className='text-center py-12'>
            <MessageSquare className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>No posts yet</h3>
            <p className='text-muted-foreground'>
              {isOwnProfile
                ? 'Share your thoughts with your followers'
                : `${username} hasn't posted anything yet`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PostsTab;
