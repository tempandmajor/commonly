import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string | undefined;
  onAction?: () => void | undefined;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
}) => {
  return (
    <Card className='w-full'>
      <CardContent className='flex flex-col items-center justify-center py-12'>
        <div className='rounded-full bg-muted p-6 mb-4'>
          <Icon className='h-10 w-10 text-muted-foreground' />
        </div>
        <h3 className='text-xl font-medium mb-2'>{title}</h3>
        <p className='text-muted-foreground text-center max-w-md mb-6'>{description}</p>
        {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
