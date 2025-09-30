import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormActionsProps {
  isSubmitting?: boolean | undefined;
  isDisabled?: boolean | undefined;
  submitLabel?: string | undefined;
  cancelLabel?: string | undefined;
  showCancel?: boolean | undefined;
  showSaveDraft?: boolean | undefined;
  onCancel?: () => void | undefined;
  onSaveDraft?: () => void | undefined;
  className?: string | undefined;
  align?: 'left' | undefined| 'center' | 'right' | 'between';
  submitIcon?: React.ReactNode | undefined;
  fullWidth?: boolean | undefined;
}

export const FormActions: React.FC<FormActionsProps> = ({
  isSubmitting = false,
  isDisabled = false,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  showCancel = false,
  showSaveDraft = false,
  onCancel,
  onSaveDraft,
  className,
  align = 'right',
  submitIcon,
  fullWidth = false,
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={cn('flex items-center gap-3 pt-6', alignmentClasses[align], className)}>
      {showCancel && (
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={isSubmitting}
          className={cn(fullWidth && 'flex-1')}
        >
          <X className='mr-2 h-4 w-4' />
          {cancelLabel}
        </Button>
      )}

      {showSaveDraft && (
        <Button
          type='button'
          variant='secondary'
          onClick={onSaveDraft}
          disabled={isSubmitting || isDisabled}
          className={cn(fullWidth && 'flex-1')}
        >
          <Save className='mr-2 h-4 w-4' />
          Save Draft
        </Button>
      )}

      <Button
        type='submit'
        disabled={isSubmitting || isDisabled}
        className={cn(fullWidth && 'flex-1')}
      >
        {isSubmitting ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Processing...
          </>
        ) : (
          <>
            {submitIcon && <span className='mr-2'>{submitIcon}</span>}
            {submitLabel}
          </>
        )}
      </Button>
    </div>
  );
};
