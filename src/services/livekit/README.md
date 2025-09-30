# LiveKit Integration for Commonly App

This module provides real-time video/audio communication for live events using LiveKit as the underlying platform. It replaces the previous Agora implementation with a more cost-effective and developer-friendly solution.

## Setup Instructions

### 1. Install Dependencies

The package.json has been updated to replace Agora with LiveKit. Run:

```bash
npm install
```

### 2. Set up LiveKit Server

You'll need to set up a LiveKit server. You have two options:

#### Option A: Use LiveKit Cloud (Recommended for Production)

1. Sign up at [LiveKit Cloud](https://cloud.livekit.io)
2. Create a new project
3. Get your API key and secret
4. Add the following to your `.env` file:

```
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
VITE_LIVEKIT_API_KEY=your_api_key
VITE_LIVEKIT_API_SECRET=your_api_secret
```

#### Option B: Self-host LiveKit (Development/Testing)

1. Install Docker
2. Run a local LiveKit server:

```bash
docker run --rm -p 7880:7880 \
    -p 7881:7881 \
    -p 7882:7882/udp \
    -e LIVEKIT_KEYS="devkey: secret" \
    livekit/livekit-server
```

3. Add the following to your `.env` file:

```
VITE_LIVEKIT_URL=ws://localhost:7880
VITE_LIVEKIT_API_KEY=devkey
VITE_LIVEKIT_API_SECRET=secret
```

### 3. Create Backend Token Generation Endpoint

You need to create a server endpoint that generates LiveKit tokens. This endpoint should:

1. Validate the user has permission to join the event
2. Generate a token with appropriate permissions based on user role
3. Return the token and room information

Example server implementation (Node.js/Express):

```typescript
import { AccessToken } from 'livekit-server-sdk';
import express from 'express';

const router = express.Router();

router.post('/events/live/token', async (req, res) => {
  const { eventId, userId, userName, role = 'attendee' } = req.body;
  
  // Validate user has permission to join this event
  // ...your validation logic here...
  
  // Create token with appropriate permissions
  const roomName = `event-${eventId}`;
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: userId,
      name: userName,
    }
  );
  
  // Add permissions based on role
  if (role === 'host') {
    token.addGrant({ roomJoin: true, roomName, canPublish: true, canSubscribe: true, canPublishData: true });
  } else if (role === 'speaker') {
    token.addGrant({ roomJoin: true, roomName, canPublish: true, canSubscribe: true });
  } else {
    token.addGrant({ roomJoin: true, roomName, canPublish: false, canSubscribe: true });
  }
  
  res.json({
    token: token.toJwt(),
    room: roomName,
    participantName: userName,
    participantIdentity: userId
  });
});

export default router;
```

## Usage

### Basic Usage

The LiveKit integration provides both low-level APIs and React hooks:

```tsx
import { useLiveEvent } from '@/services/livekit/hooks/useLiveEvent';

function MyEventComponent({ eventId, userId, userName }) {
  const {
    isConnecting,
    isConnected,
    participants,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
  } = useLiveEvent({
    eventId,
    userId,
    userName,
    role: 'attendee',
    autoConnect: true,
    onError: (error) => console.error('LiveKit error:', error),
  });

  // Your component logic here
}
```

### Using the Pre-built Component

For convenience, a `LiveEventRoom` component is provided:

```tsx
import { LiveEventRoom } from '@/components/LiveEvent/LiveEventRoom';

function EventPage({ eventId, userId, userName }) {
  return (
    <div className="h-screen">
      <LiveEventRoom
        eventId={eventId}
        userId={userId}
        userName={userName}
        role="attendee"
        onLeave={() => console.log('User left the event')}
      />
    </div>
  );
}
```

## API Reference

### Core Services

- `getLiveEventToken`: Get a token for joining a LiveKit room
- `joinLiveEvent`: Connect to a LiveKit room
- `leaveLiveEvent`: Disconnect from a LiveKit room
- `toggleAudio`: Enable/disable audio
- `toggleVideo`: Enable/disable video
- `getLiveEventStats`: Get current stats for a room

### React Hooks

- `useLiveEvent`: Hook for managing LiveKit room connection and state

### API Client

- `getLiveEventToken`: Get a token from the backend
- `getLiveEventDetails`: Get details about a live event
- `getUpcomingLiveEvents`: List upcoming live events
- `createLiveEvent`: Create a new live event
- `updateLiveEvent`: Update a live event's details
- `cancelLiveEvent`: Cancel a live event

## Migrating from Agora

If you have existing components using Agora, you'll need to update them to use LiveKit instead. The main differences are:

1. **Connection Flow**: LiveKit uses a token-based connection similar to Agora
2. **Track Management**: LiveKit uses a different track system
3. **UI Components**: LiveKit provides its own set of React components

For each component using Agora, follow these steps:

1. Replace Agora imports with LiveKit imports
2. Replace Agora hooks with the `useLiveEvent` hook
3. Update UI to use LiveKit components or build your own UI using LiveKit's track system

## Additional Resources

- [LiveKit Documentation](https://docs.livekit.io)
- [LiveKit React Components](https://docs.livekit.io/reference/components)
- [LiveKit Client SDK](https://docs.livekit.io/client-sdk-js/index.html)
