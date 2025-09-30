import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  isSaving: boolean;
  isDisabled: boolean;
  onSubmit?: () => void | undefined;
}

const FormActions: React.FC<FormActionsProps> = ({ isSaving, isDisabled, onSubmit }) => {
  return (
    <Button type='submit' disabled={isSaving || isDisabled} onClick={onSubmit}>
      {isSaving ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Saving...
        </>
      ) : (
        'Save Profile'
      )}
    </Button>
  );
};

export default FormActions;
