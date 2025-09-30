import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface LoadingProps {
  /** Size of the loader */
  size?: 'small' | undefined| 'medium' | 'large';
  /** Type of loader to display */
  type?: 'spinner' | undefined| 'skeleton' | 'dots';
  /** Whether to show full page loader */
  fullPage?: boolean | undefined;
  /** Custom message to display */
  message?: string | undefined;
  /** Whether this is for admin interface */
  variant?: 'default' | undefined| 'admin';
  /** For skeleton type - what kind of skeleton to show */
  skeletonType?: 'text' | undefined| 'card' | 'list' | 'grid';
  /** Number of skeleton items to show */
  skeletonCount?: number | undefined;
  /** Additional className */
  className?: string | undefined;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  type = 'spinner',
  fullPage = false,
  message,
  variant = 'default',
  skeletonType = 'card',
  skeletonCount = 1,
  className,
}) => {
  const sizeClasses = {
    small: { spinner: 'h-4 w-4', text: 'text-sm' },
    medium: { spinner: 'h-8 w-8', text: 'text-base' },
    large: { spinner: 'h-12 w-12', text: 'text-lg' },
  };

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className='flex flex-col items-center justify-center gap-2'>
            <Loader2
              className={cn(
                sizeClasses[size].spinner,
                'animate-spin',
                variant === 'admin' ? 'text-primary' : 'text-primary'
              )}
            />
            {message && (
              <p className={cn(sizeClasses[size].text, 'text-muted-foreground')}>{message}</p>
            )}
          </div>
        );

      case 'dots':
        return (
          <div className='flex flex-col items-center justify-center gap-2'>
            <div className='flex gap-1'>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={cn(
                    'rounded-full bg-primary animate-pulse',
                    size === 'small' ? 'h-2 w-2' : size === 'large' ? 'h-4 w-4' : 'h-3 w-3',
                    i === 1 && 'animation-delay-200',
                    i === 2 && 'animation-delay-400'
                  )}
                />
              ))}
            </div>
            {message && (
              <p className={cn(sizeClasses[size].text, 'text-muted-foreground')}>{message}</p>
            )}
          </div>
        );

      case 'skeleton':
        return (
          <div className='space-y-4 w-full'>
            {Array.from({ length: skeletonCount }).map((_, i) => {
              switch (skeletonType) {
                case 'text':
                  return (
                    <div key={i} className='space-y-2'>
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-4 w-3/4' />
                    </div>
                  );
                case 'list':
                  return (
                    <div key={i} className='flex items-center gap-4'>
                      <Skeleton className='h-12 w-12 rounded-full' />
                      <div className='flex-1 space-y-2'>
                        <Skeleton className='h-4 w-1/2' />
                        <Skeleton className='h-3 w-1/3' />
                      </div>
                    </div>
                  );
                case 'grid':
                  return (
                    <div key={i} className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className='space-y-3'>
                          <Skeleton className='h-48 w-full rounded-md' />
                          <Skeleton className='h-4 w-3/4' />
                          <Skeleton className='h-4 w-1/2' />
                        </div>
                      ))}
                    </div>
                  );
                case 'card':
                default:
                  return (
                    <div key={i} className='space-y-3'>
                      <Skeleton className='h-48 w-full rounded-md' />
                      <Skeleton className='h-4 w-3/4' />
                      <Skeleton className='h-4 w-1/2' />
                    </div>
                  );
              }
            })}
          </div>
        );
    }
  };

  const content = renderLoader();

  if (fullPage) {
    return (
      <div className={cn('flex min-h-[50vh] w-full items-center justify-center', className)}>
        {content}
      </div>
    );
  }

  return <div className={cn('w-full', className)}>{content}</div>;
};

// Convenience exports for common use cases
export const LoadingSpinner = (props: Omit<LoadingProps, 'type'>) => (
  <Loading {...props} type='spinner' />
);

export const LoadingSkeleton = (props: Omit<LoadingProps, 'type'>) => (
  <Loading {...props} type='skeleton' />
);

export const LoadingDots = (props: Omit<LoadingProps, 'type'>) => (
  <Loading {...props} type='dots' />
);

// Full page loader component
export const PageLoader = (props: Omit<LoadingProps, 'fullPage'>) => (
  <Loading {...props} fullPage={true} message={props.message || 'Loading...'} />
);

// Admin loading state component
export const AdminLoadingState = (props: LoadingProps & { text?: string }) => (
  <Loading {...props} variant='admin' message={props.text || props.message || 'Loading...'} />
);
