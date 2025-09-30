import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ListCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode | undefined;
  media?: React.ReactNode | undefined; // image/avatar/icon
  meta?: React.ReactNode | undefined; // right-aligned meta (price, status, etc.)
  actions?: React.ReactNode | undefined;
  className?: string | undefined;
  children?: React.ReactNode | undefined; // extra body content
}

export const ListCard: React.FC<ListCardProps> = ({
  title,
  subtitle,
  media,
  meta,
  actions,
  className,
  children,
}) => {
  return (
    <Card
      className={cn(
        'overflow-hidden border border-gray-200 hover:shadow-sm transition-shadow',
        className
      )}
    >
      <CardContent className='p-4'>
        <div className='flex items-start gap-4'>
          {media && <div className='shrink-0'>{media}</div>}
          <div className='flex-1'>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <div className='font-semibold text-[#2B2B2B]'>{title}</div>
                {subtitle && <div className='text-sm text-gray-600'>{subtitle}</div>}
              </div>
              {meta && <div className='text-sm text-gray-600'>{meta}</div>}
            </div>
            {children && <div className='mt-3 text-sm text-gray-700'>{children}</div>}
            {actions && <div className='mt-3 flex items-center gap-2'>{actions}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListCard;
