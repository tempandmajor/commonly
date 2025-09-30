/**
 * Tests for Event Service API
 *
 * These tests verify the functionality of the Event Service API functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { EventAPI } from '..';
import {
  Event,
  EventType,
  EventStatus,
  EventVisibility,
  CreateEventParams,
  UpdateEventParams,
} from '../types';
import { eventCache, clearAllCaches } from '../utils/cache';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
    },
  };
});

describe('Event Service API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCaches();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getEvent', () => {
    it('should fetch an event by ID', async () => {
      // Mock data
      const mockEventData = {
        id: '123',
        title: 'Test Event',
        description: 'Test Description',
        type: 'in_person',
        status: 'published',
        visibility: 'public',
        start_date: '2025-08-01T12:00:00Z',
        end_date: '2025-08-01T15:00:00Z',
        timezone: 'UTC',
        creator_id: 'user123',
        created_at: '2025-07-01T12:00:00Z',
        updated_at: '2025-07-01T12:00:00Z',
        location: {
          name: 'Test Location',
          is_virtual: false,
        },
        organizer: {
          id: 'org123',
          name: 'Test Organizer',
        },
        ticket_tiers: [],
        settings: {
          allow_comments: true,
          allow_sharing: true,
          show_attendee_list: false,
          require_approval: false,
          enable_waitlist: false,
          send_reminders: true,
          reminder_times: [24, 1],
        },
      };

      // Mock Supabase response
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockEventData,
              error: null,
            }),
          }),
        }),
      } as any);

      // Call the function
      const result = await EventAPI.getEvent('123');

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('events');
      expect(result).toEqual(
        expect.objectContaining({
          id: '123',
          title: 'Test Event',
          description: 'Test Description',
          type: EventType.InPerson,
          status: EventStatus.Published,
          visibility: EventVisibility.Public,
        })
      );
    });

    it('should return cached event if available', async () => {
      // Mock cached event
      const mockEvent: Event = {
        id: '123',
        title: 'Cached Event',
        description: 'Cached Description',
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

      // Set cache
      eventCache.set('123', mockEvent);

      // Call the function
      const result = await EventAPI.getEvent('123');

      // Assertions
      expect(supabase.from).not.toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should handle errors', async () => {
      // Mock Supabase error
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Event not found' },
            }),
          }),
        }),
      } as any);

      // Call the function and expect it to throw
      await expect(EventAPI.getEvent('123')).rejects.toThrow(
        'Failed to get event: 123: Event not found'
      );
    });
  });

  describe('createEvent', () => {
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

      const mockCreatedEvent = {
        id: 'new123',
        title: 'New Event',
        description: 'New Description',
        type: 'in_person',
        status: 'draft',
        visibility: 'public',
        created_at: '2025-07-20T12:00:00Z',
        updated_at: '2025-07-20T12:00:00Z',
      };

      // Mock Supabase responses
      vi.mocked(supabase.from).mockImplementation(table => {
        if (table === 'events') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCreatedEvent,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {
          insert: vi.fn().mockReturnValue({
            error: null,
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
          ...mockCreatedEvent,
                  location: { name: 'New Location', is_virtual: false },
                  organizer: { id: 'org123', name: 'Test Organizer' },
                  ticket_tiers: [],
                  settings: { allow_comments: true },
                },
                error: null,
              }),
            }),
          }),
        } as any;
      });

      // Call the function
      const result = await EventAPI.createEvent(createParams, 'user123');

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('events');
      expect(result).toEqual(
        expect.objectContaining({
          id: 'new123',
          title: 'New Event',
          description: 'New Description',
        })
      );
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event', async () => {
      // Mock data
      const updateParams: UpdateEventParams = {
        id: '123',
        title: 'Updated Event',
        description: 'Updated Description',
      };

      // Mock Supabase responses
      vi.mocked(supabase.from).mockImplementation(table => {
        if (table === 'events' && vi.mocked(supabase.from).mock.calls[0]?.[0] === 'events') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: '123',
                  title: 'Updated Event',
                  description: 'Updated Description',
                  type: 'in_person',
                  status: 'published',
                  visibility: 'public',
                  location: { name: 'Test Location', is_virtual: false },
                  organizer: { id: 'org123', name: 'Test Organizer' },
                  ticket_tiers: [],
                  settings: { allow_comments: true },
                },
                error: null,
              }),
            }),
          }),
        } as any;
      });

      // Call the function
      const result = await EventAPI.updateEvent(updateParams);

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('events');
      expect(result).toEqual(
        expect.objectContaining({
          id: '123',
          title: 'Updated Event',
          description: 'Updated Description',
        })
      );
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      // Mock Supabase response
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      // Call the function
      const result = await EventAPI.deleteEvent('123');

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('events');
      expect(result).toBe(true);
    });
  });

  describe('searchEvents', () => {
    it('should search for events with filters', async () => {
      // Mock data
      const mockEvents = [
        {
          id: '123',
          title: 'Event 1',
          description: 'Description 1',
          type: 'in_person',
          status: 'published',
          visibility: 'public',
          location: { name: 'Location 1', is_virtual: false },
          organizer: { id: 'org1', name: 'Organizer 1' },
          ticket_tiers: [],
          settings: { allow_comments: true },
        },
        {
          id: '456',
          title: 'Event 2',
          description: 'Description 2',
          type: 'virtual',
          status: 'published',
          visibility: 'public',
          location: { name: 'Location 2', is_virtual: true },
          organizer: { id: 'org2', name: 'Organizer 2' },
          ticket_tiers: [],
          settings: { allow_comments: true },
        },
      ];

      // Mock Supabase response
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockEvents,
                error: null,
                count: 2,
              }),
            }),
          }),
        }),
      } as any);

      // Call the function
      const result = await EventAPI.searchEvents({
        type: EventType.InPerson,
        status: EventStatus.Published,
        page: 0,
        limit: 10,
      });

      // Assertions
      expect(supabase.from).toHaveBeenCalledWith('events');
      expect(result.events.length).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);
    });
  });
});
