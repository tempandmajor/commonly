import { useState, useEffect } from 'react';
import type { Coordinates, LocationInfo } from '@/types/location';

export const useGeocoding = (coordinates: Coordinates) => {
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    city: null,
    state: null,
    country: null,
    formatted: null,
    loading: true,
    error: null,
    coordinates: { latitude: null, longitude: null },
  });

  useEffect(() => {
    if (coordinates.latitude && coordinates.longitude) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}&zoom=18&addressdetails=1`
      )
        .then(response => response.json())
        .then(data => {
          if (data.address) {
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.hamlet ||
              data.address.suburb ||
              null;
            const state = data.address.state || data.address.county || null;
            const country = data.address.country || null;

            let formatted = city;
            if (city && state) {
              formatted = `${city}, ${state}`;
            } else if (state) {
              formatted = state;
            } else if (country) {
              formatted = country;
            }

            setLocationInfo({
              city,
              state,
              country,
              formatted,
              loading: false,
              error: null,
              coordinates,
            });
          } else {
            throw new Error('No address found in the response');
          }
        })
        .catch(error => {
          setLocationInfo(prev => ({
          ...prev,
            loading: false,
            error: 'Failed to retrieve location details',
          }));
        });
    }
  }, [coordinates.latitude, coordinates.longitude]);

  return { locationInfo, setLocationInfo };
};
