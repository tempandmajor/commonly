import { useState, useCallback } from 'react';

// API keys management (to be moved server-side in production)
// This is a temporary implementation until we set up a server-side proxy
const GEOCODING_APIS = {
  NOMINATIM: 'nominatim',
  GOOGLE: 'google',
};

type GeocodeResult = {
  city: string | null;
  state: string | null;
  country: string | null;
  formatted: string | null;
  coordinates?: {
    latitude: number | null;
    longitude: number | null;
  };
};

const GEOCODING_API_PRIORITY = [GEOCODING_APIS.NOMINATIM, GEOCODING_APIS.GOOGLE];

export const useLocationService = () => {
  const [lastUsedApi, setLastUsedApi] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to geocode coordinates into readable location information
  const geocodeCoordinates = useCallback(
    async (
      latitude: number,
      longitude: number,
      forceApi?: string
    ): Promise<GeocodeResult | null> => {
      setIsLoading(true);
      setError(null);

      // Try each API in order of priority, or use forced API if specified
      const apiOrder = forceApi
        ? [forceApi, ...GEOCODING_API_PRIORITY.filter(api => api !== forceApi)]
        : GEOCODING_API_PRIORITY;

      for (const api of apiOrder) {
        try {
          let result: GeocodeResult | null = null;

          if (api === GEOCODING_APIS.NOMINATIM) {
            result = await geocodeWithNominatim(latitude, longitude);
          } else if (api === GEOCODING_APIS.GOOGLE && window.google?.maps) {
            result = await geocodeWithGoogle(latitude, longitude);
          }

          if (result) {
            setLastUsedApi(api);
            setIsLoading(false);
            return result;
          }
        } catch (err) {
          // Continue to next API on failure
        }
      }

      // All APIs failed
      setError('Unable to retrieve location information');
      setIsLoading(false);
      return null;
    },
    []
  );

  // Reverse geocode with Nominatim (OpenStreetMap)
  const geocodeWithNominatim = async (
    latitude: number,
    longitude: number
  ): Promise<GeocodeResult | null> => {
    // Implement exponential backoff for retries
    const maxRetries = 3;
    let retryCount = 0;
    let delay = 1000; // Start with 1 second delay

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'CommonlyApp/1.0', // Identify our app properly
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const _data = await response.json();

        if (!data || !data.address) {
          throw new Error('Invalid response format');
        }

        // Extract location components with better fallbacks
        const city =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.hamlet ||
          data.address.suburb;

        const state = data.address.state || data.address.county;

        const country = data.address.country;

        // Create a readable formatted string
        let formatted = null;

        if (city && state) {
          formatted = `${city}, ${state}`;
        } else if (city) {
          formatted = city;
        } else if (state && country) {
          formatted = `${state}, ${country}`;
        } else if (state) {
          formatted = state;
        } else if (country) {
          formatted = country;
        } else if (data.display_name) {
          // Fallback to first part of display name if nothing else is available
          formatted = data.display_name.split(',').slice(0, 2).join(',');
        }

        return {
          city,
          state,
          country,
          formatted: formatted || 'Unknown location',
          coordinates: { latitude, longitude },
        };
      } catch (error) {
        retryCount++;

        if (retryCount < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Double the delay for next retry
        } else {
          throw error; // Propagate the error after all retries fail
        }
      }
    }

    return null;
  };

  // Reverse geocode with Google Maps API (if available)
  const geocodeWithGoogle = async (
    latitude: number,
    longitude: number
  ): Promise<GeocodeResult | null> => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        return reject(new Error('Google Maps API not available'));
      }

      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat: latitude, lng: longitude };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          // Process Google's response
          let city = null;
          let state = null;
          let country = null;

          // Extract address components
          for (const component of results[0].address_components || []) {
            if (component.types.includes('locality')) {
              city = component.long_name;
            } else if (component.types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (component.types.includes('country')) {
              country = component.long_name;
            }
          }

          let formatted = results[0].formatted_address?.split(',').slice(0, 2).join(',') || null;
          if (!formatted && city && state) {
            formatted = `${city}, ${state}`;
          } else if (!formatted && city) {
            formatted = city;
          }

          resolve({
            city,
            state,
            country,
            formatted,
            coordinates: { latitude, longitude },
          });
        } else {
          reject(new Error(`Google Geocoding failed: ${status}`));
        }
      });
    });
  };

  // Geocode an address string to coordinates
  const geocodeAddress = useCallback(
    async (
      address: string
    ): Promise<{
      latitude: number;
      longitude: number;
    } | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Try Nominatim first
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
        );

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const _data = await response.json();

        if (data && data.length > 0) {
          const result = {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          };

          setIsLoading(false);
          return result;
        }

        // Fall back to Google if available
        if (window.google?.maps) {
          return new Promise(resolve => {
            const geocoder = new window.google.maps.Geocoder();

            geocoder.geocode({ address }, (results, status) => {
              if (status === 'OK' && results && results.length > 0) {
                const location = results[0].geometry.location;
                resolve({
                  latitude: location.lat(),
                  longitude: location.lng(),
                });
              } else {
                setError('Could not find coordinates for this address');
                resolve(null);
              }
              setIsLoading(false);
            });
          });
        }

        setError('Could not find coordinates for this address');
        setIsLoading(false);
        return null;
      } catch (error) {
        setError('Failed to convert address to coordinates');
        setIsLoading(false);
        return null;
      }
    },
    []
  );

  return {
    geocodeCoordinates,
    geocodeAddress,
    isLoading,
    error,
    lastUsedApi,
  };
};
