import * as React from 'react';
import { cn } from '@/lib/utils';

// Placeholder chart components since recharts is not available
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: Record<string, unknown>;
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, children, config, ...props }, ref) => (
    <div ref={ref} className={cn('w-full h-full', className)} {...props}>
      {children}
    </div>
  )
);
ChartContainer.displayName = 'ChartContainer';

const ChartTooltip = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

const ChartTooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-background p-2 shadow-sm', className)}
      {...props}
    />
  )
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

export { ChartContainer, ChartTooltip, ChartTooltipContent };
