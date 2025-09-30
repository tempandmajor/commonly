import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ClickableAvatarProps {
  userId?: string | undefined;
  username?: string | undefined;
  avatarUrl?: string | undefined| null;
  displayName?: string | undefined;
  size?: 'sm' | undefined| 'md' | 'lg' | 'xl';
  className?: string | undefined;
  onClick?: () => void | undefined;
  disabled?: boolean | undefined;
  fallbackClassName?: string | undefined;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

export const ClickableAvatar: React.FC<ClickableAvatarProps> = ({
  userId,
  username,
  avatarUrl,
  displayName,
  size = 'md',
  className,
  onClick,
  disabled = false,
  fallbackClassName,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (disabled) return;

    if (onClick) {
      onClick();
      return;
    }

    // Navigate to user profile
    if (username) {
      navigate(`/profile/${username}`);
    } else if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : 'U';
  const alt = displayName || 'User';

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        !disabled && (userId || username) && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={handleClick}
    >
      {avatarUrl && (
        <AvatarImage
          src={avatarUrl}
          alt={alt}
          className='object-cover'
          onError={e => {
            e.currentTarget.src = '/placeholder-avatar.jpg';
          }}
        />
      )}
      <AvatarFallback className={cn('bg-primary/10 text-primary font-medium', fallbackClassName)}>
        {displayInitial}
      </AvatarFallback>
    </Avatar>
  );
};

export default ClickableAvatar;
