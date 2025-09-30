/**
 * Tests for Event Service React Hooks
 *
 * These tests verify the functionality of the Event Service React hooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useEvent,
  useEventSearch,
  useUpcomingEvents,
  useFeaturedEvents,
  useUserEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  usePublishEvent,
  useCancelEvent,
} from '../hooks/useEvents';
import * as EventAPIModule from '../api/core';
import {
  Event,
  EventType,
  EventStatus,
  EventVisibility,
  CreateEventParams,
  UpdateEventParams,
} from '../types';

// Mock the Event API
vi.mock('../api/core', () => ({
  getEvent: vi.fn(),
  searchEvents: vi.fn(),
  getUpcomingEvents: vi.fn(),
  getFeaturedEvents: vi.fn(),
  getUserEvents: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  publishEvent: vi.fn(),
  cancelEvent: vi.fn(),
}));

// Create a wrapper for the hooks with React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Event Service Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useEvent', () => {
    it('should fetch an event by ID', async () => {
      // Mock data
      const mockEvent: Event = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        type: EventType.InPerson,
        status: EventStatus.Published,
        visibility: EventVisibility.Public,
        startDate: '2025-08-01T12:00:00Z',
        endDate: '2025-08-01T15:00:00Z',
        timezone: 'UTC',
        location: {
          name: 'Test Location',
          isVirtual: false,
        },
        organizer: {
          id: 'org123',
          name: 'Test Organizer',
        },
        creatorId: 'user123',
        ticketTiers: [],
        settings: {
          allowComments: true,
          allowSharing: true,
          showAttendeeList: false,
          requireApproval: false,
          enableWaitlist: false,
          sendReminders: true,
          reminderTimes: [24, 1],
        },
        createdAt: '2025-07-01T12:00:00Z',
        updatedAt: '2025-07-01T12:00:00Z',
      };

      // Mock API response
      vi.mocked(EventAPIModule.getEvent).mockResolvedValue(mockEvent);

      // Render the hook
      const { result } = renderHook(() => useEvent('123'), {
        wrapper: createWrapper(),
      });

      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assertions
      expect(EventAPIModule.getEvent).toHaveBeenCalledWith('123');
      expect(result.current.data).toEqual(mockEvent);
    });
  });

  describe('useEventSearch', () => {
    it('should search for events with filters', async () => {
      // Mock data
      const mockSearchResult = {
        events: [
          {
            id: '123',
            title: 'Event 1',
            description: 'Description 1',
            type: EventType.InPerson,
            status: EventStatus.Published,
            visibility: EventVisibility.Public,
            startDate: '2025-08-01T12:00:00Z',
            endDate: '2025-08-01T15:00:00Z',
            timezone: 'UTC',
            location: { name: 'Location 1', isVirtual: false },
            organizer: { id: 'org1', name: 'Organizer 1' },
            creatorId: 'user1',
            ticketTiers: [],
            settings: {
              allowComments: true,
              allowSharing: true,
              showAttendeeList: false,
              requireApproval: false,
              enableWaitlist: false,
              sendReminders: true,
              reminderTimes: [24, 1],
            },
            createdAt: '2025-07-01T12:00:00Z',
            updatedAt: '2025-07-01T12:00:00Z',
          },
          {
            id: '456',
            title: 'Event 2',
            description: 'Description 2',
            type: EventType.Virtual,
            status: EventStatus.Published,
            visibility: EventVisibility.Public,
            startDate: '2025-08-02T12:00:00Z',
            endDate: '2025-08-02T15:00:00Z',
            timezone: 'UTC',
            location: { name: 'Location 2', isVirtual: true },
            organizer: { id: 'org2', name: 'Organizer 2' },
            creatorId: 'user2',
            ticketTiers: [],
            settings: {
              allowComments: true,
              allowSharing: true,
              showAttendeeList: false,
              requireApproval: false,
              enableWaitlist: false,
              sendReminders: true,
              reminderTimes: [24, 1],
            },
            createdAt: '2025-07-02T12:00:00Z',
            updatedAt: '2025-07-02T12:00:00Z',
          },
        ],
        totalCount: 2,
        page: 0,
        limit: 10,
        hasMore: false,
      };

      // Mock API response
      vi.mocked(EventAPIModule.searchEvents).mockResolvedValue(mockSearchResult);

      // Search parameters
      const searchParams = {
        type: EventType.InPerson,
        status: EventStatus.Published,
        page: 0,
        limit: 10,
      };

      // Render the hook
      const { result } = renderHook(() => useEventSearch(searchParams), {
        wrapper: createWrapper(),
      });

      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assertions
      expect(EventAPIModule.searchEvents).toHaveBeenCalledWith(searchParams);
      expect(result.current.data).toEqual(mockSearchResult);
    });
  });

  describe('useUpcomingEvents', () => {
    it('should fetch upcoming events', async () => {
      // Mock data
      const mockEvents = [
        {
          id: '123',
          title: 'Upcoming Event 1',
          description: 'Description 1',
          type: EventType.InPerson,
          status: EventStatus.Published,
          visibility: EventVisibility.Public,
          startDate: '2025-08-01T12:00:00Z',
          endDate: '2025-08-01T15:00:00Z',
          timezone: 'UTC',
          location: { name: 'Location 1', isVirtual: false },
          organizer: { id: 'org1', name: 'Organizer 1' },
          creatorId: 'user1',
          ticketTiers: [],
          settings: {
            allowComments: true,
            allowSharing: true,
            showAttendeeList: false,
            requireApproval: false,
            enableWaitlist: false,
            sendReminders: true,
            reminderTimes: [24, 1],
          },
          createdAt: '2025-07-01T12:00:00Z',
          updatedAt: '2025-07-01T12:00:00Z',
        },
      ];

      // Mock API response
      vi.mocked(EventAPIModule.getUpcomingEvents).mockResolvedValue(mockEvents);

      // Render the hook
      const { result } = renderHook(() => useUpcomingEvents(5), {
        wrapper: createWrapper(),
      });

      // Wait for the query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assertions
      expect(EventAPIModule.getUpcomingEvents).toHaveBeenCalledWith(5);
      expect(result.current.data).toEqual(mockEvents);
    });
  });

  describe('useCreateEvent', () => {
    it('should create a new event', async () => {
      // Mock data
      const createParams: CreateEventParams = {
        title: 'New Event',
        description: 'New Description',
        type: EventType.InPerson,
        visibility: EventVisibility.Public,
        startDate: '2025-08-01T12:00:00Z',
        endDate: '2025-08-01T15:00:00Z',
        timezone: 'UTC',
        location: {
          name: 'New Location',
          isVirtual: false,
        },
      };

      const mockCreatedEvent: Event = {
        id: 'new123',
        title: 'New Event',
        description: 'New Description',
        type: EventType.InPerson,
        status: EventStatus.Draft,
        visibility: EventVisibility.Public,
        startDate: '2025-08-01T12:00:00Z',
        endDate: '2025-08-01T15:00:00Z',
        timezone: 'UTC',
        location: {
          name: 'New Location',
          isVirtual: false,
        },
        organizer: {
          id: 'org123',
          name: 'Test Organizer',
        },
        creatorId: 'user123',
        ticketTiers: [],
        settings: {
          allowComments: true,
          allowSharing: true,
          showAttendeeList: false,
          requireApproval: false,
          enableWaitlist: false,
          sendReminders: true,
          reminderTimes: [24, 1],
        },
        createdAt: '2025-07-20T12:00:00Z',
        updatedAt: '2025-07-20T12:00:00Z',
      };

      // Mock API response
      vi.mocked(EventAPIModule.createEvent).mockResolvedValue(mockCreatedEvent);

      // Render the hook
      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: createWrapper(),
      });

      // Execute the mutation
      result.current.mutate({ params: createParams, userId: 'user123' });

      // Wait for the mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assertions
      expect(EventAPIModule.createEvent).toHaveBeenCalledWith(createParams, 'user123');
      expect(result.current.data).toEqual(mockCreatedEvent);
    });
  });

  describe('useUpdateEvent', () => {
    it('should update an existing event', async () => {
      // Mock data
      const updateParams: UpdateEventParams = {
        id: '123',
        title: 'Updated Event',
        description: 'Updated Description',
      };

      const mockUpdatedEvent: Event = {
        id: '123',
        title: 'Updated Event',
        description: 'Updated Description',
        type: EventType.InPerson,
        status: EventStatus.Published,
        visibility: EventVisibility.Public,
        startDate: '2025-08-01T12:00:00Z',
        endDate: '2025-08-01T15:00:00Z',
        timezone: 'UTC',
        location: {
          name: 'Test Location',
          isVirtual: false,
        },
        organizer: {
          id: 'org123',
          name: 'Test Organizer',
        },
        creatorId: 'user123',
        ticketTiers: [],
        settings: {
          allowComments: true,
          allowSharing: true,
          showAttendeeList: false,
          requireApproval: false,
          enableWaitlist: false,
          sendReminders: true,
          reminderTimes: [24, 1],
        },
        createdAt: '2025-07-01T12:00:00Z',
        updatedAt: '2025-07-20T12:00:00Z',
      };

      // Mock API response
      vi.mocked(EventAPIModule.updateEvent).mockResolvedValue(mockUpdatedEvent);

      // Render the hook
      const { result } = renderHook(() => useUpdateEvent(), {
        wrapper: createWrapper(),
      });

      // Execute the mutation
      result.current.mutate(updateParams);

      // Wait for the mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assertions
      expect(EventAPIModule.updateEvent).toHaveBeenCalledWith(updateParams);
      expect(result.current.data).toEqual(mockUpdatedEvent);
    });
  });

  describe('useDeleteEvent', () => {
    it('should delete an event', async () => {
      // Mock API response
      vi.mocked(EventAPIModule.deleteEvent).mockResolvedValue(true);

      // Render the hook
      const { result } = renderHook(() => useDeleteEvent(), {
        wrapper: createWrapper(),
      });

      // Execute the mutation
      result.current.mutate('123');

      // Wait for the mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assertions
      expect(EventAPIModule.deleteEvent).toHaveBeenCalledWith('123');
      expect(result.current.data).toBe(true);
    });
  });
});
