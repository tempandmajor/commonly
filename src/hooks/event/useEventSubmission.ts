import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createEvent } from '@/services/eventCreationService';
import { useAuth } from '@/providers/AuthProvider';
import { EventFormValues } from '@/lib/validations/eventValidation';
import { v4 as uuidv4 } from 'uuid';
import { EventType, EventCollaborator } from '@/lib/types/event';

interface ProcessedTier {
  id: string;
  name: string;
  price: number;
  description: string;
  benefits: string[];
  maxSponsors?: number | undefined;
  currentSponsors: number;
  sponsors: any[];
}

interface VirtualEventDetails {
  platform: string;
  url: string;
  hostInstructions?: string | undefined;
  attendeeInstructions?: string | undefined;
}

interface EventSubmissionData extends Omit<EventFormValues, 'startDate' | 'endDate' | 'price' | 'capacity' | 'maxTicketsPerPurchase' | 'ageRestriction'> {
  startDate: Date;
  endDate?: Date;
  price?: number;
  capacity?: number;
  maxTicketsPerPurchase?: number;
  ageRestriction?: number;
  sponsorshipTiers: ProcessedTier[];
  collaborators: EventCollaborator[];
  organizerId: string;
  organizer: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  virtualEventDetails?: VirtualEventDetails;
}

interface UseEventSubmissionReturn {
  handleSubmit: (values: EventFormValues) => Promise<boolean>;
  isSubmitting: boolean;
}

export const useEventSubmission = (): UseEventSubmissionReturn => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const validateEventData = useCallback((values: EventFormValues): string | null => {
    if (!user) {
      return 'You must be logged in to create an event.';
    }

    if (!values.bannerImage || values.bannerImage.trim() === '') {
      return 'Please upload a banner image for your event';
    }

    if (!values.title || values.title.trim() === '') {
      return 'Event title is required';
    }

    if (!values.description || values.description.trim() === '') {
      return 'Event description is required';
    }

    if (!values.startDate) {
      return 'Start date is required';
    }

    const startDate = new Date(values.startDate);
    if (startDate <= new Date()) {
      return 'Start date must be in the future';
    }

    if (values.endDate) {
      const endDate = new Date(values.endDate);
      if (endDate <= startDate) {
        return 'End date must be after start date';
      }
    }

    if (values.type === EventType.VirtualEvent) {
      if (!values.virtualEventDetails?.platform) {
        return 'Virtual event platform is required';
      }
      if (!values.virtualEventDetails?.url) {
        return 'Virtual event URL is required';
      }
    }

    return null;
  }, [user]);

  const processSponsorshipTiers = useCallback((tiers: any[]): ProcessedTier[] => {
    return (tiers || []).map(tier => ({
      id: tier.id || uuidv4(),
      name: tier.name || '',
      price: Number(tier.price) || 0,
      description: tier.description || '',
      benefits: Array.isArray(tier.benefits) ? tier.benefits : [],
          ...(tier.maxSponsors && { maxSponsors: Number(tier.maxSponsors) }),
      currentSponsors: Number(tier.currentSponsors) || 0,
      sponsors: Array.isArray(tier.sponsors) ? tier.sponsors : [],
    }));
  }, []);

  const processCollaborators = useCallback((collaborators: any[]): EventCollaborator[] => {
    return (collaborators || []).map(collaborator => ({
      id: collaborator.id || uuidv4(),
      email: collaborator.email,
      name: collaborator.name || '',
      role: collaborator.role || 'co-organizer',
      status: collaborator.status || 'pending',
      isExistingUser: Boolean(collaborator.isExistingUser),
    }));
  }, []);

  const processVirtualEventDetails = useCallback((
    type: EventType,
    details?: any
  ): VirtualEventDetails | undefined => {
    if (type !== EventType.VirtualEvent) {
      return undefined;
    }

    return {
      platform: details?.platform || '',
      url: details?.url || '',
      hostInstructions: details?.hostInstructions || '',
      attendeeInstructions: details?.attendeeInstructions || '',
    };
  }, []);

  const handleSubmit = useCallback(async (values: EventFormValues): Promise<boolean> => {
    try {
      const validationError = validateEventData(values);
      if (validationError) {
        toast.error(validationError);
        return false;
      }

      if (!user) {
        toast.error('Authentication required');
        return false;
      }

      const processedTiers = processSponsorshipTiers(values.sponsorshipTiers);
      const collaborators = processCollaborators(values.collaborators);

      const startDate = new Date(values.startDate);
      const endDate = values.endDate ? new Date(values.endDate) : undefined;

      const virtualEventDetails = processVirtualEventDetails(
        values.type,
        values.virtualEventDetails
      );

      const eventData: EventSubmissionData = {
          ...values,
        startDate,
        endDate,
          ...(values.price && values.price !== '' && { price: Number(values.price) }),
          ...(values.capacity && { capacity: Number(values.capacity) }),
          ...(values.maxTicketsPerPurchase && { maxTicketsPerPurchase: Number(values.maxTicketsPerPurchase) }),
          ...(values.ageRestriction && values.ageRestriction !== '' && { ageRestriction: Number(values.ageRestriction) }),
        sponsorshipTiers: processedTiers,
        collaborators,
        organizerId: user.id,
        organizer: {
          id: user.id,
          name: user.name || user.email?.split('@')[0] || 'Unknown User',
          username: user.email?.split('@')[0] || 'unknown',
          avatar: user.profilePicture || '',
        },
        virtualEventDetails,
      };

      const eventId = await createEvent(eventData);

      if (eventId) {
        toast.success('Event created successfully!', {
          description: 'Your event has been published and is now live.',
        });

        if (values.communityId) {
          navigate(`/community/${values.communityId}`, {
            state: { eventCreated: true, eventId }
          });
        } else {
          navigate(`/events/${eventId}`);
        }

        return true;
      } else {
        toast.error('Failed to create event', {
          description: 'Please check your event details and try again.',
        });
        return false;
      }

    } catch (error) {
      console.error('Event creation error:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : 'An unexpected error occurred';

      toast.error('Failed to create event', {
        description: errorMessage,
      });

      return false;
    }

  }, [
    user,
    navigate,
    validateEventData,
    processSponsorshipTiers,
    processCollaborators,
    processVirtualEventDetails,

  ]);

  return {
    handleSubmit,
    isSubmitting: false, // This could be enhanced with actual loading state management
  };

};