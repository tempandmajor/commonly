import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClickableAvatar } from '@/components/ui/clickable-avatar';
import { Check } from 'lucide-react';
import type { Notification } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  const { user, action, time, read } = notification;

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
        read ? 'bg-background' : 'bg-muted/30'
      }`}
    >
      <ClickableAvatar avatarUrl={user.avatar} displayName={user.name} size='md' disabled={true} />

      <div className='flex-1 space-y-1'>
        <p className='text-sm'>
          <span className='font-medium'>{user.name}</span> {action}
        </p>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>
            {formatDistanceToNow(time, { addSuffix: true })}
          </span>
          {!read && (
            <Badge variant='secondary' className='text-xs'>
              New
            </Badge>
          )}
        </div>
      </div>

      {!read && (
        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0'
          onClick={() => onMarkAsRead(notification.id)}
        >
          <Check className='h-4 w-4' />
          <span className='sr-only'>Mark as read</span>
        </Button>
      )}
    </div>
  );
};
