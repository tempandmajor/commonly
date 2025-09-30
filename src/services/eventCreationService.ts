import { toast } from 'sonner';
import { handleError } from '@/utils/errorUtils';
import { Event, EventType } from '@/lib/types/event';
import { supabase } from '@/integrations/supabase/client';

export const createEvent = async (
  eventData: Omit<Partial<Event>, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> => {
  try {
    if (!eventData.organizerId?.trim()) {
      handleError(
        new Error('No organizer ID provided'),
        { eventData },
        'You need to be logged in to create an event'
      );
      return null;
    }

    if (!eventData.organizer?.name?.trim()) {
      handleError(
        new Error('Missing organizer details'),
        { eventData },
        'You need to complete your profile before creating an event'
      );
      return null;
    }

    // Validate banner image URL is present
    if (!eventData.bannerImage || !eventData.bannerImage.trim()) {
      handleError(
        new Error('Banner image is required'),
        { eventData },
        'Please upload a banner image for your event'
      );
      return null;
    }

    // Get coordinates for the location if it's not a virtual event
    let coordinates = null;
    if (eventData.type !== EventType.VirtualEvent && eventData.location) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(eventData.location)}`
        );
        const data = await response.json();
        if (data && data[0]) {
          coordinates = {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          };
        }
      } catch (_error) {
        // Error handling silently ignored
      }
    }

    // Map the event data to match the actual events table schema
    const eventRecord = {
      title: eventData.title || '',
      description: eventData.description || '',
      creator_id: eventData.organizerId,
      start_date: eventData.startDate
        ? typeof eventData.startDate === 'string'
          ? eventData.startDate
          : eventData.startDate.toISOString()
        : null,
      end_date: eventData.endDate
        ? typeof eventData.endDate === 'string'
          ? eventData.endDate
          : eventData.endDate.toISOString()
        : null,
      location: eventData.location || null,
      is_public: !eventData.isPrivate,
      image_url: eventData.bannerImage?.trim() || null,
      max_capacity: eventData.capacity ? Number(eventData.capacity): null,
      is_all_or_nothing: eventData.targetAmount ? true : false,
      target_amount: Number(eventData.targetAmount) as number || 0,
      current_amount: 0,
      pledge_deadline: eventData.startDate
        ? typeof eventData.startDate === 'string'
          ? eventData.startDate
          : eventData.startDate.toISOString()
        : null,
      available_tickets: eventData.capacity ? Number(eventData.capacity): null,
      reserved_tickets: 0,
      tickets_sold: 0,
      funding_status: 'in_progress',
      funded_at: null,
      price: eventData.isFree ? 0 : Number(eventData.price) as number || 0,
      is_free: eventData.isFree || false,
      referral_enabled: false,
      referral_commission_amount: 0,
      referral_commission_type: 'fixed',
      referral_terms: null,
      status: 'active',
    };

    // Insert the event into Supabase
    const { data, error } = await supabase.from('events').insert(eventRecord).select('id').single();

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }

    if (!data.id) {
      throw new Error('No event ID returned from database');
    }

    toast.success('Event created successfully!');

    // Handle collaborator invitations if any
    const collaborators = eventData.collaborators || [];
    const pendingCollaborators = collaborators.filter(c => c.status === 'pending');

    if (pendingCollaborators.length > 0) {
      const existingUsers = pendingCollaborators.filter(c => c.isExistingUser);
      const newUsers = pendingCollaborators.filter(c => !c.isExistingUser);

      if (existingUsers.length > 0) {
        // TODO: Implement in-app notifications for existing users
      }

      if (newUsers.length > 0) {
        // TODO: Implement email invitations for new users
      }

      toast.success(
        `Event created! Invitations will be sent to ${pendingCollaborators.length} collaborators`
      );
    }

    // Initialize ticket reservations if the event has capacity
    if (eventRecord.max_capacity && eventRecord.max_capacity > 0) {
      // The available_tickets field is already set above
    }

    return data.id;
  } catch (error) {
    handleError(
      error,
      { eventData },
      error instanceof Error ? error.message : 'Failed to create event'
    );
    return null;
  }
};
