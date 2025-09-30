import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  description?: string | undefined;
  icon?: React.ReactNode | undefined;
  children: React.ReactNode;
  collapsible?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  className?: string | undefined;
  required?: boolean | undefined;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  icon,
  children,
  collapsible = false,
  defaultOpen = true,
  className,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <Card className={cn('border-0 shadow-none', className)}>
        <CardHeader className='px-0 pb-6'>
          <CardTitle className='text-lg font-semibold'>
            {title}
            {required && <span className='text-destructive ml-1'>*</span>}
          </CardTitle>
          {description && <CardDescription className='mt-1.5'>{description}</CardDescription>}
        </CardHeader>
        <CardContent className='px-0'>{children}</CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn('flex items-start justify-between', collapsible && 'cursor-pointer')}

        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
      >
        <div className='flex items-start gap-3'>
          {icon && <div className='mt-0.5 text-muted-foreground'>{icon}</div>}
          <div>
            <h3 className='text-lg font-medium'>{title}</h3>
            {description && <p className='text-sm text-muted-foreground mt-1'>{description}</p>}
          </div>
        </div>
        {collapsible && (
          <button
            type='button'
            className='text-muted-foreground hover:text-foreground transition-colors'
          >
            {isOpen ? <ChevronUp className='h-5 w-5' /> : <ChevronDown className='h-5 w-5' />}
          </button>
        )}
      </div>

      {(!collapsible || isOpen) && <div className={cn(icon && 'ml-8')}>{children}</div>}
    </div>

  );

};

export { FormSection };
export default FormSection;
