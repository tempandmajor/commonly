import * as React from 'react';
import { cn } from '@/lib/utils';

const ContextMenu = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const ContextMenuTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={className} {...props} />
);
ContextMenuTrigger.displayName = 'ContextMenuTrigger';

const ContextMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('bg-background border rounded p-2', className)} {...props} />
  )
);
ContextMenuContent.displayName = 'ContextMenuContent';

const ContextMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-2 py-1 hover:bg-muted rounded', className)} {...props} />
  )
);
ContextMenuItem.displayName = 'ContextMenuItem';

export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem };
