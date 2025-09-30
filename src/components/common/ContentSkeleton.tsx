import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type SkeletonType = 'product' | 'profile' | 'community' | 'text' | 'image';

interface ContentSkeletonProps {
  type?: SkeletonType | undefined;
  count?: number | undefined;
  className?: string | undefined;
  grid?: boolean | undefined;
  gridCols?: number | undefined;
  containerClassName?: string | undefined;
}

export const ContentSkeleton: React.FC<ContentSkeletonProps> = ({
  type = 'text',
  count = 1,
  className = '',
  grid = false,
  gridCols = 3,
  containerClassName = '',
}) => {
  const skeletons = Array(count).fill(0);

  const renderSkeleton = (index: number) => {
    switch (type) {
      case 'product':
        return (
          <div key={index} className='space-y-3'>
            <Skeleton className='h-48 w-full rounded-md' />
            <Skeleton className='h-5 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
            <div className='flex justify-between'>
              <Skeleton className='h-6 w-1/3' />
              <Skeleton className='h-6 w-1/3' />
            </div>
          </div>
        );

      case 'profile':
        return (
          <div key={index} className='flex items-center space-x-4'>
            <Skeleton className='h-12 w-12 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-3 w-32' />
            </div>
          </div>
        );

      case 'community':
        return (
          <div key={index} className='space-y-3'>
            <div className='flex items-center space-x-4'>
              <Skeleton className='h-16 w-16 rounded-full' />
              <div className='space-y-2'>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-4 w-48' />
              </div>
            </div>
            <Skeleton className='h-24 w-full' />
          </div>
        );

      case 'image':
        return <Skeleton key={index} className={`h-32 w-full rounded-md ${className}`} />;

      case 'text':
      default:
        return <Skeleton key={index} className={`h-4 w-full ${className}`} />;
    }
  };

  if (grid) {
    return (
      <div
        className={`grid gap-4 ${containerClassName}`}
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        }}
      >
        {skeletons.map((_, index) => renderSkeleton(index))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${containerClassName}`}>
      {skeletons.map((_, index) => renderSkeleton(index))}
    </div>
  );
};
