import { useLocation } from 'react-router-dom';
import { useEventFormValidation } from './event/useEventFormValidation';
import { useEventSubmission } from './event/useEventSubmission';
import { useFormDraft } from './useFormDraft';
import { EventFormValues } from '@/lib/validations/eventValidation';

export const useEventForm = () => {
  const location = useLocation();
  const communityId = location.state?.communityId;
  const communityName = location.state?.communityName;

  const form = useEventFormValidation(communityId, communityName);
  const { handleSubmit: submitEvent } = useEventSubmission();
  const { clearDraft } = useFormDraft<EventFormValues>(form, 'eventFormDraft');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = form.getValues();
    const success = await submitEvent(values);
    if (success) {
      clearDraft();
    }
  };

  return {
    form,
    onSubmit,
    clearDraft,
    isCommunityEvent: !!communityId,
    communityName,
  };
};
