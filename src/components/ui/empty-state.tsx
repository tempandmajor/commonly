import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string | undefined;
  icon?: React.ReactNode | undefined;
  action?: React.ReactNode | undefined;
  className?: string | undefined;
}

export const EmptyState = ({ title, description, icon, action, className }: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center',
        className
      )}
    >
      {icon && <div className='mb-4 text-muted-foreground'>{icon}</div>}
      <h3 className='mb-2 text-xl font-semibold'>{title}</h3>
      {description && <p className='mb-6 max-w-sm text-muted-foreground'>{description}</p>}
      {action}
    </div>
  );
};
