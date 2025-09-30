export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

export interface LocationInfo {
  city: string | null;
  state: string | null;
  country: string | null;
  formatted: string | null;
  loading: boolean;
  error: string | null;
  coordinates: Coordinates;
}

export interface GeolocationHookReturn {
  coordinates: Coordinates;
  locationInfo: LocationInfo;
  getLocation: (force?: boolean) => Promise<GeolocationPosition | undefined| void>;
  setManualLocation: (location: string) => void;
  clearManualLocation: () => void;
  customPromptShown: boolean;
  proceedWithLocationPermission: () => void;
  manualLocationSet: boolean;
  permissionState: PermissionState | null;
  retryLocation: () => void;
}

// Add new interfaces for compatibility with event coordinates
export interface MapCoordinates {
  lat: number;
  lng: number;
}
