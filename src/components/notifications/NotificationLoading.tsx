import { Skeleton } from '@/components/ui/skeleton';

const NotificationLoading = () => {
  return (
    <div className='space-y-4'>
      {[1, 2, 3].map(i => (
        <div key={i} className='flex items-start gap-4 p-4'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/4' />
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationLoading;
