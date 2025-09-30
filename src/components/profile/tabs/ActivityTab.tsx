import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Heart,
  MessageSquare,
  Calendar,
  ShoppingBag,
  Users,
  Star,
  Clock,
  MapPin,
  User,
  Loader2,
  DollarSign,
  Package,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ActivityItem {
  id: string;
  type:
    | 'like'
    | 'comment'
    | 'event_created'
    | 'event_joined'
    | 'product_purchased'
    | 'community_joined'
    | 'follow'
    | 'review';
  title: string;
  description: string;
  timestamp: string;
  relatedItem?: {
    id: string | undefined;
    title: string;
    type: 'event' | 'product' | 'community' | 'user';
    image?: string | undefined;
  };
  metadata?: Record<string, any>;
}

interface ActivityTabProps {
  userId: string;
  isOwnProfile: boolean;
  username: string;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ userId, isOwnProfile, username }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadUserActivities();
  }, [userId]);

  const loadUserActivities = async () => {
    setIsLoading(true);
    try {
      // Load different types of activities
      const [eventsData, communitiesData, ordersData, followingData, postsData] = await Promise.all(
        [
          loadEventActivities(),
          loadCommunityActivities(),
          loadPurchaseActivities(),
          loadSocialActivities(),
          loadPostsActivities(),
        ]
      );

      // Combine and sort activities by timestamp
      const allActivities = [
          ...eventsData,
          ...communitiesData,
          ...ordersData,
          ...followingData,
          ...postsData,
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Failed to load activity data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventActivities = async (): Promise<ActivityItem[]> => {
    try {
      // Load created events
      const { data: createdEvents, error: createdError } = await supabase
        .from('events')
        .select('id, title, created_at, image_url')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (createdError) throw createdError;

      // Load event registrations
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select(
          `
          id, 
          created_at,
          events (
            id,
            title,
            image_url
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (regError) throw regError;

      const activities: ActivityItem[] = [];

      // Add created events
      createdEvents?.forEach((event: any) => {
        activities.push({
          id: `event_created_${event.id}`,
          type: 'event_created',
          title: 'Created an event',
          description: event.title,
          timestamp: event.created_at,
          relatedItem: {
            id: event.id,
            title: event.title,
            type: 'event',
            image: event.image_url,
          },
        });
      });

      // Add event registrations
      registrations?.forEach((reg: any) => {
        if (reg.events) {
          activities.push({
            id: `event_joined_${reg.id}`,
            type: 'event_joined',
            title: 'Registered for event',
            description: reg.events.title,
            timestamp: reg.created_at,
            relatedItem: {
              id: reg.events.id,
              title: reg.events.title,
              type: 'event',
              image: reg.events.image_url,
            },
          });
        }
      });

      return activities;
    } catch (error) {
      console.error('Error loading event activities:', error);
      return [];
    }
  };

  const loadCommunityActivities = async (): Promise<ActivityItem[]> => {
    try {
      const { data: memberships, error } = await supabase
        .from('community_members')
        .select(
          `
          id,
          joined_at,
          communities (
            id,
            name,
            image_url
          )
        `
        )
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (
        memberships?.map((membership: any) => ({
          id: `community_joined_${membership.id}`,
          type: 'community_joined' as const,
          title: 'Joined community',
          description: membership.communities?.name || 'Unknown Community',
          timestamp: membership.joined_at,
          relatedItem: {
            id: membership.communities?.id || '',
            title: membership.communities?.name || 'Unknown Community',
            type: 'community' as const,
            image: membership.communities?.image_url,
          },
        })) || []
      );
    } catch (error) {
      console.error('Error loading community activities:', error);
      return [];
    }
  };

  const loadPurchaseActivities = async (): Promise<ActivityItem[]> => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          created_at,
          total_amount,
          order_items (
            quantity,
            products (
              id,
              title,
              image_url
            )
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (
        orders?.map((order: any) => {
          const firstItem = order.order_items?.[0];
          const product = firstItem?.products;

          return {
            id: `purchase_${order.id}`,
            type: 'product_purchased' as const,
            title: 'Purchased product',
            description: product?.title || 'Product',
            timestamp: order.created_at,
            relatedItem: product
              ? {
                  id: product.id,
                  title: product.title,
                  type: 'product' as const,
                  image: product.image_url,
                }
              : undefined,
            metadata: {
              amount: order.total_amount,
              itemCount: order.order_items?.length || 0,
            },
          };
        }) || []
      );
    } catch (error) {
      console.error('Error loading purchase activities:', error);
      return [];
    }
  };

  const loadSocialActivities = async (): Promise<ActivityItem[]> => {
    try {
      const { data: following, error } = await supabase
        .from('user_follows')
        .select(
          `
          id,
          created_at,
          followed:users!user_follows_followed_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `
        )
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (
        following?.map((follow: any) => ({
          id: `follow_${follow.id}`,
          type: 'follow' as const,
          title: 'Started following',
          description: follow.followed?.name || follow.followed?.username || 'User',
          timestamp: follow.created_at,
          relatedItem: {
            id: follow.followed?.id || '',
            title: follow.followed?.name || follow.followed?.username || 'User',
            type: 'user' as const,
            image: follow.followed?.avatar_url,
          },
        })) || []
      );
    } catch (error) {
      console.error('Error loading social activities:', error);
      return [];
    }
  };

  const loadPostsActivities = async (): Promise<ActivityItem[]> => {
    try {
      // Load user posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, content, created_at, likes_count, comments_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) throw postsError;

      // Load recent likes on user's posts
      const { data: likes, error: likesError } = await supabase
        .from('post_likes')
        .select(
          `
          id,
          created_at,
          post_id,
          posts!inner (
            id,
            content,
            user_id
          )
        `
        )
        .eq('posts.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (likesError) throw likesError;

      // Load recent comments on user's posts
      const { data: comments, error: commentsError } = await supabase
        .from('post_comments')
        .select(
          `
          id,
          content,
          created_at,
          post_id,
          posts!inner (
            id,
            content,
            user_id
          )
        `
        )
        .eq('posts.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (commentsError) throw commentsError;

      const activities: ActivityItem[] = [];

      // Add post creation activities
      posts?.forEach((post: any) => {
        activities.push({
          id: `post_${post.id}`,
          type: 'post_created' as const,
          title: 'Created a post',
          description:
            post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content,
          timestamp: post.created_at,
          metadata: {
            likes: post.likes_count,
            comments: post.comments_count,
          },
        });
      });

      // Add like activities
      likes?.forEach((like: any) => {
        activities.push({
          id: `like_received_${like.id}`,
          type: 'like_received' as const,
          title: 'Received a like',
          description: 'Someone liked your post',
          timestamp: like.created_at,
          relatedItem: {
            id: like.posts.id,
            title:
              like.posts.content.length > 50
                ? `${like.posts.content.substring(0, 50)}...`
                : like.posts.content,
            type: 'post' as const,
          },
        });
      });

      // Add comment activities
      comments?.forEach((comment: any) => {
        activities.push({
          id: `comment_received_${comment.id}`,
          type: 'comment_received' as const,
          title: 'Received a comment',
          description:
            comment.content.length > 50
              ? `${comment.content.substring(0, 50)}...`
              : comment.content,
          timestamp: comment.created_at,
          relatedItem: {
            id: comment.posts.id,
            title:
              comment.posts.content.length > 50
                ? `${comment.posts.content.substring(0, 50)}...`
                : comment.posts.content,
            type: 'post' as const,
          },
        });
      });

      return activities;
    } catch (error) {
      console.error('Error loading posts activities:', error);
      return [];
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'like':
        return <Heart className='h-4 w-4 text-red-500' />;
      case 'comment':
        return <MessageSquare className='h-4 w-4 text-blue-500' />;
      case 'event_created':
      case 'event_joined':
        return <Calendar className='h-4 w-4 text-green-500' />;
      case 'product_purchased':
        return <ShoppingBag className='h-4 w-4 text-purple-500' />;
      case 'community_joined':
        return <Users className='h-4 w-4 text-orange-500' />;
      case 'follow':
        return <User className='h-4 w-4 text-indigo-500' />;
      case 'review':
        return <Star className='h-4 w-4 text-yellow-500' />;
      case 'post_created':
        return <MessageSquare className='h-4 w-4 text-blue-600' />;
      case 'like_received':
        return <Heart className='h-4 w-4 text-red-500' />;
      case 'comment_received':
        return <MessageSquare className='h-4 w-4 text-green-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'like':
        return 'bg-red-50 border-red-200';
      case 'comment':
        return 'bg-blue-50 border-blue-200';
      case 'event_created':
      case 'event_joined':
        return 'bg-green-50 border-green-200';
      case 'product_purchased':
        return 'bg-purple-50 border-purple-200';
      case 'community_joined':
        return 'bg-orange-50 border-orange-200';
      case 'follow':
        return 'bg-indigo-50 border-indigo-200';
      case 'review':
        return 'bg-yellow-50 border-yellow-200';
      case 'post_created':
        return 'bg-blue-50 border-blue-200';
      case 'like_received':
        return 'bg-red-50 border-red-200';
      case 'comment_received':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filterActivities = (activities: ActivityItem[], filter: string) => {
    if (filter === 'all') return activities;

    const filterMap: Record<string, ActivityItem['type'][]> = {
      social: ['like', 'comment', 'follow'],
      events: ['event_created', 'event_joined'],
      purchases: ['product_purchased'],
      communities: ['community_joined'],
    };

    return activities.filter(activity => filterMap[filter]?.includes(activity.type));
  };

  const filteredActivities = filterActivities(activities, activeTab);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-500' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            {isOwnProfile ? 'Your Activity' : `${username}'s Activity`}
          </h3>
          <p className='text-sm text-gray-600'>Recent actions and interactions</p>
        </div>
        <Badge variant='secondary' className='text-xs'>
          {activities.length} activities
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='social'>Social</TabsTrigger>
          <TabsTrigger value='events'>Events</TabsTrigger>
          <TabsTrigger value='purchases'>Purchases</TabsTrigger>
          <TabsTrigger value='communities'>Communities</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='mt-6'>
          {filteredActivities.length === 0 ? (
            <div className='text-center py-12'>
              <Activity className='h-12 w-12 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>No Activity Yet</h3>
              <p className='text-gray-500'>
                {isOwnProfile
                  ? 'Your activities will appear here as you interact with the platform.'
                  : `${username} hasn't been active recently.`}
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredActivities.map(activity => (
                <Card
                  key={activity.id}
                  className={`${getActivityColor(activity.type)} transition-colors hover:shadow-md`}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <div className='flex-shrink-0 mt-1'>{getActivityIcon(activity.type)}</div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <p className='text-sm font-medium text-gray-900'>{activity.title}</p>
                            <p className='text-sm text-gray-600 mt-1'>{activity.description}</p>

                            {activity.metadata && (
                              <div className='flex items-center gap-4 mt-2 text-xs text-gray-500'>
                                {activity.metadata.amount && (
                                  <span className='flex items-center gap-1'>
                                    <DollarSign className='h-3 w-3' />${activity.metadata.amount}
                                  </span>
                                )}
                                {activity.metadata.itemCount && (
                                  <span className='flex items-center gap-1'>
                                    <Package className='h-3 w-3' />
                                    {activity.metadata.itemCount} items
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {activity.relatedItem?.image && (
                            <div className='flex-shrink-0 ml-3'>
                              <img
                                src={activity.relatedItem.image}
                                alt={activity.relatedItem.title}
                                className='h-12 w-12 rounded-lg object-cover'
                              />
                            </div>
                          )}
                        </div>

                        <div className='flex items-center justify-between mt-3'>
                          <div className='flex items-center gap-1 text-xs text-gray-500'>
                            <Clock className='h-3 w-3' />
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </div>

                          {activity.relatedItem && (
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-xs h-6 px-2'
                              onClick={() => {
                                // Navigate to related item
                                const { type, id } = activity.relatedItem!;
                                if (type === 'event') {
                                  window.open(`/events/${id}`, '_blank');
                                } else if (type === 'product') {
                                  window.open(`/products/${id}`, '_blank');
                                } else if (type === 'community') {
                                  window.open(`/communities/${id}`, '_blank');
                                } else if (type === 'user') {
                                  window.open(`/profile/${id}`, '_blank');
                                }
                              }}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActivityTab;
