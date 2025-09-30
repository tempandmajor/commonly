import { Separator } from '@/components/ui/separator';
import { NotificationItem } from './NotificationItem';
import NotificationEmpty from './NotificationEmpty';
import NotificationLoading from './NotificationLoading';
import type { Notification } from '@/types/notification';

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
}

const NotificationList = ({ notifications, loading, onMarkAsRead }: NotificationListProps) => {
  if (loading) {
    return <NotificationLoading />;
  }

  if (notifications.length === 0) {
    return <NotificationEmpty />;
  }

  return (
    <>
      {notifications.map((notification, index) => (
        <div key={notification.id}>
          <NotificationItem notification={notification} onMarkAsRead={onMarkAsRead} />
          {index < notifications.length - 1 && <Separator className='my-4' />}
        </div>
      ))}
    </>
  );
};

export default NotificationList;
