import * as React from 'react';
import { cn } from '@/lib/utils';

const HoverCard = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const HoverCardTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('cursor-pointer', className)} {...props} />
  )
);
HoverCardTrigger.displayName = 'HoverCardTrigger';

const HoverCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('bg-background border rounded p-2', className)} {...props} />
  )
);
HoverCardContent.displayName = 'HoverCardContent';

export { HoverCard, HoverCardTrigger, HoverCardContent };
