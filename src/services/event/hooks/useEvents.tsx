/**
 * React hooks for the Event Service
 *
 * These hooks provide easy access to event data and operations in React components.
 * They handle loading states, caching, and error handling.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEvent,
  searchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
  getUpcomingEvents,
  getFeaturedEvents,
  getUserEvents,
} from '../api/core';
import {
  Event,
  CreateEventParams,
  UpdateEventParams,
  EventSearchParams,
  EventSearchResult,
} from '../types';

// Query keys for React Query
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: EventSearchParams) => [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  upcoming: () => [...eventKeys.lists(), 'upcoming'] as const,
  featured: () => [...eventKeys.lists(), 'featured'] as const,
  user: (userId: string) => [...eventKeys.lists(), 'user', userId] as const,
};

/**
 * Hook to get an event by ID
 * @param eventId - ID of the event to retrieve
 * @param options - Additional options for the query
 * @returns Query result with event data
 */
export function useEvent(eventId: string, options = {}) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => getEvent(eventId),
          ...options,
  });
}

/**
 * Hook to search for events
 * @param params - Search parameters
 * @param options - Additional options for the query
 * @returns Query result with search results
 */
export function useEventSearch(params: EventSearchParams, options = {}) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => searchEvents(params),
          ...options,
  });
}

/**
 * Hook to get upcoming events
 * @param limit - Number of events to retrieve
 * @param options - Additional options for the query
 * @returns Query result with upcoming events
 */
export function useUpcomingEvents(limit = 10, options = {}) {
  return useQuery({
    queryKey: eventKeys.upcoming(),
    queryFn: () => getUpcomingEvents(limit),
          ...options,
  });
}

/**
 * Hook to get featured events
 * @param limit - Number of events to retrieve
 * @param options - Additional options for the query
 * @returns Query result with featured events
 */
export function useFeaturedEvents(limit = 5, options = {}) {
  return useQuery({
    queryKey: eventKeys.featured(),
    queryFn: () => getFeaturedEvents(limit),
          ...options,
  });
}

/**
 * Hook to get events created by a user
 * @param userId - ID of the user
 * @param page - Page number for pagination
 * @param limit - Number of events per page
 * @param options - Additional options for the query
 * @returns Query result with user's events
 */
export function useUserEvents(userId: string, page = 0, limit = 20, options = {}) {
  return useQuery({
    queryKey: eventKeys.user(userId),
    queryFn: () => getUserEvents(userId, page, limit),
          ...options,
  });
}

/**
 * Hook to create a new event
 * @returns Mutation for creating an event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ params, userId }: { params: CreateEventParams; userId: string }) =>
      createEvent(params, userId),
    onSuccess: newEvent => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      // Add the new event to the cache
      queryClient.setQueryData(eventKeys.detail(newEvent.id), newEvent);
    },
  });
}

/**
 * Hook to update an event
 * @returns Mutation for updating an event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateEventParams) => updateEvent(params),
    onSuccess: updatedEvent => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      // Update the event in the cache
      queryClient.setQueryData(eventKeys.detail(updatedEvent.id), updatedEvent);
    },
  });
}

/**
 * Hook to delete an event
 * @returns Mutation for deleting an event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => deleteEvent(eventId),
    onSuccess: (_, eventId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      // Remove the event from the cache
      queryClient.removeQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

/**
 * Hook to publish an event
 * @returns Mutation for publishing an event
 */
export function usePublishEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => publishEvent(eventId),
    onSuccess: updatedEvent => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      // Update the event in the cache
      queryClient.setQueryData(eventKeys.detail(updatedEvent.id), updatedEvent);
    },
  });
}

/**
 * Hook to cancel an event
 * @returns Mutation for canceling an event
 */
export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, reason }: { eventId: string; reason?: string }) =>
      cancelEvent(eventId, reason),
    onSuccess: updatedEvent => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      // Update the event in the cache
      queryClient.setQueryData(eventKeys.detail(updatedEvent.id), updatedEvent);
    },
  });
}
