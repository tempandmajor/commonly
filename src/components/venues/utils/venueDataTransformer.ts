import { Venue, DisplayVenue } from '@/lib/types/venue';

export const transformVenueData = (venues: Venue[]): DisplayVenue[] => {
  return venues.map(venue => {
    // Handle location display
    let locationStr = 'Location not available';
    if (typeof venue.location === 'string') {
      locationStr = venue.location;
    } else if (venue.address && typeof venue.address === 'object') {
      const address = venue.address as Record<string, string>;
      const city = address.city || '';
      const state = address.state || '';
      locationStr = [city, state].filter(Boolean).join(', ') || 'Location not available';
    } else if (venue.address && typeof venue.address === 'string') {
      locationStr = venue.address;
    }

    // Handle capacity display
    let capacityNum = 0;
    if (typeof venue.capacity === 'number') {
      capacityNum = venue.capacity;
    } else if (venue.capacity && typeof venue.capacity === 'object') {
      capacityNum = (venue.capacity as unknown).seating || 0;
    }

    // Price handling with type checking
    const price = venue.pricePerHour ? `$${venue.pricePerHour}/hr` : 'Price on request';

    // Images with type checking
    const images = Array.isArray(venue.images) ? venue.images : [];

    return {
      id: venue.id,
      name: venue.name,
      location: locationStr,
      rating: venue.rating || 0,
      capacity: capacityNum,
      price,
      images,
    };
  });
};
