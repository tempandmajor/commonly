import * as React from 'react';
import { cn } from '@/lib/utils';

const ResizablePanelGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { direction?: 'horizontal' | 'vertical' }
>(({ className, direction = 'horizontal', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full',
      direction === 'vertical' ? 'flex-col' : 'flex-row',
      className
    )}
    {...props}
  />
));
ResizablePanelGroup.displayName = 'ResizablePanelGroup';

const ResizablePanel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex-1', className)} {...props} />
);
ResizablePanel.displayName = 'ResizablePanel';

const ResizableHandle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('w-px bg-border', className)} {...props} />
  )
);
ResizableHandle.displayName = 'ResizableHandle';

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
