import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Venue } from '@/types/admin';

export interface Caterer {
  id: string;
  name: string;
  owner: string;
  specialty: string;
  location: string;
  rating: number;
  orders: number;
  revenue: string;
  status: 'active' | 'pending' | 'suspended';
}

export interface Booking {
  id: string;
  event: string;
  venue: string;
  caterer?: string | undefined;
  date: string;
  attendees: number;
  total: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export const useBusinessManagement = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [caterers, setCaterers] = useState<Caterer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*, users!venues_owner_id_fkey(id, full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVenues((data || []).map((venue: any) => ({
        id: venue.id,
        name: venue.name,
        description: venue.description,
        capacity: venue.capacity,
        location: venue.location,
        owner: venue.users ? {
          id: venue.users.id,
          name: venue.users.full_name || 'Unknown',
        } : undefined,
        status: venue.status as 'active' | 'pending' | 'suspended',
        featured: venue.featured || false,
        bookingCount: 0, // TODO: Calculate from bookings
        rating: venue.rating || 0,
        pricePerHour: venue.price_per_hour,
        images: venue.images || [],
        createdAt: venue.created_at,
        updatedAt: venue.updated_at,
      })));
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast.error('Failed to load venues');
    }
  };

  const fetchCaterers = async () => {
    try {
      const { data, error } = await supabase
        .from('caterers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCaterers((data || []).map((caterer: any) => ({
        id: caterer.id,
        name: caterer.business_name,
        owner: caterer.owner_name || 'Unknown',
        specialty: caterer.specialty || 'General',
        location: caterer.location || 'Unknown',
        rating: caterer.rating || 0,
        orders: 0, // TODO: Calculate from bookings
        revenue: '$0.00',
        status: caterer.status as 'active' | 'pending' | 'suspended',
      })));
    } catch (error) {
      console.error('Error fetching caterers:', error);
      toast.error('Failed to load caterers');
    }
  };

  const fetchBookings = async () => {
    try {
      // Fetch venue bookings
      const { data: venueBookings, error: venueError } = await supabase
        .from('venue_bookings')
        .select('*, venues(name), events(name, attendee_count)')
        .order('booking_date', { ascending: false })
        .limit(50);

      if (venueError) throw venueError;

      setBookings((venueBookings || []).map((booking: any) => ({
        id: booking.id,
        event: booking.events?.name || 'Unknown Event',
        venue: booking.venues?.name || 'Unknown Venue',
        date: booking.booking_date,
        attendees: booking.events?.attendee_count || 0,
        total: `$${booking.total_price || 0}.toFixed(2)}`,
        status: booking.status as 'confirmed' | 'pending' | 'cancelled',
      })));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    }
  };

  const approveVenue = async (venueId: string) => {
    try {
      const { error } = await supabase
        .from('venues')
        .update({ status: 'active' })
        .eq('id', venueId);

      if (error) throw error;
      toast.success('Venue approved successfully');
      await fetchVenues();
    } catch (error) {
      console.error('Error approving venue:', error);
      toast.error('Failed to approve venue');
    }
  };

  const suspendVenue = async (venueId: string) => {
    try {
      const { error } = await supabase
        .from('venues')
        .update({ status: 'suspended' })
        .eq('id', venueId);

      if (error) throw error;
      toast.success('Venue suspended successfully');
      await fetchVenues();
    } catch (error) {
      console.error('Error suspending venue:', error);
      toast.error('Failed to suspend venue');
    }
  };

  const deleteVenue = async (venueId: string) => {
    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (error) throw error;
      toast.success('Venue deleted successfully');
      await fetchVenues();
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast.error('Failed to delete venue');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVenues(), fetchCaterers(), fetchBookings()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    venues,
    caterers,
    bookings,
    loading,
    approveVenue,
    suspendVenue,
    deleteVenue,
    refresh: async () => {
      await Promise.all([fetchVenues(), fetchCaterers(), fetchBookings()]);
    },
  };
};