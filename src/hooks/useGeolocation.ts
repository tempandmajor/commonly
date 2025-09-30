import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Coordinates, LocationInfo, GeolocationHookReturn } from '@/types/location';

// Global state to prevent multiple hooks from conflicting
let globalLocationState: LocationInfo | null = null;
const globalStateSubscribers: Set<(state: LocationInfo) => void> = new Set();

const updateGlobalState = (newState: LocationInfo) => {
  globalLocationState = newState;
  globalStateSubscribers.forEach(callback => callback(newState));
};

export const useGeolocation = (): GeolocationHookReturn => {
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: null,
    longitude: null,
  });

  const [locationInfo, setLocationInfo] = useState<LocationInfo>(() => {
    // Initialize with global state if available
    if (globalLocationState) {
      return globalLocationState;
    }

    // Check for saved manual location
    const savedLocation = localStorage.getItem('manualLocation');
    if (savedLocation) {
      const initialState = {
        city: savedLocation,
        state: null,
        country: null,
        formatted: savedLocation,
        loading: false,
        error: null,
        coordinates: {
          latitude: null,
          longitude: null,
        },
      };
      updateGlobalState(initialState);
      return initialState;
    }

    // Default state
    const defaultState = {
      city: null,
      state: null,
      country: null,
      formatted: null,
      loading: false,
      error: null,
      coordinates: {
        latitude: null,
        longitude: null,
      },
    };
    updateGlobalState(defaultState);
    return defaultState;
  });

  const [customPromptShown, setCustomPromptShown] = useState(false);
  const [manualLocationSet, setManualLocationSet] = useState(() => {
    return !!localStorage.getItem('manualLocation');
  });
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);

  const mounted = useRef(true);
  const isGettingLocation = useRef(false);
  const lastLocationFetch = useRef<number>(0);
  const hasCoordinates = useRef(false);
  const LOCATION_THROTTLE = 60000; // 1 minute throttle

  // Subscribe to global state changes
  useEffect(() => {
    const handleGlobalStateChange = (newState: LocationInfo) => {
      if (mounted.current) {
        setLocationInfo(newState);
      }
    };

    globalStateSubscribers.add(handleGlobalStateChange);

    return () => {
      globalStateSubscribers.delete(handleGlobalStateChange);
    };
  }, []);

  // Update hasCoordinates ref when coordinates change
  useEffect(() => {
    hasCoordinates.current = !!locationInfo.coordinates.latitude;
  }, [locationInfo.coordinates.latitude]);

  const updateLocationState = useCallback((updates: Partial<LocationInfo>) => {
    setLocationInfo(current => {
      const newState = { ...current, ...updates };
      updateGlobalState(newState);
      return newState;
    });
  }, []);

  const setManualLocation = useCallback((location: string) => {
    if (!mounted.current || !location.trim()) return;

    // Save to localStorage
    localStorage.setItem('manualLocation', location);

    setLocationInfo(current => {
      const newState: LocationInfo = {
        city: location,
        state: null,
        country: null,
        formatted: location,
        loading: false,
        error: null,
        coordinates: current.coordinates,
      };

      updateGlobalState(newState);
      return newState;
    });

    setManualLocationSet(true);
    setCustomPromptShown(false);
  }, []);

  const clearManualLocation = useCallback(() => {
    if (!mounted.current) return;

    console.debug('Geolocation: Clearing manual location');
    localStorage.removeItem('manualLocation');
    setManualLocationSet(false);

    const newState: LocationInfo = {
      city: null,
      state: null,
      country: null,
      formatted: null,
      loading: false,
      error: null,
      coordinates: {
        latitude: null,
        longitude: null,
      },
    };

    setLocationInfo(newState);
    updateGlobalState(newState);
    console.debug('Geolocation: Location cleared successfully');
  }, []);

  const getLocation = useCallback(
    async (forceRefresh = false) => {
      if (!mounted.current || isGettingLocation.current) return;

      // Don't auto-fetch if we have a manual location unless forced
      if (manualLocationSet && !forceRefresh) {
        return;
      }

      // Throttle location requests unless forced
      const now = Date.now();
      if (!forceRefresh && now - lastLocationFetch.current < LOCATION_THROTTLE) {
        return;
      }

      // Don't auto-fetch if we already have coordinates unless forced
      if (hasCoordinates.current && !forceRefresh) {
        return;
      }

      isGettingLocation.current = true;
      lastLocationFetch.current = now;

      if (!mounted.current) return;

      updateLocationState({ loading: true, error: null });

      try {
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Location request timed out'));
          }, 10000);

          navigator.geolocation.getCurrentPosition(
            pos => {
              clearTimeout(timeoutId);
              resolve(pos);
            },
            err => {
              clearTimeout(timeoutId);
              reject(err);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes cache
            }
          );
        });

        if (!mounted.current) return;

        const { latitude, longitude } = position.coords;

        setCoordinates({
          latitude,
          longitude,
        });

        const newState: LocationInfo = {
          city: 'Current Location',
          state: null,
          country: null,
          formatted: 'Current Location',
          loading: false,
          error: null,
          coordinates: {
            latitude,
            longitude,
          },
        };

        setLocationInfo(newState);
        updateGlobalState(newState);
        setCustomPromptShown(false);

        return position;
      } catch (error) {
        if (!mounted.current) return;

        const errorMessage = error instanceof Error ? error.message : 'Failed to get location';

        updateLocationState({
          loading: false,
          error: errorMessage,
        });

        // Only show custom prompt for permission errors when explicitly requested
        if (
          forceRefresh &&
          (errorMessage.includes('permission') || errorMessage.includes('denied'))
        ) {
          setCustomPromptShown(true);
        }

        // Don't show toast errors for location failures unless explicitly requested
        if (forceRefresh) {
          toast.error('Unable to get your location. You can set it manually.');
        }
      } finally {
        isGettingLocation.current = false;
      }
    },
    [manualLocationSet, updateLocationState]
  );

  const proceedWithLocationPermission = useCallback(() => {
    setCustomPromptShown(false);
    getLocation(true);
  }, [getLocation]);

  const retryLocation = useCallback(async () => {
    try {
      toast.info('Retrying to get your location...');
      await getLocation(true);
    } catch (error) {
      toast.error('Failed to get your location. Please try again.');
    }
  }, [getLocation]);

  // Initialize on mount
  useEffect(() => {
    mounted.current = true;

    // Only auto-fetch location if:
    // 1. We don't have a manual location set
    // 2. We don't already have coordinates
    // 3. This is explicitly requested (not automatic)
    // This prevents continuous loading on page load

    return () => {
      mounted.current = false;
      isGettingLocation.current = false;
    };
  }, []);

  // Check permission state
  useEffect(() => {
    if (!navigator.permissions) return;

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then(permission => {
        setPermissionState(permission.state);

        permission.onchange = () => {
          setPermissionState(permission.state);
        };
      })
      .catch(console.warn);
  }, []);

  return {
    coordinates,
    locationInfo,
    getLocation,
    setManualLocation,
    clearManualLocation,
    customPromptShown,
    proceedWithLocationPermission,
    manualLocationSet,
    permissionState,
    retryLocation,
  };
};
