import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Plus,
  Crown,
  Lock,
  Globe,
  Calendar,
  MessageSquare,
  Loader2,
  Search,
  Filter,
  TrendingUp,
  UserPlus,
  Settings,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Community {
  id: string;
  name: string;
  description: string;
  image_url?: string | undefined;
  banner_url?: string | undefined;
  is_private: boolean;
  member_count: number;
  created_at: string;
  creator_id: string;
  category: string;
  is_member?: boolean | undefined;
  is_admin?: boolean | undefined;
  role?: 'member' | undefined| 'moderator' | 'admin' | 'owner';
  joined_at?: string | undefined;
}

interface CommunitiesTabProps {
  userId: string;
  isOwnProfile: boolean;
  username: string;
}

const CommunitiesTab: React.FC<CommunitiesTabProps> = ({ userId, isOwnProfile, username }) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [ownedCommunities, setOwnedCommunities] = useState<Community[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('joined');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCommunitiesData();
  }, [userId]);

  const loadCommunitiesData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadJoinedCommunities(),
        loadOwnedCommunities(),
        loadSuggestedCommunities(),
      ]);
    } catch (error) {
      console.error('Error loading communities data:', error);
      toast.error('Failed to load communities data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadJoinedCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(
          `
          id,
          role,
          joined_at,
          communities (
            id,
            name,
            description,
            image_url,
            banner_url,
            is_private,
            member_count,
            created_at,
            creator_id,
            category
          )
        `
        )
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const communitiesWithMembership =
        data
          ?.map(membership => ({
          ...membership.communities,
            role: membership.role,
            joined_at: membership.joined_at,
            is_member: true,
            is_admin: membership.role === 'admin' || membership.role === 'owner',
          }))
          .filter(community => community.id) || [];

      setCommunities(communitiesWithMembership as Community[]);
    } catch (error) {
      console.error('Error loading joined communities:', error);
      setCommunities([]);
    }
  };

  const loadOwnedCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ownedWithRole =
        data?.map(community => ({
          ...community,
          role: 'owner' as const,
          is_member: true,
          is_admin: true,
        })) || [];

      setOwnedCommunities(ownedWithRole);
    } catch (error) {
      console.error('Error loading owned communities:', error);
      setOwnedCommunities([]);
    }
  };

  const loadSuggestedCommunities = async () => {
    try {
      // Get communities the user hasn't joined yet
      const { data: joinedIds } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId);

      const joinedCommunityIds = joinedIds?.map(item => item.community_id) || [];

      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .not('id', 'in', `(${joinedCommunityIds.join(',') || 'null'})`)
        .eq('is_private', false)
        .order('member_count', { ascending: false })
        .limit(6);

      if (error) throw error;

      const suggestedWithMembership =
        data?.map(community => ({
          ...community,
          is_member: false,
          is_admin: false,
        })) || [];

      setSuggestedCommunities(suggestedWithMembership);
    } catch (error) {
      console.error('Error loading suggested communities:', error);
      setSuggestedCommunities([]);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to join communities');
        return;
      }

      const { error } = await supabase.from('community_members').insert({
        community_id: communityId,
        user_id: user.id,
        role: 'member',
      });

      if (error) throw error;

      toast.success('Successfully joined community!');

      // Update the suggested communities list
      setSuggestedCommunities(prev =>
        prev.map(community =>
          community.id === communityId
            ? { ...community, is_member: true, member_count: community.member_count + 1 }
            : community
        )
      );

      // Reload joined communities
      loadJoinedCommunities();
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('Failed to join community');
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Left community');

      // Remove from joined communities
      setCommunities(prev => prev.filter(community => community.id !== communityId));

      // Reload suggested communities
      loadSuggestedCommunities();
    } catch (error) {
      console.error('Error leaving community:', error);
      toast.error('Failed to leave community');
    }
  };

  const handleCreateCommunity = () => {
    navigate('/create-community');
  };

  const handleCommunityClick = (communityId: string) => {
    navigate(`/communities/${communityId}`);
  };

  const handleManageCommunity = (communityId: string) => {
    navigate(`/communities/${communityId}/manage`);
  };

  const getCommunityIcon = (community: Community) => {
    if (community.role === 'owner') {
      return <Crown className='h-4 w-4 text-yellow-500' />;
    }
    if (community.is_admin) {
      return <Settings className='h-4 w-4 text-blue-500' />;
    }
    if (community.is_private) {
      return <Lock className='h-4 w-4 text-gray-500' />;
    }
    return <Globe className='h-4 w-4 text-green-500' />;
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;

    const roleColors = {
      owner: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-blue-100 text-blue-800',
      moderator: 'bg-purple-100 text-purple-800',
      member: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge
        className={`text-xs ${roleColors[role as keyof typeof roleColors] || roleColors.member}`}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

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
            {isOwnProfile ? 'Your Communities' : `${username}'s Communities`}
          </h3>
          <p className='text-sm text-gray-600'>
            {communities.length > 0
              ? `Member of ${communities.length} communities • Created ${ownedCommunities.length}`
              : 'No communities yet'}
          </p>
        </div>

        {isOwnProfile && (
          <Button onClick={handleCreateCommunity} className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Create Community
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='joined' className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Joined
            <Badge variant='secondary' className='text-xs'>
              {communities.length}
            </Badge>
          </TabsTrigger>

          {isOwnProfile && (
            <TabsTrigger value='owned' className='flex items-center gap-2'>
              <Crown className='h-4 w-4' />
              Created
              <Badge variant='secondary' className='text-xs'>
                {ownedCommunities.length}
              </Badge>
            </TabsTrigger>
          )}

          <TabsTrigger value='discover' className='flex items-center gap-2'>
            <Search className='h-4 w-4' />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value='joined' className='mt-6'>
          {communities.length === 0 ? (
            <div className='text-center py-12'>
              <Users className='h-16 w-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>No Communities Yet</h3>
              <p className='text-gray-500 mb-6'>
                {isOwnProfile
                  ? 'Join communities to connect with like-minded people.'
                  : `${username} hasn't joined any communities yet.`}
              </p>
              {isOwnProfile && (
                <Button
                  onClick={() => setActiveTab('discover')}
                  className='flex items-center gap-2'
                >
                  <Search className='h-4 w-4' />
                  Discover Communities
                </Button>
              )}
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {communities.map(community => (
                <Card
                  key={community.id}
                  className='group hover:shadow-lg transition-shadow cursor-pointer'
                >
                  <div className='relative' onClick={() => handleCommunityClick(community.id)}>
                    {community.banner_url ? (
                      <div className='h-32 overflow-hidden rounded-t-lg'>
                        <img
                          src={community.banner_url}
                          alt={community.name}
                          className='w-full h-full object-cover group-hover:scale-105 transition-transform'
                        />
                      </div>
                    ) : (
                      <div className='h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center'>
                        <Users className='h-12 w-12 text-white' />
                      </div>
                    )}

                    <div className='absolute top-2 right-2 flex items-center gap-1'>
                      {getCommunityIcon(community)}
                      {getRoleBadge(community.role)}
                    </div>
                  </div>

                  <CardContent className='p-4'>
                    <div className='space-y-2'>
                      <h4 className='font-semibold text-gray-900 line-clamp-1'>{community.name}</h4>
                      <p className='text-sm text-gray-600 line-clamp-2'>{community.description}</p>

                      <div className='flex items-center justify-between text-xs text-gray-500'>
                        <span className='flex items-center gap-1'>
                          <Users className='h-3 w-3' />
                          {community.member_count} members
                        </span>
                        <Badge variant='outline' className='text-xs'>
                          {community.category}
                        </Badge>
                      </div>

                      <div className='flex items-center justify-between pt-2'>
                        <span className='text-xs text-gray-500'>
                          Joined{' '}
                          {community.joined_at
                            ? formatDistanceToNow(new Date(community.joined_at), {
                                addSuffix: true,
                              })
                            : 'recently'}
                        </span>

                        <div className='flex items-center gap-1'>
                          {isOwnProfile && community.is_admin && (
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0'
                              onClick={e => {
                                e.stopPropagation();
                                handleManageCommunity(community.id);
                              }}
                            >
                              <Settings className='h-3 w-3' />
                            </Button>
                          )}

                          {isOwnProfile && community.role !== 'owner' && (
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-6 w-6 p-0 text-red-500 hover:text-red-700'
                              onClick={e => {
                                e.stopPropagation();
                                handleLeaveCommunity(community.id);
                              }}
                            >
                              <UserPlus className='h-3 w-3' />
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

        {isOwnProfile && (
          <TabsContent value='owned' className='mt-6'>
            {ownedCommunities.length === 0 ? (
              <div className='text-center py-12'>
                <Crown className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>No Communities Created</h3>
                <p className='text-gray-500 mb-6'>
                  Create your first community to bring people together around shared interests.
                </p>
                <Button onClick={handleCreateCommunity} className='flex items-center gap-2'>
                  <Plus className='h-4 w-4' />
                  Create Your First Community
                </Button>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {ownedCommunities.map(community => (
                  <Card
                    key={community.id}
                    className='group hover:shadow-lg transition-shadow cursor-pointer'
                  >
                    <div className='relative' onClick={() => handleCommunityClick(community.id)}>
                      {community.banner_url ? (
                        <div className='h-32 overflow-hidden rounded-t-lg'>
                          <img
                            src={community.banner_url}
                            alt={community.name}
                            className='w-full h-full object-cover group-hover:scale-105 transition-transform'
                          />
                        </div>
                      ) : (
                        <div className='h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center'>
                          <Users className='h-12 w-12 text-white' />
                        </div>
                      )}

                      <div className='absolute top-2 right-2'>
                        <Crown className='h-5 w-5 text-yellow-500' />
                      </div>
                    </div>

                    <CardContent className='p-4'>
                      <div className='space-y-2'>
                        <h4 className='font-semibold text-gray-900 line-clamp-1'>
                          {community.name}
                        </h4>
                        <p className='text-sm text-gray-600 line-clamp-2'>
                          {community.description}
                        </p>

                        <div className='flex items-center justify-between text-xs text-gray-500'>
                          <span className='flex items-center gap-1'>
                            <Users className='h-3 w-3' />
                            {community.member_count} members
                          </span>
                          <Badge variant='outline' className='text-xs'>
                            {community.category}
                          </Badge>
                        </div>

                        <div className='flex items-center justify-between pt-2'>
                          <span className='text-xs text-gray-500'>
                            Created{' '}
                            {formatDistanceToNow(new Date(community.created_at), {
                              addSuffix: true,
                            })}
                          </span>

                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 w-6 p-0'
                            onClick={e => {
                              e.stopPropagation();
                              handleManageCommunity(community.id);
                            }}
                          >
                            <Settings className='h-3 w-3' />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value='discover' className='mt-6'>
          <div className='space-y-6'>
            <div className='flex items-center gap-4'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search communities...'
                  value={searchQuery}
                  onChange={e => setSearchQuery((e.target as HTMLInputElement).value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
              <Button variant='outline' className='flex items-center gap-2'>
                <Filter className='h-4 w-4' />
                Filter
              </Button>
            </div>

            {suggestedCommunities.length === 0 ? (
              <div className='text-center py-12'>
                <Search className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>No Communities Found</h3>
                <p className='text-gray-500'>
                  Try adjusting your search or check back later for new communities.
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {suggestedCommunities
                  .filter(
                    community =>
                      searchQuery === '' ||
                      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      community.description.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(community => (
                    <Card key={community.id} className='group hover:shadow-lg transition-shadow'>
                      <div
                        className='relative cursor-pointer'
                        onClick={() => handleCommunityClick(community.id)}
                      >
                        {community.banner_url ? (
                          <div className='h-32 overflow-hidden rounded-t-lg'>
                            <img
                              src={community.banner_url}
                              alt={community.name}
                              className='w-full h-full object-cover group-hover:scale-105 transition-transform'
                            />
                          </div>
                        ) : (
                          <div className='h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center'>
                            <Users className='h-12 w-12 text-white' />
                          </div>
                        )}

                        <div className='absolute top-2 right-2'>
                          {community.is_private ? (
                            <Lock className='h-4 w-4 text-gray-500' />
                          ) : (
                            <Globe className='h-4 w-4 text-green-500' />
                          )}
                        </div>
                      </div>

                      <CardContent className='p-4'>
                        <div className='space-y-2'>
                          <h4 className='font-semibold text-gray-900 line-clamp-1'>
                            {community.name}
                          </h4>
                          <p className='text-sm text-gray-600 line-clamp-2'>
                            {community.description}
                          </p>

                          <div className='flex items-center justify-between text-xs text-gray-500'>
                            <span className='flex items-center gap-1'>
                              <Users className='h-3 w-3' />
                              {community.member_count} members
                            </span>
                            <Badge variant='outline' className='text-xs'>
                              {community.category}
                            </Badge>
                          </div>

                          <div className='pt-2'>
                            <Button
                              onClick={e => {
                                e.stopPropagation();
                                handleJoinCommunity(community.id);
                              }}
                              className='w-full flex items-center gap-2'
                              disabled={community.is_member}
                            >
                              <UserPlus className='h-4 w-4' />
                              {community.is_member ? 'Joined' : 'Join Community'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunitiesTab;
