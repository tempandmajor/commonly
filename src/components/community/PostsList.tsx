import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ClickableAvatar } from '@/components/ui/clickable-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Send,
  Heart,
  Share2,
  Pin,
  Edit,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

interface Post {
  id: string;
  title?: string | undefined;
  content: string;
  image_url?: string | undefined;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  user?: {
    id: string | undefined;
    name?: string | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
  };
}

interface PostsListProps {
  posts: Post[];
  isLoading: boolean;
  canPost: boolean;
  isOwner: boolean;
  onCreatePost: (data: { title?: string | undefined; content: string }) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onTogglePin: (postId: string, isPinned: boolean) => Promise<void>;
}

const PostsList: React.FC<PostsListProps> = ({
  posts,
  isLoading,
  canPost,
  isOwner,
  onCreatePost,
  onDeletePost,
  onTogglePin,
}) => {
  const { user } = useAuth();
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const handleCreatePost = useCallback(async () => {
    if (!newPostContent.trim()) return;

    try {
      setIsCreatingPost(true);
      await onCreatePost({
        title: newPostTitle.trim() || undefined,
        content: newPostContent.trim(),
      });
      setNewPostContent('');
      setNewPostTitle('');
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsCreatingPost(false);
    }
  }, [newPostContent, newPostTitle, onCreatePost]);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      await onDeletePost(postId);
      toast.success('Post deleted successfully!');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  }, [onDeletePost]);

  const handleTogglePin = useCallback(async (postId: string, isPinned: boolean) => {
    try {
      await onTogglePin(postId, isPinned);
      toast.success(isPinned ? 'Post unpinned' : 'Post pinned');
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      toast.error('Failed to update post');
    }
  }, [onTogglePin]);

  return (
    <div className='space-y-6'>
      {/* Create Post */}
      {canPost && (
        <Card className='border-0 bg-white/50 backdrop-blur-sm'>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Input
                placeholder='Post title (optional)'
                value={newPostTitle}
                onChange={(e) => setNewPostTitle((e.target as HTMLInputElement).value)}
                className='border-gray-300'
              />
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={3}
                className='border-gray-300'
              />
              <div className='flex justify-between items-center'>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' className='border-gray-300'>
                    <ImageIcon className='w-4 h-4 mr-2' />
                    Photo
                  </Button>
                  <Button variant='outline' size='sm' className='border-gray-300'>
                    <Upload className='w-4 h-4 mr-2' />
                    File
                  </Button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || isCreatingPost}
                  className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                >
                  <Send className='w-4 h-4 mr-2' />
                  {isCreatingPost ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      <div className='space-y-4'>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className='border-0 bg-white/50 backdrop-blur-sm'>
              <CardContent className='p-6'>
                <div className='flex items-start gap-3'>
                  <Skeleton className='w-10 h-10 rounded-full' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-1/4' />
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-3/4' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : posts.length === 0 ? (
          <div className='text-center py-12'>
            <MessageSquare className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>No posts yet</h3>
            <p className='text-gray-600'>
              Be the first to share something with the community!
            </p>
          </div>
        ) : (
          posts.map(post => (
            <Card key={post.id} className='border-0 bg-white/50 backdrop-blur-sm'>
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-start gap-3'>
                    <ClickableAvatar
                      userId={post.user?.id}
                      avatarUrl={post.user?.avatar_url}
                      displayName={post.user?.display_name || post.user?.name || 'User'}
                      size='lg'
                    />
                    <div>
                      <div className='flex items-center gap-2'>
                        <h4 className='font-medium text-gray-900'>
                          {post.user?.display_name || post.user?.name || 'Anonymous'}
                        </h4>
                        {post.is_pinned && (
                          <Pin className='w-4 h-4 text-purple-600' />
                        )}
                      </div>
                      <p className='text-sm text-gray-600'>
                        {formatDistanceToNow(new Date(post.created_at))} ago
                      </p>
                    </div>
                  </div>

                  {(isOwner || post.user_id === user?.id) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <MoreVertical className='w-4 h-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {isOwner && (
                          <DropdownMenuItem
                            onClick={() => handleTogglePin(post.id, post.is_pinned)}
                          >
                            <Pin className='w-4 h-4 mr-2' />
                            {post.is_pinned ? 'Unpin' : 'Pin'} Post
                          </DropdownMenuItem>
                        )}
                        {post.user_id === user?.id && (
                          <DropdownMenuItem>
                            <Edit className='w-4 h-4 mr-2' />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {(isOwner || post.user_id === user?.id) && (
                          <DropdownMenuItem
                            onClick={() => handleDeletePost(post.id)}
                            className='text-red-600 focus:text-red-600'
                          >
                            <Trash2 className='w-4 h-4 mr-2' />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {post.title && (
                  <h3 className='font-semibold text-lg text-gray-900 mb-2'>
                    {post.title}
                  </h3>
                )}

                <p className='text-gray-700 mb-4 whitespace-pre-wrap'>{post.content}</p>

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt='Post image'
                    className='w-full h-64 object-cover rounded-lg mb-4'
                  />
                )}

                <div className='flex items-center gap-4 text-sm text-gray-600'>
                  <Button variant='ghost' size='sm' className='flex items-center gap-1 hover:bg-gray-100'>
                    <Heart className='w-4 h-4' />
                    {post.likes_count}
                  </Button>
                  <Button variant='ghost' size='sm' className='flex items-center gap-1 hover:bg-gray-100'>
                    <MessageSquare className='w-4 h-4' />
                    {post.comments_count}
                  </Button>
                  <Button variant='ghost' size='sm' className='hover:bg-gray-100'>
                    <Share2 className='w-4 h-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PostsList;