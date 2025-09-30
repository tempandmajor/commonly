import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'event_cancelled':
        return '❌';
      case 'event_funded':
        return '🎉';
      case 'event_reminder':
        return '⏰';
      case 'payment_charged':
        return '💳';
      case 'payment_failed':
        return '⚠️';
      case 'reservation_confirmed':
        return '✅';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'event_cancelled':
        return 'text-red-600';
      case 'event_funded':
        return 'text-green-600';
      case 'event_reminder':
        return 'text-blue-600';
      case 'payment_charged':
        return 'text-green-600';
      case 'payment_failed':
        return 'text-red-600';
      case 'reservation_confirmed':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-80'>
        <DropdownMenuLabel className='flex items-center justify-between'>
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant='ghost' size='sm' onClick={markAllAsRead} className='h-6 px-2 text-xs'>
              <CheckCheck className='h-3 w-3 mr-1' />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className='p-4 text-center text-sm text-muted-foreground'>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className='p-4 text-center text-sm text-muted-foreground'>No notifications yet</div>
        ) : (
          <ScrollArea className='h-80'>
            {notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${
                  !notification.read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className='flex items-start space-x-3 w-full'>
                  <div className='text-lg'>{getNotificationIcon(notification.type)}</div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <p
                          className={`text-sm font-medium ${getNotificationColor(notification.type)}`}
                        >
                          {notification.title}
                        </p>
                        <p className='text-xs text-muted-foreground mt-1'>{notification.message}</p>
                        <p className='text-xs text-muted-foreground mt-1'>
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className='flex items-center space-x-1 ml-2'>
                        {!notification.read && (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6'
                            onClick={e => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className='h-3 w-3' />
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6 text-red-500 hover:text-red-700'
                          onClick={e => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className='h-3 w-3' />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
