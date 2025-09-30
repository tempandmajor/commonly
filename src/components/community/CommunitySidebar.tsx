import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { CommunityWithMemberStatus } from '@/services/community/types';

interface Member {
  id: string;
  user_id: string;
  role: 'member' | 'admin' | 'owner';
  joined_at: string;
  user?: {
    id: string | undefined;
    name?: string | undefined;
    display_name?: string | undefined;
    avatar_url?: string | undefined;
  };
}

interface CommunitySidebarProps {
  community: CommunityWithMemberStatus;
  members?: Member[] | undefined;
  postsCount?: number | undefined;
  mediaCount?: number | undefined;
}

const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  community,
  members = [],
  postsCount = 0,
  mediaCount = 0,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className='space-y-6'>
      {/* Community Stats */}
      <Card className='border-0 bg-white/50 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='text-lg text-[#2B2B2B]'>Community Stats</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-gray-600'>Members</span>
            <span className='font-semibold text-[#2B2B2B]'>{community.member_count || 0}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-gray-600'>Posts</span>
            <span className='font-semibold text-[#2B2B2B]'>{postsCount}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-gray-600'>Media</span>
            <span className='font-semibold text-[#2B2B2B]'>{mediaCount}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-gray-600'>Created</span>
            <span className='font-semibold text-[#2B2B2B]'>
              {community.created_at
                ? formatDistanceToNow(new Date(community.created_at)) + ' ago'
                : 'Recently'}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-gray-600'>Category</span>
            <span className='font-semibold text-[#2B2B2B]'>{community.category || 'General'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Members */}
      {members.length > 0 && (
        <Card className='border-0 bg-white/50 backdrop-blur-sm'>
          <CardHeader>
            <CardTitle className='text-lg text-[#2B2B2B]'>Recent Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {members.slice(0, 5).map(member => (
                <div key={member.id} className='flex items-center gap-3'>
                  <Avatar className='w-8 h-8'>
                    <AvatarImage src={member.user?.avatar_url || undefined} />
                    <AvatarFallback className='text-xs bg-[#2B2B2B] text-white'>
                      {getInitials(member.user?.display_name || member.user?.name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>
                      {member.user?.display_name || member.user?.name || 'Anonymous'}
                    </p>
                    <p className='text-xs text-gray-600'>
                      Joined{' '}
                      {member.joined_at
                        ? formatDistanceToNow(new Date(member.joined_at))
                        : 'Recently'}{' '}
                      ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Rules */}
      {community.rules && community.rules.length > 0 && (
        <Card className='border-0 bg-white/50 backdrop-blur-sm'>
          <CardHeader>
            <CardTitle className='text-lg text-[#2B2B2B]'>Community Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {community.rules.map((rule, index) => (
                <div key={index} className='flex gap-3'>
                  <span className='text-sm font-medium text-purple-600 mt-0.5'>
                    {index + 1}.
                  </span>
                  <p className='text-sm text-gray-700'>{rule}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Creator */}
      <Card className='border-0 bg-white/50 backdrop-blur-sm'>
        <CardHeader>
          <CardTitle className='text-lg text-[#2B2B2B]'>Community Creator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-3'>
            <Avatar className='w-10 h-10'>
              <AvatarImage src={community.creator?.avatar_url || undefined} />
              <AvatarFallback className='bg-[#2B2B2B] text-white'>
                {getInitials(community.creator?.display_name || community.creator?.name || 'Creator')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className='font-medium text-gray-900'>
                {community.creator?.display_name || community.creator?.name || 'Community Creator'}
              </p>
              <p className='text-sm text-gray-600'>Founder</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunitySidebar;