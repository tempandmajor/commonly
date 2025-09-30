import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, UserMinus, Settings } from 'lucide-react';
import { User } from '@/lib/types';
import { generateInitials } from '@/lib/utils';
import { calculateTimeAgo } from '@/lib/utils';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  isFollowing: boolean;
  followersCount?: number | undefined;
  followingCount?: number | undefined;
  onFollowToggle: () => void;
  onMessageClick?: () => void | undefined;
  onEditProfile?: () => void | undefined;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isOwnProfile,
  isFollowing,
  followersCount = 0,
  followingCount = 0,
  onFollowToggle,
  onMessageClick,
  onEditProfile,
}) => {
  const joinDate = user.created_at ? calculateTimeAgo(new Date(user.created_at)) : 'Unknown';

  return (
    <div className='bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6'>
      <div className='flex flex-col md:flex-row items-start gap-6'>
        <Avatar className='h-24 w-24 border-2 border-primary/10'>
          <AvatarImage
            src={user.profilePicture || user.avatar || user.avatar_url}
            alt={user.name || user.display_name || 'User'}
          />
          <AvatarFallback className='text-lg'>
            {generateInitials(user.name || user.display_name || 'User')}
          </AvatarFallback>
        </Avatar>

        <div className='flex-1 space-y-4'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-bold'>{user.name || user.display_name}</h1>
              {user.username && <p className='text-muted-foreground'>@{user.username}</p>}
            </div>

            <div className='flex gap-2'>
              {isOwnProfile ? (
                onEditProfile && (
                  <Button variant='outline' size='sm' onClick={onEditProfile} className='gap-2'>
                    <Settings className='h-4 w-4' />
                    <span className='hidden sm:inline'>Edit Profile</span>
                  </Button>
                )
              ) : (
                <>
                  <Button
                    variant={isFollowing ? 'outline' : 'default'}
                    onClick={onFollowToggle}
                    size='sm'
                    className='gap-2'
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className='h-4 w-4' />
                        <span className='hidden sm:inline'>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className='h-4 w-4' />
                        <span className='hidden sm:inline'>Follow</span>
                      </>
                    )}
                  </Button>

                  {onMessageClick && (
                    <Button variant='outline' size='sm' onClick={onMessageClick} className='gap-2'>
                      <MessageSquare className='h-4 w-4' />
                      <span className='hidden sm:inline'>Message</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {user.bio && <p className='text-sm'>{user.bio}</p>}

          <div className='flex gap-4 text-sm text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <span className='font-medium'>{followersCount}</span>
              <span>Followers</span>
            </div>
            <div className='flex items-center gap-1'>
              <span className='font-medium'>{followingCount}</span>
              <span>Following</span>
            </div>
            <div className='flex items-center gap-1'>
              <Calendar className='h-3.5 w-3.5' />
              <span>Joined {joinDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
