# Event Service

The Event Service provides a comprehensive set of functions and hooks for managing events within the Commonly application. This service follows the modular structure pattern established across other consolidated services in the codebase.

## Table of Contents

- [Structure](#structure)
- [Types](#types)
- [API Functions](#api-functions)
- [React Hooks](#react-hooks)
- [Utilities](#utilities)
- [Backward Compatibility](#backward-compatibility)
- [Testing](#testing)
- [Examples](#examples)

## Structure

The Event Service follows a modular structure:

```
event/
├── api/                 # Core API functions
│   └── core.ts          # CRUD operations for events
├── compatibility/       # Backward compatibility layer
│   └── eventService.ts  # Legacy function signatures
├── hooks/               # React hooks
│   └── useEvents.tsx    # React Query hooks for events
├── tests/               # Unit tests
│   ├── eventApi.test.ts
│   └── eventHooks.test.tsx
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── cache.ts         # Caching mechanisms
│   ├── errorHandling.ts # Error handling utilities
│   └── transformers.ts  # Data transformation utilities
├── README.md            # This documentation
└── index.ts             # Main entry point and exports
```

## Types

The Event Service provides a comprehensive set of TypeScript types to ensure type safety throughout the application:

### Core Types

```typescript
// Event types
enum EventType {
  InPerson = 'in_person',
  Virtual = 'virtual',
  Hybrid = 'hybrid'
}

// Event statuses
enum EventStatus {
  Draft = 'draft',
  Published = 'published',
  Canceled = 'canceled',
  Completed = 'completed',
  Archived = 'archived'
}

// Event visibility options
enum EventVisibility {
  Public = 'public',
  Private = 'private',
  Unlisted = 'unlisted'
}

// Main Event interface
interface Event {
  id: string;
  title: string;
  description: string;
  summary?: string;
  type: EventType;
  status: EventStatus;
  visibility: EventVisibility;
  coverImage?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  location: EventLocation;
  organizer: EventOrganizer;
  creatorId: string;
  creator?: User;
  ticketTiers: EventTicketTier[];
  settings: EventSettings;
  categories?: string[];
  tags?: string[];
  attendeeCount?: number;
  maxAttendees?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
```

## API Functions

The Event Service provides the following core API functions:

### Event CRUD Operations

```typescript
// Create a new event
createEvent(params: CreateEventParams, userId: string): Promise<Event>

// Get an event by ID
getEvent(eventId: string): Promise<Event>

// Update an existing event
updateEvent(params: UpdateEventParams): Promise<Event>

// Delete an event
deleteEvent(eventId: string): Promise<boolean>

// Publish an event
publishEvent(eventId: string): Promise<Event>

// Cancel an event
cancelEvent(eventId: string, reason?: string): Promise<Event>
```

### Event Search and Retrieval

```typescript
// Search for events based on various criteria
searchEvents(params: EventSearchParams): Promise<EventSearchResult>

// Get events created by a specific user
getUserEvents(userId: string, page?: number, limit?: number): Promise<EventSearchResult>

// Get upcoming events
getUpcomingEvents(limit?: number): Promise<Event[]>

// Get featured events
getFeaturedEvents(limit?: number): Promise<Event[]>
```

## React Hooks

The Event Service provides React hooks for easy integration with React components:

### Query Hooks

```typescript
// Get an event by ID
useEvent(eventId: string, options?: UseQueryOptions): UseQueryResult<Event>

// Search for events
useEventSearch(params: EventSearchParams, options?: UseQueryOptions): UseQueryResult<EventSearchResult>

// Get upcoming events
useUpcomingEvents(limit?: number, options?: UseQueryOptions): UseQueryResult<Event[]>

// Get featured events
useFeaturedEvents(limit?: number, options?: UseQueryOptions): UseQueryResult<Event[]>

// Get events created by a user
useUserEvents(userId: string, page?: number, limit?: number, options?: UseQueryOptions): UseQueryResult<EventSearchResult>
```

### Mutation Hooks

```typescript
// Create a new event
useCreateEvent(): UseMutationResult<Event, Error, { params: CreateEventParams; userId: string }>

// Update an event
useUpdateEvent(): UseMutationResult<Event, Error, UpdateEventParams>

// Delete an event
useDeleteEvent(): UseMutationResult<boolean, Error, string>

// Publish an event
usePublishEvent(): UseMutationResult<Event, Error, string>

// Cancel an event
useCancelEvent(): UseMutationResult<Event, Error, { eventId: string; reason?: string }>
```

## Utilities

### Cache

The Event Service includes caching mechanisms to improve performance:

```typescript
// Cache instances for different types of data
eventCache: Cache<Event>           // 5 minutes TTL
searchCache: Cache<EventSearchResult>  // 2 minutes TTL
upcomingEventsCache: Cache<Event[]>    // 10 minutes TTL
featuredEventsCache: Cache<Event[]>    // 10 minutes TTL

// Cache management functions
generateSearchCacheKey(params: Record<string, any>): string
clearAllCaches(): void
clearEventCache(eventId: string): void
```

### Error Handling

```typescript
// Handle API errors consistently
handleApiError<T>(message: string, error: unknown, defaultValue?: T): T

// Format validation errors
formatValidationErrors(errors: Record<string, string>): string

// Error type checking functions
isErrorCode(error: unknown, code: string): boolean
isNotFoundError(error: unknown): boolean
isForeignKeyViolation(error: unknown): boolean
isUniqueConstraintViolation(error: unknown): boolean
```

### Data Transformation

```typescript
// Transform raw event data from the database
transformEventData(data: any): Event

// Map database values to enums
mapEventType(type: string): EventType
mapEventStatus(status: string): EventStatus
mapEventVisibility(visibility: string): EventVisibility
mapTicketType(type: string): TicketType
```

## Backward Compatibility

The Event Service maintains backward compatibility with existing code through a compatibility layer:

```typescript
// Legacy function signatures
getEventById(eventId: string): Promise<Event>
searchEventsByFilters(filters: any): Promise<Event[]>
createNewEvent(eventData: any, userId: string): Promise<Event>
updateExistingEvent(eventId: string, eventData: any): Promise<Event>
removeEvent(eventId: string): Promise<boolean>
publishEventById(eventId: string): Promise<Event>
cancelEventById(eventId: string, reason?: string): Promise<Event>
fetchUpcomingEvents(limit?: number): Promise<Event[]>
fetchFeaturedEvents(limit?: number): Promise<Event[]>
fetchUserEvents(userId: string, page?: number, limit?: number): Promise<Event[]>
```

## Testing

The Event Service includes comprehensive unit tests for both API functions and React hooks:

- `eventApi.test.ts`: Tests for core API functions
- `eventHooks.test.tsx`: Tests for React hooks

## Examples

### Creating a New Event

```typescript
import { EventAPI, EventType, EventVisibility } from '@/services/event';

// Create a new event
const newEvent = await EventAPI.createEvent({
  title: 'Summer Concert',
  description: 'Join us for a night of live music!',
  type: EventType.InPerson,
  visibility: EventVisibility.Public,
  startDate: '2025-08-15T19:00:00Z',
  endDate: '2025-08-15T23:00:00Z',
  timezone: 'America/New_York',
  location: {
    name: 'Central Park',
    address: '59th St to 110th St',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    isVirtual: false
  },
  ticketTiers: [
    {
      name: 'General Admission',
      price: 25,
      currency: 'USD',
      quantity: 500,
      quantityAvailable: 500,
      type: 'paid',
      salesStartDate: '2025-07-01T00:00:00Z',
      salesEndDate: '2025-08-15T19:00:00Z',
      isActive: true
    },
    {
      name: 'VIP',
      price: 75,
      currency: 'USD',
      quantity: 100,
      quantityAvailable: 100,
      type: 'paid',
      salesStartDate: '2025-07-01T00:00:00Z',
      salesEndDate: '2025-08-15T19:00:00Z',
      isActive: true
    }
  ]
}, 'user123');

console.log(`Created event: ${newEvent.id}`);
```

### Using React Hooks in Components

```tsx
import React from 'react';
import { 
  useEvent, 
  useUpcomingEvents, 
  useCreateEvent,
  EventType,
  EventVisibility
} from '@/services/event';

// Event Details Component
export const EventDetails = ({ eventId }) => {
  const { data: event, isLoading, error } = useEvent(eventId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading event: {error.message}</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
      <div>
        <strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}
      </div>
      <div>
        <strong>Location:</strong> {event.location.name}
      </div>
    </div>
  );
};

// Upcoming Events Component
export const UpcomingEvents = () => {
  const { data: events, isLoading } = useUpcomingEvents(5);

  if (isLoading) return <div>Loading upcoming events...</div>;

  return (
    <div>
      <h2>Upcoming Events</h2>
      <ul>
        {events?.map(event => (
          <li key={event.id}>
            <a href={`/events/${event.id}`}>{event.title}</a> - 
            {new Date(event.startDate).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Create Event Component
export const CreateEventForm = () => {
  const createEvent = useCreateEvent();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createEvent.mutate({
        params: {
          title,
          description,
          type: EventType.InPerson,
          visibility: EventVisibility.Public,
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
          timezone: 'UTC',
          location: {
            name: 'Event Location',
            isVirtual: false
          }
        },
        userId: 'current-user-id'
      });
      
      setTitle('');
      setDescription('');
      alert('Event created successfully!');
    } catch (error) {
      alert(`Error creating event: ${error.message}`);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Event</h2>
      <div>
        <label>
          Title:
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
        </label>
      </div>
      <div>
        <label>
          Description:
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            required 
          />
        </label>
      </div>
      <button type="submit" disabled={createEvent.isLoading}>
        {createEvent.isLoading ? 'Creating...' : 'Create Event'}
      </button>
    </form>
  );
};
```

### Searching for Events

```typescript
import { EventAPI, EventType, EventStatus } from '@/services/event';

// Search for events
const searchResults = await EventAPI.searchEvents({
  query: 'concert',
  type: EventType.InPerson,
  status: EventStatus.Published,
  startDateFrom: '2025-08-01T00:00:00Z',
  startDateTo: '2025-08-31T23:59:59Z',
  categories: ['music', 'entertainment'],
  page: 0,
  limit: 10,
  sortBy: 'date',
  sortDirection: 'asc'
});

console.log(`Found ${searchResults.totalCount} events`);
searchResults.events.forEach(event => {
  console.log(`- ${event.title} (${new Date(event.startDate).toLocaleDateString()})`);
});
```

### Using the Backward Compatibility Layer

```typescript
import { 
  getEventById, 
  searchEventsByFilters, 
  createNewEvent 
} from '@/services/event/compatibility/eventService';

// Get an event using the legacy function
const event = await getEventById('event123');

// Search for events using the legacy function
const events = await searchEventsByFilters({
  query: 'workshop',
  type: 'virtual',
  startDate: '2025-08-01T00:00:00Z',
  endDate: '2025-08-31T23:59:59Z'
});

// Create an event using the legacy function
const newEvent = await createNewEvent({
  title: 'Tech Workshop',
  description: 'Learn new technologies',
  type: 'virtual',
  visibility: 'public',
  startDate: '2025-09-15T14:00:00Z',
  endDate: '2025-09-15T16:00:00Z',
  virtualUrl: 'https://zoom.us/j/123456789',
  tickets: [
    {
      name: 'Standard',
      price: 10,
      currency: 'USD',
      quantity: 100,
      isFree: false
    }
  ]
}, 'user456');
```
