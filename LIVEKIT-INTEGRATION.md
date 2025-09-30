# LiveKit Integration Guide for Commonly App

This guide provides comprehensive instructions for deploying and using the LiveKit integration for live events in the Commonly app. It covers setup, configuration, usage, and migration from Agora.

## Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Usage](#frontend-usage)
5. [Migration from Agora](#migration-from-agora)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Overview

The Commonly app now uses LiveKit for live events, replacing the previous Agora implementation. LiveKit provides a more cost-effective and developer-friendly solution for real-time audio/video communication.

Key components of the LiveKit integration:

- **LiveKit Service Module**: Core functionality for token retrieval, room connection, and media controls
- **React Hooks**: Custom hooks for managing LiveKit room lifecycle and state
- **API Client**: Backend API client for LiveKit token generation and event management
- **Example Components**: Ready-to-use React components for live events

## Setup Instructions

### 1. Install Dependencies

The necessary dependencies have already been added to `package.json`. Run:

```bash
npm install
```

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```
# LiveKit Configuration
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
VITE_LIVEKIT_API_KEY=your_livekit_api_key_here
VITE_LIVEKIT_API_SECRET=your_livekit_secret_here
```

You can get these values by:
- Creating a LiveKit Cloud account at [https://livekit.io/](https://livekit.io/)
- Creating a new project in the LiveKit Cloud dashboard
- Copying the API key and secret from your project settings

### 3. Enable Mock Server (Development Only)

For local development without a LiveKit server, the mock server is automatically enabled when:
- `import.meta.env.DEV` is true
- `import.meta.env.VITE_USE_MOCKS` is set to `'true'`

## Backend Configuration

### Token Generation Endpoint

A token generation endpoint is required for secure LiveKit authentication. We've implemented:

1. A server-side token service (`src/server/api/livekit/tokenService.ts`)
2. API routes for token generation (`src/server/api/livekit/routes.ts`)
3. Mock handlers for development (`src/mocks/handlers/livekit.ts`)

In production, you'll need to deploy these endpoints on your backend server. The token endpoint should:

1. Authenticate the user
2. Verify the user has permission to join the requested event
3. Generate a LiveKit token with appropriate permissions based on the user's role
4. Return the token and room information

Example token endpoint response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "room": "event-123",
  "participantName": "John Doe",
  "participantIdentity": "user-456"
}
```

## Frontend Usage

### Basic Usage with React Hooks

```tsx
import { useLiveEvent } from '@/services/livekit/hooks/useLiveEvent';

function MyLiveEventComponent({ eventId, userId, userName }) {
  const {
    isConnecting,
    isConnected,
    error,
    participants,
    localParticipant,
    toggleAudio,
    toggleVideo,
    leaveRoom
  } = useLiveEvent({
    eventId,
    userId,
    userName,
    role: 'attendee'
  });

  if (isConnecting) return <div>Connecting...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>Live Event</h2>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Participants: {participants.length}</p>
      
      <button onClick={toggleAudio}>
        {localParticipant?.isMicrophoneEnabled ? 'Mute' : 'Unmute'}
      </button>
      
      <button onClick={toggleVideo}>
        {localParticipant?.isCameraEnabled ? 'Hide Video' : 'Show Video'}
      </button>
      
      <button onClick={leaveRoom}>Leave</button>
    </div>
  );
}
```

### Using the LiveEventRoom Component

For a complete UI solution, use the `LiveEventRoom` component:

```tsx
import { LiveEventRoom } from '@/components/LiveEvent/LiveEventRoom';

function MyPage() {
  return (
    <LiveEventRoom
      eventId="event-123"
      userId="user-456"
      userName="John Doe"
      role="host"
      onLeave={() => console.log('User left the room')}
    />
  );
}
```

### Demo Page

A demo page is available at `/live-event-demo` to test the LiveKit integration. You can:

1. Enter event details
2. Select your role (host, speaker, attendee)
3. Join the event to test audio/video functionality
4. Test with multiple tabs/browsers to simulate multiple participants

## Migration from Agora

### Key Differences

1. **Room Creation**: LiveKit uses room names instead of channel names
2. **Tokens**: LiveKit tokens include more granular permissions
3. **Participant Management**: LiveKit has a more robust participant model
4. **UI Components**: LiveKit provides ready-to-use React components

### Migration Steps

1. Replace Agora token generation with LiveKit token generation
2. Update event creation/management to use LiveKit room names
3. Replace Agora UI components with LiveKit components or custom UI
4. Update any analytics or monitoring to use LiveKit events

### Code Migration Example

#### Before (Agora):
```tsx
import { useClient } from 'agora-rtc-react';

const client = useClient();
await client.join(appId, channelName, token, uid);
```

#### After (LiveKit):
```tsx
import { Room } from 'livekit-client';

const room = new Room();
await room.connect(livekitUrl, token);
```

## Testing

### Unit Tests

Run the existing unit tests to ensure the API client and services work correctly:

```bash
npm test
```

### Manual Testing

1. Open the demo page at `/live-event-demo`
2. Join with different user roles (host, speaker, attendee)
3. Test audio/video publishing and subscribing
4. Test with multiple participants
5. Test error handling and reconnection

## Troubleshooting

### Common Issues

1. **Connection Failures**:
   - Check that your LiveKit URL is correct
   - Verify that your token is valid and not expired
   - Ensure your browser has permission to access camera/microphone

2. **Audio/Video Issues**:
   - Check browser permissions
   - Verify that the correct devices are selected
   - Ensure no other application is using the camera/microphone

3. **Token Errors**:
   - Verify your API key and secret are correct
   - Check that token permissions match the user's role
   - Ensure the token hasn't expired

### Debugging

The LiveKit service includes logging. Enable verbose logging in development:

```tsx
import { setLogLevel, LogLevel } from 'livekit-client';

if (import.meta.env.DEV) {
  setLogLevel(LogLevel.DEBUG);
}
```

## Resources

- [LiveKit Documentation](https://docs.livekit.io)
- [LiveKit React Components](https://github.com/livekit/components-js)
- [LiveKit Client SDK](https://github.com/livekit/client-sdk-js)
