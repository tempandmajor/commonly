import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Image as ImageIcon,
  Video,
  Hash,
  AtSign,
  MoreHorizontal,
  Users,
  TrendingUp,
  Bell,
  Search,
  Plus,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import Footer from '@/components/layout/Footer';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  realSocialFeaturesService,
  SocialPost,
  RecommendedUser,
  SocialNotification,
  TrendingTag,
  UserSocialStats,
} from '@/services/realSocialFeaturesService';

const SocialFeed = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedPosts, setFeedPosts] = useState<SocialPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'notifications'>('feed');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [userStats, setUserStats] = useState<UserSocialStats>({
    posts_count: 0,
    followers_count: 0,
    following_count: 0,
    likes_received_count: 0,
    likes_given_count: 0,
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadFeedData();
    }
  }, [isAuthenticated, user]);

  const loadFeedData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [posts, recommended, userNotifications, trending, stats] = await Promise.all([
        realSocialFeaturesService.getFeedPosts(user.id, 20),
        realSocialFeaturesService.getRecommendedUsers(user.id, 5),
        realSocialFeaturesService.getUserNotifications(user.id, 10),
        realSocialFeaturesService.getTrendingTags(6),
        realSocialFeaturesService.getUserSocialStats(user.id),
      ]);

      setFeedPosts(posts);
      setRecommendedUsers(recommended);
      setNotifications(userNotifications);
      setTrendingTags(trending);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading feed data:', error);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;

    try {
      setIsCreatingPost(true);
      const newPost = await realSocialFeaturesService.createPost({
        creator_id: user.id,
        content: newPostContent,
        tags: extractTags(newPostContent),
        mentions: extractMentions(newPostContent),
      });

      if (newPost) {
        setFeedPosts(prev => [newPost, ...prev]);
        setNewPostContent('');
        toast.success('Post created successfully!');
      } else {
        toast.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.is_liked) {
        await realSocialFeaturesService.unlikePost(user.id, postId);
        setFeedPosts(prev =>
          prev.map(p =>
            p.id === postId ? { ...p, is_liked: false, likes_count: p.likes_count - 1 } : p
          )
        );
      } else {
        await realSocialFeaturesService.likePost(user.id, postId);
        setFeedPosts(prev =>
          prev.map(p =>
            p.id === postId ? { ...p, is_liked: true, likes_count: p.likes_count + 1 } : p
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleFollowUser = async (userId: string) => {
    if (!user) return;

    try {
      await realSocialFeaturesService.followUser(user.id, userId);
      setRecommendedUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User followed successfully!');
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const extractTags = (content: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInMs = now.getTime() - postDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d`;
    } else {
      return postDate.toLocaleDateString();
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <main className='flex-1 container mx-auto px-4 py-8'>
          <Card className='max-w-xl mx-auto text-center'>
            <CardContent className='py-12'>
              <h2 className='text-2xl font-bold mb-4'>Join the Community</h2>
              <p className='text-muted-foreground mb-6'>
                Please log in to access your social feed and connect with others.
              </p>
              <Button onClick={() => (window.location.href = '/login')}>Log In</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <main className='flex-1 container mx-auto px-4 py-8'>
          <div className='flex justify-center'>
            <LoadingSpinner />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className='flex-1 container mx-auto px-4 py-8 max-w-6xl'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <Users className='w-8 h-8' />
            Social Feed
          </h1>
          <p className='text-muted-foreground mt-2'>
            Connect with your community and discover what's happening
          </p>
        </div>

        {/* Tab Navigation */}
        <div className='flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit'>
          <Button
            variant={activeTab === 'feed' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setActiveTab('feed')}
            className='rounded-md'
          >
            <Users className='w-4 h-4 mr-2' />
            Feed
          </Button>
          <Button
            variant={activeTab === 'discover' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setActiveTab('discover')}
            className='rounded-md'
          >
            <TrendingUp className='w-4 h-4 mr-2' />
            Discover
          </Button>
          <Button
            variant={activeTab === 'notifications' ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setActiveTab('notifications')}
            className='rounded-md relative'
          >
            <Bell className='w-4 h-4 mr-2' />
            Notifications
            {notifications.filter(n => !n.is_read).length > 0 && (
              <Badge
                variant='destructive'
                className='absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs'
              >
                {notifications.filter(n => !n.is_read).length}
              </Badge>
            )}
          </Button>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-3'>
            {activeTab === 'feed' && (
              <div className='space-y-6'>
                {/* Create Post */}
                <Card>
                  <CardContent className='p-4'>
                    <div className='flex space-x-3'>
                      <Avatar>
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1 space-y-3'>
                        <Textarea
                          placeholder="What's on your mind?"
                          value={newPostContent}
                          onChange={e => setNewPostContent((e.target as HTMLInputElement).value)}
                          className='min-h-[80px] resize-none'
                        />
                        <div className='flex items-center justify-between'>
                          <div className='flex space-x-2'>
                            <Button variant='ghost' size='sm'>
                              <ImageIcon className='w-4 h-4' />
                            </Button>
                            <Button variant='ghost' size='sm'>
                              <Video className='w-4 h-4' />
                            </Button>
                            <Button variant='ghost' size='sm'>
                              <Hash className='w-4 h-4' />
                            </Button>
                            <Button variant='ghost' size='sm'>
                              <AtSign className='w-4 h-4' />
                            </Button>
                          </div>
                          <Button
                            onClick={handleCreatePost}
                            disabled={!newPostContent.trim() || isCreatingPost}
                            className='bg-black hover:bg-gray-800 text-white'
                          >
                            {isCreatingPost ? (
                              <LoadingSpinner className='w-4 h-4' />
                            ) : (
                              <Send className='w-4 h-4' />
                            )}
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feed Posts */}
                <div className='space-y-6'>
                  {feedPosts.map(post => (
                    <Card key={post.id}>
                      <CardContent className='p-6'>
                        {/* Post Header */}
                        <div className='flex items-start justify-between mb-4'>
                          <div className='flex space-x-3'>
                            <Avatar>
                              <AvatarImage src={post.creator.avatar_url} />
                              <AvatarFallback>
                                {post.creator.display_name?.[0] || post.creator.name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className='flex items-center space-x-2'>
                                <span className='font-semibold'>
                                  {post.creator.display_name || post.creator.name}
                                </span>
                                {post.creator.is_verified && (
                                  <Badge variant='secondary' className='text-xs'>
                                    ✓ Verified
                                  </Badge>
                                )}
                              </div>
                              <span className='text-sm text-muted-foreground'>
                                {formatTimeAgo(post.created_at)}
                              </span>
                            </div>
                          </div>
                          <Button variant='ghost' size='sm'>
                            <MoreHorizontal className='w-4 h-4' />
                          </Button>
                        </div>

                        {/* Post Content */}
                        <div className='mb-4'>
                          <p className='text-gray-900 whitespace-pre-wrap'>{post.content}</p>
                          {post.image_url && (
                            <img
                              src={post.image_url}
                              alt='Post content'
                              className='mt-3 rounded-lg max-w-full h-auto'
                            />
                          )}
                          {post.tags && post.tags.length > 0 && (
                            <div className='flex flex-wrap gap-2 mt-3'>
                              {post.tags.map((tag, index) => (
                                <Badge key={index} variant='secondary' className='text-xs'>
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Post Actions */}
                        <div className='flex items-center justify-between pt-3 border-t'>
                          <div className='flex space-x-6'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleLikePost(post.id)}
                              className={post.is_liked ? 'text-destructive' : ''}
                            >
                              <Heart
                                className={`w-4 h-4 mr-2 ${post.is_liked ? 'fill-current' : ''}`}
                              />
                              {post.likes_count}
                            </Button>
                            <Button variant='ghost' size='sm'>
                              <MessageCircle className='w-4 h-4 mr-2' />
                              {post.comments_count}
                            </Button>
                            <Button variant='ghost' size='sm'>
                              <Share2 className='w-4 h-4 mr-2' />
                              {post.shares_count}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {feedPosts.length === 0 && (
                    <Card>
                      <CardContent className='py-12 text-center'>
                        <Users className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                        <h3 className='text-lg font-semibold mb-2'>Your feed is empty</h3>
                        <p className='text-muted-foreground mb-4'>
                          Follow some users to see their posts in your feed
                        </p>
                        <Button onClick={() => setActiveTab('discover')}>Discover People</Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'discover' && (
              <div className='space-y-6'>
                <Card>
                  <CardHeader>
                    <h3 className='text-lg font-semibold'>Suggested for you</h3>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {recommendedUsers.map(suggestedUser => (
                        <div
                          key={suggestedUser.id}
                          className='flex items-center justify-between p-4 border rounded-lg'
                        >
                          <div className='flex items-center space-x-3'>
                            <Avatar>
                              <AvatarImage src={suggestedUser.avatar_url} />
                              <AvatarFallback>
                                {suggestedUser.display_name?.[0] || suggestedUser.name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className='flex items-center space-x-2'>
                                <span className='font-medium'>
                                  {suggestedUser.display_name || suggestedUser.name}
                                </span>
                                {suggestedUser.is_verified && (
                                  <Badge variant='secondary' className='text-xs'>
                                    ✓
                                  </Badge>
                                )}
                              </div>
                              <p className='text-sm text-muted-foreground'>
                                {suggestedUser.follower_count} followers
                              </p>
                              {suggestedUser.bio && (
                                <p className='text-sm text-muted-foreground mt-1'>
                                  {suggestedUser.bio.substring(0, 60)}...
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            size='sm'
                            onClick={() => handleFollowUser(suggestedUser.id)}
                            className='bg-black hover:bg-gray-800 text-white'
                          >
                            <UserPlus className='w-4 h-4 mr-2' />
                            Follow
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className='space-y-4'>
                {notifications.map(notification => (
                  <Card
                    key={notification.id}
                    className={!notification.is_read ? 'border-primary bg-primary/10' : ''}
                  >
                    <CardContent className='p-4'>
                      <div className='flex items-start space-x-3'>
                        {notification.actor?.avatar_url && (
                          <Avatar className='w-8 h-8'>
                            <AvatarImage src={notification.actor.avatar_url} />
                            <AvatarFallback>
                              {notification.actor.display_name?.[0] ||
                                notification.actor.name?.[0] ||
                                'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className='flex-1'>
                          <p className='text-sm'>
                            <span className='font-medium'>
                              {notification.actor?.display_name ||
                                notification.actor?.name ||
                                'Someone'}
                            </span>{' '}
                            {notification.message}
                          </p>
                          <span className='text-xs text-muted-foreground'>
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>
                        {!notification.is_read && (
                          <div className='w-2 h-2 bg-primary rounded-full'></div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {notifications.length === 0 && (
                  <Card>
                    <CardContent className='py-12 text-center'>
                      <Bell className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                      <h3 className='text-lg font-semibold mb-2'>No notifications yet</h3>
                      <p className='text-muted-foreground'>
                        When people interact with your content, you'll see it here
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <h3 className='text-lg font-semibold'>Trending</h3>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {trendingTags.length > 0 ? (
                    trendingTags.map((tag, index) => (
                      <div key={index} className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>#{tag.tag}</span>
                        <span className='text-xs text-muted-foreground'>
                          {tag.post_count} posts
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className='text-sm text-muted-foreground'>No trending tags yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <h3 className='text-lg font-semibold'>Your Activity</h3>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>Posts</span>
                    <span className='font-semibold'>{userStats.posts_count}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>Followers</span>
                    <span className='font-semibold'>{userStats.followers_count}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>Following</span>
                    <span className='font-semibold'>{userStats.following_count}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>Likes Received</span>
                    <span className='font-semibold'>{userStats.likes_received_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default SocialFeed;
