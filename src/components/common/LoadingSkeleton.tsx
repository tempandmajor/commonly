import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string | undefined;
  children?: React.ReactNode | undefined;
}

// Base skeleton component
export const Skeleton = ({
  className,
  children,
          ...props
}: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props}>
      {children}
    </div>
  );
};

// Card skeleton for general content
export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
    <Skeleton className='h-4 w-3/4' />
    <Skeleton className='h-4 w-1/2' />
    <Skeleton className='h-20 w-full' />
    <div className='flex space-x-2'>
      <Skeleton className='h-8 w-16' />
      <Skeleton className='h-8 w-16' />
    </div>
  </div>
);

// Event card skeleton
export const EventCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
    <Skeleton className='h-48 w-full' />
    <div className='p-4 space-y-3'>
      <Skeleton className='h-5 w-3/4' />
      <Skeleton className='h-4 w-1/2' />
      <div className='flex items-center space-x-2'>
        <Skeleton className='h-4 w-4 rounded-full' />
        <Skeleton className='h-4 w-24' />
      </div>
      <div className='flex justify-between items-center'>
        <Skeleton className='h-6 w-16' />
        <Skeleton className='h-8 w-20' />
      </div>
    </div>
  </div>
);

// Product card skeleton
export const ProductCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
    <Skeleton className='h-40 w-full' />
    <div className='p-4 space-y-2'>
      <Skeleton className='h-5 w-full' />
      <Skeleton className='h-4 w-2/3' />
      <div className='flex justify-between items-center mt-3'>
        <Skeleton className='h-6 w-16' />
        <Skeleton className='h-8 w-8 rounded-full' />
      </div>
    </div>
  </div>
);

// User profile skeleton
export const UserProfileSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center space-x-4', className)}>
    <Skeleton className='h-12 w-12 rounded-full' />
    <div className='space-y-2'>
      <Skeleton className='h-4 w-32' />
      <Skeleton className='h-3 w-24' />
    </div>
  </div>
);

// Table skeleton
export const TableSkeleton = ({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) => (
  <div className={cn('space-y-3', className)}>
    {/* Header */}
    <div className='flex space-x-4 border-b pb-3'>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className='h-4 flex-1' />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className='flex space-x-4'>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className='h-4 flex-1' />
        ))}
      </div>
    ))}
  </div>
);

// List skeleton
export const ListSkeleton = ({ items = 5, className }: { items?: number; className?: string }) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className='flex items-center space-x-4'>
        <Skeleton className='h-10 w-10 rounded-full' />
        <div className='space-y-2 flex-1'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-3 w-3/4' />
        </div>
        <Skeleton className='h-8 w-16' />
      </div>
    ))}
  </div>
);

// Dashboard stats skeleton
export const DashboardStatsSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className='rounded-lg border bg-card p-6'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-4' />
        </div>
        <Skeleton className='h-8 w-16 mt-3' />
        <Skeleton className='h-3 w-24 mt-2' />
      </div>
    ))}
  </div>
);

// Form skeleton
export const FormSkeleton = ({
  fields = 5,
  className,
}: {
  fields?: number;
  className?: string;
}) => (
  <div className={cn('space-y-6', className)}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className='space-y-2'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-10 w-full' />
      </div>
    ))}
    <div className='flex space-x-4 pt-4'>
      <Skeleton className='h-10 w-24' />
      <Skeleton className='h-10 w-24' />
    </div>
  </div>
);

// Page skeleton with header and content
export const PageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header */}
    <div className='space-y-2'>
      <Skeleton className='h-8 w-64' />
      <Skeleton className='h-4 w-96' />
    </div>

    {/* Content */}
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      <div className='lg:col-span-2 space-y-6'>
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className='space-y-6'>
        <CardSkeleton />
        <ListSkeleton items={3} />
      </div>
    </div>
  </div>
);

// Chat/Messages skeleton
export const MessagesSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
        <div
          className={cn(
            'flex items-start space-x-2 max-w-xs',
            i % 2 !== 0 && 'flex-row-reverse space-x-reverse'
          )}
        >
          <Skeleton className='h-8 w-8 rounded-full flex-shrink-0' />
          <div className='space-y-1'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className={cn('h-12 rounded-lg', i % 2 === 0 ? 'w-48' : 'w-32')} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Media grid skeleton (for images/videos)
export const MediaGridSkeleton = ({
  items = 6,
  className,
}: {
  items?: number;
  className?: string;
}) => (
  <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <Skeleton key={i} className='aspect-square rounded-lg' />
    ))}
  </div>
);

// Navigation skeleton
export const NavigationSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center justify-between p-4', className)}>
    <div className='flex items-center space-x-4'>
      <Skeleton className='h-8 w-32' />
      <div className='hidden md:flex space-x-6'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-4 w-16' />
        ))}
      </div>
    </div>
    <div className='flex items-center space-x-2'>
      <Skeleton className='h-8 w-8 rounded-full' />
      <Skeleton className='h-8 w-20' />
    </div>
  </div>
);

// Compact loading component for inline use
export const InlineLoader = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center space-x-2', className)}>
    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary'></div>
    <span className='text-sm text-muted-foreground'>Loading...</span>
  </div>
);

// Full page loading component
export const FullPageLoader = ({ message = 'Loading...' }: { message?: string }) => (
  <div className='min-h-screen flex items-center justify-center'>
    <div className='text-center space-y-4'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
      <p className='text-lg text-muted-foreground'>{message}</p>
    </div>
  </div>
);
