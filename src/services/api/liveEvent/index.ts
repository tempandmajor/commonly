/**
 * LiveEvent API Module
 *
 * Provides functions to interact with the LiveKit server for live events.
 */

import { appClient } from '../client/clients';

// Types
export interface LiveEventTokenRequest {
  eventId: string;
  userId: string;
  userName: string;
  role?: 'host' | undefined| 'speaker' | 'attendee';
}

export interface LiveEventTokenResponse {
  token: string;
  room: string;
  participantName: string;
  participantIdentity: string;
}

export interface LiveEventDetails {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  hostId: string;
  hostName: string;
  participantCount: number;
  status: 'scheduled' | 'live' | 'ended';
}

/**
 * Get a LiveKit token for joining a specific event room
 */
export async function getLiveEventToken(
  request: LiveEventTokenRequest
): Promise<LiveEventTokenResponse> {
  const response = await appClient.post<LiveEventTokenResponse>('/events/live/token', request);
  return response.data;
}

/**
 * Get details about a live event
 */
export async function getLiveEventDetails(eventId: string): Promise<LiveEventDetails> {
  const response = await appClient.get<LiveEventDetails>(`/events/live/${eventId}`);
  return response.data;
}

/**
 * List upcoming live events
 */
export async function getUpcomingLiveEvents(limit: number = 10): Promise<LiveEventDetails[]> {
  const response = await appClient.get<LiveEventDetails[]>(`/events/live/upcoming?limit=${limit}`);
  return response.data;
}

/**
 * Create a new live event
 */
export async function createLiveEvent(
  eventDetails: Omit<LiveEventDetails, 'id' | 'participantCount' | 'status'>
): Promise<LiveEventDetails> {
  const response = await appClient.post<LiveEventDetails>('/events/live', eventDetails);
  return response.data;
}

/**
 * Update a live event's details
 */
export async function updateLiveEvent(
  eventId: string,
  updates: Partial<LiveEventDetails>
): Promise<LiveEventDetails> {
  const response = await appClient.put<LiveEventDetails>(`/events/live/${eventId}`, updates);
  return response.data;
}

/**
 * Cancel a live event
 */
export async function cancelLiveEvent(eventId: string): Promise<void> {
  await appClient.delete(`/events/live/${eventId}`);
}
