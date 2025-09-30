import { useForm } from 'react-hook-form';
import { EventFormValues, eventFormSchema } from '@/lib/validations/eventValidation';
import { zodResolver } from '@hookform/resolvers/zod';
import { EventCategory, EventType } from '@/lib/types/event';
import { useState, useEffect } from 'react';

export const useEventFormValidation = (communityId?: string, communityName?: string) => {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      bannerImage: '',
      description: '',
      category: EventCategory.MusicFestivals,
      type: EventType.InPerson,
      startDate: new Date(),
      endDate: new Date(),
      location: '',
      price: 0,
      isFree: true,
      maxTicketsPerPurchase: 10,
      isAllOrNothing: false,
      targetAmount: 5000,
      ageRestriction: 0,
      sponsorshipTiers: [],
      virtualEventDetails: {
        platform: '',
        url: '',
        hostInstructions: '',
        attendeeInstructions: '',
        streamSchedule: {
          startTime: new Date(),
          estimatedDuration: 60,
          isRecurring: false,
        },
        streamConfiguration: {
          quality: 'standard',
          recordingEnabled: false,
          chatEnabled: true,
          audienceInteractionEnabled: true,
        },
      },
    },
  });

  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (communityId) {
      form.setValue('communityId', communityId);
      form.setValue('communityName', communityName || 'Community Event');
    }
  }, [communityId, communityName, form]);

  // Set stream schedule start time to event start date by default
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'startDate' && value.startDate) {
        form.setValue('virtualEventDetails.streamSchedule.startTime', value.startDate);
      }

      if (name === 'type' && value.type === EventType.VirtualEvent) {
        // Set platform to "Commonly Live" for virtual events by default
        form.setValue('virtualEventDetails.platform', 'Commonly Live');
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return form;
};
