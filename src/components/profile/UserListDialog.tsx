import React from 'react';
import { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UserListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  currentUserId?: string | undefined;
}

const UserListDialog = ({ isOpen, onClose, title, users, currentUserId }: UserListDialogProps) => {
  const navigate = useNavigate();

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
    onClose();
  };

  const handleFollowToggle = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this would call an API to follow/unfollow
    toast.success(`${user.isFollowing ? 'Unfollowed' : 'Followed'} ${user.name}`);
    // We would update the user's follow status in state here
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className='max-h-[60vh] overflow-y-auto'>
          {users.length === 0 ? (
            <div className='py-6 text-center text-muted-foreground'>No users to display</div>
          ) : (
            <ul className='space-y-3'>
              {users.map(user => (
                <li
                  key={user.id}
                  onClick={() => handleUserClick(user.username || '')}
                  className='flex items-center justify-between rounded-md p-2 hover:bg-muted cursor-pointer'
                >
                  <div className='flex items-center space-x-3'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        <UserIcon className='h-6 w-6' />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-medium'>{user.name}</p>
                      <p className='text-sm text-muted-foreground'>@{user.username}</p>
                    </div>
                  </div>
                  {user.id !== currentUserId && (
                    <Button
                      variant={user.isFollowing ? 'outline' : 'default'}
                      size='sm'
                      onClick={e => handleFollowToggle(user, e)}
                    >
                      <Users className='mr-2 h-4 w-4' />
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserListDialog;
