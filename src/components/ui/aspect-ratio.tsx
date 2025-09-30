import * as React from 'react';

interface AspectRatioProps {
  ratio?: number | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 1, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: `${100 / ratio}%`,
      }}
      {...props}
    >
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </div>
  )
);
AspectRatio.displayName = 'AspectRatio';

export { AspectRatio };
