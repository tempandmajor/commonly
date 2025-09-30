import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const CatererDetailSkeleton = () => {
  return (
    <div className='space-y-8'>
      {/* Image skeleton */}
      <Skeleton className='w-full h-[300px] rounded-lg' />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 space-y-8'>
          <div className='space-y-4'>
            {/* Title and header skeleton */}
            <Skeleton className='h-10 w-3/4' />
            <div className='flex items-center space-x-4'>
              <Skeleton className='h-6 w-24' />
              <Skeleton className='h-6 w-24' />
              <Skeleton className='h-6 w-24' />
            </div>
          </div>

          {/* Tab content skeleton */}
          <div className='space-y-6'>
            <div className='flex space-x-2 mb-4'>
              <Skeleton className='h-10 w-24' />
              <Skeleton className='h-10 w-24' />
              <Skeleton className='h-10 w-24' />
            </div>

            <div className='space-y-4'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
            </div>
          </div>
        </div>

        <div className='lg:col-span-1'>
          <Card>
            <CardContent className='p-6'>
              <div className='space-y-4'>
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-[220px] w-full' />
                <Skeleton className='h-10 w-full' />
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                </div>
                <Skeleton className='h-10 w-full' />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CatererDetailSkeleton;
