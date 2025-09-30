import * as React from 'react';
import { cn } from '@/lib/utils';
import { toggleVariants } from '@/components/ui/toggle';

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center justify-center gap-1', className)} {...props}>
      {children}
    </div>
  )
);
ToggleGroup.displayName = 'ToggleGroup';

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
    pressed?: boolean;
  }
>(({ className, children, value, pressed, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      toggleVariants({ variant: 'outline', size: 'default' }),
      pressed && 'bg-accent text-accent-foreground',
      className
    )}
    data-state={pressed ? 'on' : 'off'}
    {...props}
  >
    {children}
  </button>
));
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
