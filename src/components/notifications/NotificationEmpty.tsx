import { Bell } from 'lucide-react';

const NotificationEmpty = () => {
  return (
    <div className='flex flex-col items-center justify-center py-12'>
      <Bell className='h-12 w-12 text-muted-foreground mb-4' />
      <p className='text-muted-foreground'>You don't have any notifications yet</p>
    </div>
  );
};

export default NotificationEmpty;
