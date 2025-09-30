import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Calendar,
  Settings,
  Share2,
  Lock,
  Globe,
  Star,
  DollarSign,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CommunityWithMemberStatus } from '@/services/community/types';

interface CommunityHeaderProps {
  community: CommunityWithMemberStatus;
  isOwner: boolean;
  isMember: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onSettings: () => void;
  onShare: () => void;
}

const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  community,
  isOwner,
  isMember,
  isJoining,
  isLeaving,
  onJoin,
  onLeave,
  onSettings,
  onShare,
}) => {
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

  return (
    <div className='relative'>
      {/* Cover Image */}
      <div className='h-48 lg:h-64 bg-gradient-to-br from-purple-500 to-pink-500 relative overflow-hidden'>
        {community.cover_image_url ? (
          <img
            src={community.cover_image_url}
            alt={community.name}
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full bg-gradient-to-br from-purple-500 to-pink-500' />
        )}

        {/* Overlay */}
        <div className='absolute inset-0 bg-black/20' />

        {/* Privacy Badge */}
        <div className='absolute top-4 right-4'>
          {community.is_private ? (
            <Badge variant='secondary' className='bg-black/20 text-white border-0'>
              <Lock className='w-3 h-3 mr-1' />
              Private
            </Badge>
          ) : (
            <Badge variant='secondary' className='bg-black/20 text-white border-0'>
              <Globe className='w-3 h-3 mr-1' />
              Public
            </Badge>
          )}
        </div>

        {/* Premium Badge */}
        {hasSubscription && (
          <div className='absolute top-4 left-4'>
            <Badge variant='secondary' className='bg-yellow-500/90 text-white border-0'>
              <Star className='w-3 h-3 mr-1' />
              Premium
            </Badge>
          </div>
        )}
      </div>

      {/* Community Info */}
      <div className='container mx-auto px-4'>
        <div className='relative -mt-16 lg:-mt-20'>
          <div className='flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4'>
            <div className='flex items-end gap-4'>
              <Avatar className='w-24 h-24 lg:w-32 lg:h-32 border-4 border-white shadow-lg'>
                <AvatarImage src={community.image_url || undefined} />
                <AvatarFallback className='bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-xl lg:text-2xl'>
                  {getInitials(community.name)}
                </AvatarFallback>
              </Avatar>

              <div className='pb-2'>
                <h1 className='text-2xl lg:text-3xl font-bold text-white mb-1'>
                  {community.name}
                </h1>
                <div className='flex items-center gap-4 text-white/90 text-sm'>
                  <div className='flex items-center'>
                    <Users className='w-4 h-4 mr-1' />
                    {community.member_count || 0} members
                  </div>
                  <div className='flex items-center'>
                    <Calendar className='w-4 h-4 mr-1' />
                    Created{' '}
                    {community.created_at
                      ? formatDistanceToNow(new Date(community.created_at))
                      : 'Recently'}{' '}
                    ago
                  </div>
                </div>
              </div>
            </div>

            <div className='flex gap-2'>
              {!isMember && !isOwner && (
                <Button
                  onClick={onJoin}
                  disabled={isJoining}
                  className='bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                >
                  {isJoining ? 'Joining...' : 'Join Community'}
                </Button>
              )}

              {isMember && !isOwner && (
                <Button
                  variant='outline'
                  onClick={onLeave}
                  disabled={isLeaving}
                  className='bg-white/90 backdrop-blur-sm border-white/20 text-gray-800 hover:bg-white'
                >
                  {isLeaving ? 'Leaving...' : 'Leave Community'}
                </Button>
              )}

              {isOwner && (
                <Button
                  variant='outline'
                  onClick={onSettings}
                  className='bg-white/90 backdrop-blur-sm border-white/20 text-gray-800 hover:bg-white'
                >
                  <Settings className='w-4 h-4 mr-2' />
                  Settings
                </Button>
              )}

              <Button
                variant='outline'
                onClick={onShare}
                className='bg-white/90 backdrop-blur-sm border-white/20 text-gray-800 hover:bg-white'
              >
                <Share2 className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Description and Subscription Info */}
      <div className='container mx-auto px-4 py-6 space-y-4'>
        {/* Description */}
        {community.description && (
          <div className='bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/20'>
            <p className='text-gray-700'>{community.description}</p>

            {/* Tags */}
            {community.tags && community.tags.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-4'>
                {community.tags.map(tag => (
                  <Badge key={tag} variant='outline' className='border-gray-300 text-gray-700'>
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscription Info */}
        {hasSubscription && (
          <div className='bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='font-semibold text-lg text-gray-900 mb-2'>
                  Premium Community
                </h3>
                <p className='text-gray-600 mb-4'>
                  Join as a subscriber to access exclusive content and features.
                </p>
                <div className='flex items-center gap-4 text-sm'>
                  {(community.monthly_price_cents || 0) > 0 && (
                    <div className='flex items-center text-purple-600 font-medium'>
                      <DollarSign className='w-4 h-4 mr-1' />$
                      {((community.monthly_price_cents || 0) / 100).toFixed(2)}/month
                    </div>
                  )}
                  {(community.yearly_price_cents || 0) > 0 && (
                    <div className='flex items-center text-purple-600 font-medium'>
                      <DollarSign className='w-4 h-4 mr-1' />$
                      {((community.yearly_price_cents || 0) / 100).toFixed(2)}/year
                    </div>
                  )}
                </div>
              </div>
              <Button className='bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'>
                Subscribe
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityHeader;