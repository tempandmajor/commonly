/**
 * Location utilities for geolocation and address formatting
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationInfo {
  coordinates: LocationCoordinates;
  address: string;
  city?: string | undefined;
  state?: string | undefined;
  country?: string | undefined;
  zipCode?: string | undefined;
}

export const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
  try {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  } catch (error) {
    return null;
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

export const formatAddress = (locationInfo: Partial<LocationInfo>): string => {
  const parts = [];

  if (locationInfo.address) {
    parts.push(locationInfo.address);
  }

  if (locationInfo.city) {
    parts.push(locationInfo.city);
  }

  if (locationInfo.state) {
    parts.push(locationInfo.state);
  }

  if (locationInfo.zipCode) {
    parts.push(locationInfo.zipCode);
  }

  if (locationInfo.country) {
    parts.push(locationInfo.country);
  }

  return parts.join(', ');
};
