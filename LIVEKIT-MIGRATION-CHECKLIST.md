# LiveKit Migration Checklist

Use this checklist to ensure a smooth migration from Agora to LiveKit for live events in the Commonly app.

## Pre-Deployment

- [ ] Create a LiveKit Cloud account at [https://livekit.io/](https://livekit.io/)
- [ ] Create a new project in the LiveKit Cloud dashboard
- [ ] Copy the API key and secret from your project settings
- [ ] Add LiveKit environment variables to your `.env` file:
  ```
  VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
  VITE_LIVEKIT_API_KEY=your_livekit_api_key_here
  VITE_LIVEKIT_API_SECRET=your_livekit_secret_here
  ```
- [ ] Run `npm install` to install LiveKit dependencies
- [ ] Run the test script to verify LiveKit connectivity:
  ```
  node scripts/test-livekit.js
  ```
- [ ] Test the demo page at `/live-event-demo` in development

## Backend Setup

- [ ] Deploy the token generation endpoint on your backend server
- [ ] Update your API documentation with the new LiveKit endpoints
- [ ] Set up proper authentication and authorization for token generation
- [ ] Configure CORS settings to allow requests from your frontend
- [ ] Test token generation with different user roles (host, speaker, attendee)

## Frontend Migration

- [ ] Replace Agora components with LiveKit components in all relevant pages
- [ ] Update any custom UI components to use LiveKit hooks
- [ ] Update event creation flows to use LiveKit room naming conventions
- [ ] Test with multiple participants and different devices
- [ ] Verify that all features work as expected (audio, video, screen sharing, chat)

## Testing

- [ ] Run unit tests to ensure API client and services work correctly
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on different devices (desktop, mobile)
- [ ] Test with different network conditions (good, poor, reconnection)
- [ ] Test with different user roles (host, speaker, attendee)
- [ ] Test error handling and recovery

## Deployment

- [ ] Deploy the updated frontend code
- [ ] Monitor for any errors or performance issues
- [ ] Verify that analytics and monitoring are working correctly
- [ ] Check server logs for any unexpected errors
- [ ] Test in production environment

## Post-Deployment

- [ ] Monitor usage and performance metrics
- [ ] Gather feedback from users
- [ ] Address any issues or bugs
- [ ] Update documentation as needed
- [ ] Consider removing Agora-related code and dependencies after successful migration

## Rollback Plan

In case of critical issues with LiveKit:

1. Revert the frontend code to use Agora
2. Restore Agora dependencies in package.json
3. Revert any backend changes
4. Deploy the reverted code
5. Notify users of the rollback

## Notes

- LiveKit and Agora have different pricing models. Monitor your usage to avoid unexpected costs.
- LiveKit has different server requirements than Agora. Ensure your infrastructure can support it.
- LiveKit has different browser support than Agora. Test on all target browsers.
