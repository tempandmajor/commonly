import React, { createContext, useContext } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { GeolocationHookReturn } from '@/types/location';

// Create context with default values
const LocationContext = createContext<GeolocationHookReturn | null>(null);

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const locationData = useGeolocation();

  return <LocationContext.Provider value={locationData}>{children}</LocationContext.Provider>;
};

export const useLocationContext = (): GeolocationHookReturn => {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }

  return context;
};
