import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NotificationButtonsProps {
  unreadCount: number;
  onClick: () => void;
}

const NotificationButtons: React.FC<NotificationButtonsProps> = ({ unreadCount, onClick }) => {
  return (
    <Button variant='ghost' size='sm' onClick={onClick} className='relative'>
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
  );
};

export default NotificationButtons;
