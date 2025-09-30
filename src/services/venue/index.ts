export * from './venueOperations';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { handleError } from '@/utils/errorUtils';

/**
 * Updates the status of a venue in the database
 * @param venueId - The ID of the venue to update
 * @param status - The new status to set (pending, active, suspended)
 * @returns Promise resolving to a boolean indicating success or failure
 */
export const updateVenueStatus = async (
  venueId: string,
  status: 'pending' | 'active' | 'suspended'
): Promise<boolean> => {
  try {
    // Update the venue status in the database
    const { error } = await supabase
      .from('venues')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', venueId);

    if (error) throw error;

    // Log the status change event
    await supabase.from('Events').insert({
      event_type: 'venue_status_change',
      event_object_id: venueId,
      event_data: JSON.stringify({
        status,
        timestamp: new Date().toISOString(),
      }),
    });

    // Show success message
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    toast.success(`Venue status updated to ${statusText}`);

    return true;
  } catch (error) {
    handleError(error, { venueId, status }, 'Failed to update venue status');
    toast.error('Could not update venue status');
    return false;
  }
};

/**
 * Toggles the featured status of a venue
 * @param venueId - The ID of the venue to toggle featured status
 * @returns Promise resolving to a boolean indicating success or failure
 */
export const toggleFeatured = async (venueId: string): Promise<boolean> => {
  try {
    // First get the current featured status
    const { data: venue, error: fetchError } = await supabase
      .from('venues')
      .select('id, is_featured')
      .eq('id', venueId)
      .single();

    if (fetchError) throw fetchError;
    if (!venue) throw new Error(`Venue with ID ${venueId} not found`);

    // Toggle the featured status
    const newFeaturedStatus = !venue.is_featured;

    // Update the venue in the database
    const { error: updateError } = await supabase
      .from('venues')
      .update({
        is_featured: newFeaturedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', venueId);

    if (updateError) throw updateError;

    // Log the featured status change
    await supabase.from('Events').insert({
      event_type: 'venue_featured_change',
      event_object_id: venueId,
      event_data: JSON.stringify({
        is_featured: newFeaturedStatus,
        timestamp: new Date().toISOString(),
      }),
    });

    // Show success message
    const statusText = newFeaturedStatus ? 'featured' : 'unfeatured';
    toast.success(`Venue ${statusText} successfully`);

    return true;
  } catch (error) {
    handleError(error, { venueId }, 'Failed to toggle venue featured status');
    toast.error('Could not update venue featured status');
    return false;
  }
};
