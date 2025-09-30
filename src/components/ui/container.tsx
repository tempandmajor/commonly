import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string | undefined;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-2xl', className)}>
      {children}
    </div>
  );
}
