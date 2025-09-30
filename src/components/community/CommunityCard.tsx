import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Lock, Globe, DollarSign, Star, Calendar } from 'lucide-react';
import { CommunityWithMemberStatus } from '@/services/community/types';
import { useJoinCommunity } from '@/services/community';
import { formatDistanceToNow } from 'date-fns';

interface CommunityCardProps {
  community: CommunityWithMemberStatus;
  onJoin?: (communityId: string) => void | undefined;
  viewMode?: 'grid' | undefined| 'list';
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ community, onJoin, viewMode = 'grid' }) => {
  const joinMutation = useJoinCommunity();

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await joinMutation.mutateAsync({ communityId: community.id });
      onJoin?.(community.id);
    } catch (error) {
      console.error('Failed to join community:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasSubscription =
    community.subscription_enabled &&
    ((community.monthly_price_cents || 0) > 0 || (community.yearly_price_cents || 0) > 0);

  if (viewMode === 'list') {
    return (
      <Card className='group hover:shadow-md transition-all duration-200 border border-gray-200 bg-white'>
        <Link to={`/community/${community.id}`} className='block'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-4'>
              <Avatar className='w-16 h-16 border-2 border-gray-200'>
                <AvatarImage src={community.image_url || undefined} />
                <AvatarFallback className='bg-[#2B2B2B] text-white font-semibold'>
                  {getInitials(community.name)}
                </AvatarFallback>
              </Avatar>

              <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold text-lg text-[#2B2B2B] group-hover:text-gray-800 transition-colors truncate'>
                      {community.name}
                    </h3>
                    {community.description && (
                      <p className='text-gray-600 text-sm mt-1 line-clamp-2'>{community.description}</p>
                    )}

                    <div className='flex items-center gap-4 mt-2 text-sm text-gray-500'>
                      <div className='flex items-center'>
                        <Users className='w-4 h-4 mr-1' />
                        {community.member_count || 0} members
                      </div>
                      <div className='flex items-center'>
                        <Calendar className='w-4 h-4 mr-1' />
                        {community.created_at
                          ? formatDistanceToNow(new Date(community.created_at))
                          : 'Recently'}{' '}
                        ago
                      </div>
                      <div className='flex items-center gap-1'>
                        {community.is_private ? (
                          <Badge className='text-xs'>
                            <Lock className='w-3 h-3 mr-1' />
                            Private
                          </Badge>
                        ) : (
                          <Badge className='text-xs'>
                            <Globe className='w-3 h-3 mr-1' />
                            Public
                          </Badge>
                        )}
                        {hasSubscription && (
                          <Badge className='text-xs bg-[#2B2B2B] text-white'>
                            <Star className='w-3 h-3 mr-1' />
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>

                    {community.tags && community.tags.length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-2'>
                        {community.tags.slice(0, 3).map((tag: string) => (
                          <Badge
                            key={tag}
                            className='text-xs border border-gray-300 text-gray-700'
                          >
                            {tag}
                          </Badge>
                        ))}
                        {community.tags.length > 3 && (
                          <Badge className='text-xs border border-gray-300 text-gray-700'>
                            +{community.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className='ml-4 flex-shrink-0'>
                    {!community.is_member ? (
                      <Button
                        onClick={handleJoin}
                        disabled={joinMutation.isPending}
                        className='bg-[#2B2B2B] hover:bg-gray-800 text-white h-8 px-3 text-sm'
                      >
                        {joinMutation.isPending ? 'Joining...' : 'Join'}
                      </Button>
                    ) : (
                      <Badge
                        className='px-3 py-1 bg-gray-100 text-gray-800'
                      >
                        Member
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  return (
    <Card className='group hover:shadow-md transition-all duration-200 border border-gray-200 bg-white'>
      <Link to={`/community/${community.id}`} className='block'>
        <div className='relative'>
          {/* Cover Image */}
          <div className='h-32 bg-gray-100 rounded-t-lg relative overflow-hidden'>
            {community.cover_image_url ? (
              <img
                src={community.cover_image_url}
                alt={community.name}
                className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
              />
            ) : (
              <div className='w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center'>
                <Users className='h-12 w-12 text-gray-400' />
              </div>
            )}

            {/* Privacy indicator */}
            <div className='absolute top-2 right-2'>
              {community.is_private ? (
                <Badge className='bg-black/80 text-white border-0'>
                  <Lock className='w-3 h-3 mr-1' />
                  Private
                </Badge>
              ) : (
                <Badge className='bg-white/80 text-gray-800 border-0'>
                  <Globe className='w-3 h-3 mr-1' />
                  Public
                </Badge>
              )}
            </div>

            {/* Subscription indicator */}
            {hasSubscription && (
              <div className='absolute top-2 left-2'>
                <Badge className='bg-[#2B2B2B]/90 text-white border-0'>
                  <Star className='w-3 h-3 mr-1' />
                  Premium
                </Badge>
              </div>
            )}
          </div>

          {/* Community Avatar */}
          <div className='absolute -bottom-8 left-4'>
            <Avatar className='w-16 h-16 border-4 border-white shadow-lg'>
              <AvatarImage src={community.image_url || undefined} />
              <AvatarFallback className='bg-[#2B2B2B] text-white font-semibold'>
                {getInitials(community.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardContent className='pt-12 pb-4'>
          <div className='space-y-3'>
            <div>
              <h3 className='font-semibold text-lg text-[#2B2B2B] group-hover:text-gray-800 transition-colors line-clamp-1'>
                {community.name}
              </h3>
              {community.description && (
                <p className='text-gray-600 text-sm mt-1 line-clamp-2'>{community.description}</p>
              )}
            </div>

            {/* Stats */}
            <div className='flex items-center justify-between text-sm text-gray-500'>
              <div className='flex items-center space-x-4'>
                <div className='flex items-center'>
                  <Users className='w-4 h-4 mr-1' />
                  {community.member_count || 0} members
                </div>
                <div className='flex items-center'>
                  <Calendar className='w-4 h-4 mr-1' />
                  {community.created_at
                    ? formatDistanceToNow(new Date(community.created_at))
                    : 'Recently'}{' '}
                  ago
                </div>
              </div>
            </div>

            {/* Tags */}
            {community.tags && community.tags.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {community.tags.slice(0, 3).map((tag: string) => (
                  <Badge
                    key={tag}
                    className='text-xs border border-gray-300 text-gray-700'
                  >
                    {tag}
                  </Badge>
                ))}
                {community.tags.length > 3 && (
                  <Badge className='text-xs border border-gray-300 text-gray-700'>
                    +{community.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Subscription Pricing */}
            {hasSubscription && (
              <div className='flex items-center text-sm text-[#2B2B2B] font-medium'>
                <DollarSign className='w-4 h-4 mr-1' />
                {((community.monthly_price_cents || 0) > 0) && (
                  <span>${((community.monthly_price_cents || 0) / 100).toFixed(2)}/month</span>
                )}
                {((community.monthly_price_cents || 0) > 0) && ((community.yearly_price_cents || 0) > 0) && (
                  <span className='mx-1'>•</span>
                )}
                {((community.yearly_price_cents || 0) > 0) && (
                  <span>${((community.yearly_price_cents || 0) / 100).toFixed(2)}/year</span>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className='pt-0'>
          {!community.is_member ? (
            <Button
              onClick={handleJoin}
              disabled={joinMutation.isPending}
              className='w-full bg-[#2B2B2B] hover:bg-gray-800 text-white h-9 text-sm'
            >
              {joinMutation.isPending ? 'Joining...' : 'Join Community'}
            </Button>
          ) : (
            <Badge
              className='w-full justify-center py-2 bg-gray-100 text-gray-800'
            >
              Member
            </Badge>
          )}
        </CardFooter>
      </Link>
    </Card>
  );
};
