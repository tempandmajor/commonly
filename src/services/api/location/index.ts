/**
 * Location API Module
 *
 * Provides functions to fetch and save user/location data using the consolidated API client.
 */

import { appClient } from '../client/clients';

// Define types for location data
interface Event {
  id: string;
  name: string;
  location: string;
  // Add other event properties as needed
}

interface Location {
  name: string;
  // Add other location properties as needed
}

/**
 * Fetch events near a given location (latitude, longitude).
 */
export async function fetchEventsNearLocation(
  lat: number,
  lng: number,
  radiusKm: number = 25
): Promise<Event[]> {
  const url = `/events/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`;
  const response = await appClient.get<Event[]>(url);
  return response.data;
}

/**
 * Fetch popular locations from the backend.
 */
export async function fetchPopularLocations(): Promise<string[]> {
  const response = await appClient.get<Location[]>('/locations/popular?limit=5');

  return response.data.map(loc => loc.name);
}

/**
 * Save a user's location to the backend.
 */
export async function saveUserLocation(userId: string, location: string): Promise<void> {
  await appClient.post('/users/location', { userId, location });
}
