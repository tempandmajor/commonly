import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Store, Star, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  hasStore: boolean;
  followerCount: number;
  followingCount: number;
  createdEventsCount: number;
  onFollowToggle: () => void;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  onMessageClick: () => void;
  onCreateStore?: () => void | undefined;
  isFollowing?: boolean | undefined;
}

const ProfileHeader = ({
  user,
  isOwnProfile,
  hasStore,
  followerCount,
  followingCount,
  createdEventsCount,
  onFollowToggle,
  onFollowersClick,
  onFollowingClick,
  onMessageClick,
  onCreateStore,
  isFollowing,
}: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const isMerchantEligible = followerCount >= 1000;

  const handleVisitStore = () => {
    navigate(`/profile/${user.id}/store`);
  };

  return (
    <div className='flex flex-col items-center gap-6 md:flex-row md:items-start'>
      <Avatar className='h-24 w-24 md:h-32 md:w-32'>
        <AvatarImage src={user.profilePicture} alt={user.name} />
        <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
      </Avatar>

      <div className='flex flex-1 flex-col items-center text-center md:items-start md:text-left'>
        <h1 className='text-3xl font-bold'>{user.name}</h1>
        <p className='text-md text-muted-foreground'>@{user.username}</p>

        <div className='mt-3 flex flex-row justify-center md:justify-start space-x-6 w-full'>
          <div
            onClick={onFollowersClick}
            className='flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 p-2 rounded-md transition-colors h-16'
          >
            <p className='text-lg font-semibold'>{followerCount.toLocaleString()}</p>
            <p className='text-xs text-muted-foreground'>Followers</p>
          </div>
          <div
            onClick={onFollowingClick}
            className='flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 p-2 rounded-md transition-colors h-16'
          >
            <p className='text-lg font-semibold'>{followingCount.toLocaleString()}</p>
            <p className='text-xs text-muted-foreground'>Following</p>
          </div>
          <div className='flex flex-col items-center justify-center cursor-default p-2 h-16'>
            <p className='text-lg font-semibold'>{createdEventsCount}</p>
            <p className='text-xs text-muted-foreground'>Events</p>
          </div>
        </div>

        <p className='mt-4 max-w-md text-muted-foreground'>{user.bio}</p>

        <div className='mt-6 flex flex-wrap gap-3'>
          {user.isEligibleForSubscription && (
            <Badge variant='outline'>
              <Star className='mr-1 h-3 w-3' />
              Verified Creator
            </Badge>
          )}
          {hasStore && (
            <Badge variant='outline' className='bg-amber-100 text-amber-800'>
              <Store className='mr-1 h-3 w-3' />
              Merchant Store
            </Badge>
          )}
        </div>
      </div>

      <div className='flex flex-col gap-3 sm:flex-row md:flex-col'>
        {!isOwnProfile && (
          <>
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              onClick={onFollowToggle}
              className='w-full sm:w-auto'
            >
              <Users className='mr-2 h-4 w-4' />
              {isFollowing ? 'Following' : 'Follow'}
            </Button>

            <Button variant='outline' onClick={onMessageClick} className='w-full sm:w-auto'>
              <MessageSquare className='mr-2 h-4 w-4' />
              Message
            </Button>
          </>
        )}

        {isOwnProfile && (
          <>
            <Button
              variant='outline'
              onClick={() => navigate('/settings')}
              className='w-full sm:w-auto'
            >
              <Settings className='mr-2 h-4 w-4' />
              Settings
            </Button>

            {hasStore ? (
              <Button
                variant='outline'
                onClick={handleVisitStore}
                className='w-full sm:w-auto bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700'
              >
                <Store className='mr-2 h-4 w-4' />
                My Store
              </Button>
            ) : (
              isMerchantEligible &&
              onCreateStore && (
                <Button
                  variant='outline'
                  onClick={onCreateStore}
                  className='w-full sm:w-auto bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700'
                >
                  <Store className='mr-2 h-4 w-4' />
                  Create Store
                </Button>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
