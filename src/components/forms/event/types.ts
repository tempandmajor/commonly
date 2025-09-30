import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/validations/eventValidation';

export interface BasicEventInfoProps {
  form: UseFormReturn<EventFormValues>;
  isLoading: boolean;
}
