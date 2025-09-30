import { useState, useEffect } from 'react';
import type { LocationInfo } from '@/types/location';

interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export const useReverseGeocoding = (coordinates: Coordinates) => {
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    city: null,
    state: null,
    country: null,
    formatted: null,
    loading: false,
    error: null,
    coordinates: { latitude: null, longitude: null },
  });

  useEffect(() => {
    if (coordinates.latitude && coordinates.longitude) {
      setLocationInfo(prev => ({
          ...prev,
        loading: true,
        error: null,
        coordinates,
      }));

      // Format a basic location string as a temporary value while loading
      const formattedLocation = `${coordinates.latitude.toFixed(2)}, ${coordinates.longitude.toFixed(2)}`;

      // Update with coordinates immediately while we wait for geocoding
      setLocationInfo(prev => ({
          ...prev,
        formatted: 'Loading location...',
        loading: true,
      }));

      // Use Nominatim for reverse geocoding
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}&zoom=10&addressdetails=1`
      )
        .then(response => {
          if (!response.ok) {
            throw new Error(`Geocoding API responded with status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.address) {
            // Try multiple fields to get the best city name
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.hamlet ||
              data.address.suburb ||
              null;

            const state = data.address.state || data.address.county || null;

            const country = data.address.country || null;

            // Format display string, prioritizing human-readable names
            let formatted = null;
            if (city && state) {
              formatted = `${city}, ${state}`;
            } else if (city) {
              formatted = city;
            } else if (state) {
              formatted = state;
            } else if (country) {
              formatted = country;
            } else {
              // Fall back to a display name if available
              formatted = data.display_name
                ? data.display_name.split(',').slice(0, 2).join(',')
                : null;
            }

            // If we still don't have a good name, use the original location name
            if (!formatted && data.name) {
              formatted = data.name;
            }

            // If we found a proper location name, use it
            if (formatted) {
              setLocationInfo({
                city,
                state,
                country,
                formatted,
                loading: false,
                error: null,
                coordinates,
              });

              // Save the location info to localStorage
              try {
                localStorage.setItem(
                  'userLocation',
                  JSON.stringify({
                    city,
                    state,
                    country,
                    formatted,
                    coordinates,
                  })
                );
              } catch (_error) {
                // Error handling silently ignored
              }
            } else {
              // If we couldn't get a readable name, use a nicer format of the coordinates
              const niceCoordinates = `Near ${coordinates.latitude.toFixed(4)}°, ${coordinates.longitude.toFixed(4)}°`;
              setLocationInfo(prev => ({
          ...prev,
                formatted: niceCoordinates,
                loading: false,
              }));
            }
          } else {
            throw new Error('No address found in the response');
          }
        })
        .catch(error => {
          // On error, fall back to nice coordinates format
          const niceCoordinates = `Near ${coordinates.latitude.toFixed(4)}°, ${coordinates.longitude.toFixed(4)}°`;
          setLocationInfo(prev => ({
          ...prev,
            formatted: niceCoordinates,
            loading: false,
            error: 'Failed to retrieve location details',
          }));
        });
    }
  }, [coordinates.latitude, coordinates.longitude]);

  return { locationInfo, setLocationInfo };
};
