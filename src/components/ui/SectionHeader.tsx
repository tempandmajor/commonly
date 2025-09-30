import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string | undefined;
  actions?: React.ReactNode | undefined;
  className?: string | undefined;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between',
        className
      )}
    >
      <div>
        <h1 className='text-3xl font-bold text-[#2B2B2B]'>{title}</h1>
        {subtitle && <p className='text-gray-600'>{subtitle}</p>}
      </div>
      {actions && <div className='flex items-center gap-2'>{actions}</div>}
    </div>
  );
};

export default SectionHeader;
