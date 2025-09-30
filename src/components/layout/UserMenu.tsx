import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  LogOut,
  Calendar,
  Plus,
  Ticket,
  Wallet,
  CreditCard,
  Mic,
  Target,
  ChefHat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';

const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);
  const [cachedAvatarUrl, setCachedAvatarUrl] = useState<string>('');

  // Cache avatar URL to prevent flickering
  useEffect(() => {
    if (user?.avatar_url && user.avatar_url !== cachedAvatarUrl) {
      setCachedAvatarUrl(user.avatar_url);
      setAvatarError(false);
    }
  }, [user?.avatar_url, cachedAvatarUrl]);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAvatarError = () => {
    console.debug('Avatar failed to load, using fallback');
    setAvatarError(true);
  };

  // Handle user data with proper fallbacks - prioritize database profile over auth metadata
  const userEmail = user.email || '';
  const displayName =
    user.display_name || user.name || (user.user_metadata?.display_name as string) || userEmail;

  // Use cached avatar URL or fallback chain, but not if there was an error loading it
  const avatarUrl = avatarError
    ? ''
    : cachedAvatarUrl || user.avatar_url || (user.user_metadata?.avatar_url as string) || '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            {avatarUrl && !avatarError ? (
              <AvatarImage
                src={avatarUrl}
                alt={displayName}
                onError={handleAvatarError}
                className='object-cover'
                loading='lazy'
              />
            ) : null}
            <AvatarFallback className='bg-primary/10 text-primary font-medium'>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{displayName}</p>
            <p className='text-xs leading-none text-muted-foreground'>{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Account Section */}
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className='mr-2 h-4 w-4' />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className='mr-2 h-4 w-4' />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Content & Events Section */}
        <DropdownMenuItem onClick={() => navigate('/dashboard')}>
          <Calendar className='mr-2 h-4 w-4' />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/create-event')}>
          <Plus className='mr-2 h-4 w-4' />
          Create Event
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Financial Section */}
        <DropdownMenuItem onClick={() => navigate('/wallet')}>
          <Wallet className='mr-2 h-4 w-4' />
          Wallet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/payments')}>
          <CreditCard className='mr-2 h-4 w-4' />
          Payment Methods
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/tickets')}>
          <Ticket className='mr-2 h-4 w-4' />
          My Tickets
        </DropdownMenuItem>

        {/* Caterer Section - Only show if user has caterer role */}
        {user.roles?.includes('caterer') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/caterer-dashboard')}>
              <ChefHat className='mr-2 h-4 w-4' />
              Caterer Dashboard
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className='mr-2 h-4 w-4' />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
