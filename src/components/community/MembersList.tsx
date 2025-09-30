import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClickableAvatar } from '@/components/ui/clickable-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Crown, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';

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

interface MembersListProps {
  members: Member[];
  isLoading: boolean;
  isOwner: boolean;
  onUpdateMemberRole: (userId: string, role: 'member' | 'admin') => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

const MembersList: React.FC<MembersListProps> = ({
  members,
  isLoading,
  isOwner,
  onUpdateMemberRole,
  onRemoveMember,
}) => {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className='flex items-center gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-lg'
          >
            <Skeleton className='w-12 h-12 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-1/3' />
              <Skeleton className='h-3 w-1/4' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className='text-center py-12'>
        <Users className='mx-auto h-12 w-12 text-gray-400 mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>No members yet</h3>
        <p className='text-gray-600'>Be the first to join this community!</p>
      </div>
    );
  }

  // Sort members: owner first, then admins, then regular members
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  return (
    <div className='space-y-4'>
      {sortedMembers.map(member => (
        <Card
          key={member.id}
          className='border-0 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors'
        >
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <ClickableAvatar
                  userId={member.user?.id}
                  avatarUrl={member.user?.avatar_url}
                  displayName={member.user?.display_name || member.user?.name || 'User'}
                  size='xl'
                />
                <div>
                  <div className='flex items-center gap-2'>
                    <h4 className='font-medium text-gray-900'>
                      {member.user?.display_name || member.user?.name || 'Anonymous'}
                    </h4>
                    {member.role === 'owner' && (
                      <Crown className='w-4 h-4 text-yellow-500' />
                    )}
                    {member.role === 'admin' && (
                      <Crown className='w-4 h-4 text-blue-500' />
                    )}
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <span className='capitalize font-medium'>{member.role}</span>
                    <span>•</span>
                    <span>
                      Joined{' '}
                      {member.joined_at
                        ? formatDistanceToNow(new Date(member.joined_at))
                        : 'Recently'}{' '}
                      ago
                    </span>
                  </div>
                </div>
              </div>

              {isOwner && member.user_id && member.user_id !== user?.id && member.role !== 'owner' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm' className='hover:bg-gray-100'>
                      <MoreVertical className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={() =>
                        onUpdateMemberRole(
                          member.user_id!,
                          member.role === 'admin' ? 'member' : 'admin'
                        )
                      }
                    >
                      <Crown className='w-4 h-4 mr-2' />
                      {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onRemoveMember(member.user_id!)}
                      className='text-red-600 focus:text-red-600'
                    >
                      <Users className='w-4 h-4 mr-2' />
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MembersList;