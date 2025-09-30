import { useState, useEffect } from 'react';
import { fetchEventsNearLocation, saveUserLocation } from '@/services/api/locationAPI';

export const useUserLocationEvents = (userId: string | undefined) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get browser location on mount if available
  useEffect(() => {
    if (!location) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => setError('Unable to get your location')
        );
      }
    }
  }, [location]);

  // Fetch events when location changes
  useEffect(() => {
    if (location) {
      setLoading(true);
      fetchEventsNearLocation(location.lat, location.lng)
        .then(setEvents)
        .catch(() => setError('Failed to fetch events'))
        .finally(() => setLoading(false));
    }
  }, [location]);

  // Allow user to change location
  const changeLocation = (lat: number, lng: number) => {
    setLocation({ lat, lng });
    if (userId) saveUserLocation(userId, `${lat},${lng}`);
  };

  return {
    location,
    events,
    loading,
    error,
    changeLocation,
  };
};
