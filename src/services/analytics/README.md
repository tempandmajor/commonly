# Analytics Service

This module provides a consolidated analytics service for the Commonly app, handling all event tracking, page views, user identification, and metrics collection functionality.

## Directory Structure

```
/src/services/analytics/
  /api/         - Core API functions for analytics operations
  /core/        - Types and interfaces
  /utils/       - Analytics-specific utilities
  /hooks/       - React hooks for analytics in components
  /compatibility/ - Legacy compatibility layers
  /tests/       - Unit tests
  README.md     - This documentation file
  index.ts      - Main export file
```

## Usage

### Modern Usage (Recommended)

```typescript
// Import the API directly
import { analyticsAPI } from '@/services/analytics';

// Initialize analytics (typically in _app.js or similar)
analyticsAPI.initialize({
  enabled: true,
  providers: {
    googleAnalytics: true
  }
});

// Track an event
analyticsAPI.trackEvent({
  name: 'button_click',
  category: EventCategory.ENGAGEMENT,
  properties: {
    buttonId: 'submit_form',
    formName: 'registration'
  }
});

// For React components, use the hook
import { useAnalytics } from '@/services/analytics';

function MyComponent() {
  const { trackEvent, trackInteraction } = useAnalytics();
  
  const handleClick = () => {
    trackInteraction('click', 'submit_button', {
      formId: 'contact_form'
    });
  };
  
  return (
    <button onClick={handleClick}>Submit</button>
  );
}
```

### Legacy Usage (Backward Compatibility)

```typescript
// Import legacy service
import { AnalyticsService } from '@/services/analytics';

// Using legacy analytics service
AnalyticsService.trackEvent('button_click', {
  buttonId: 'submit_form'
});

AnalyticsService.trackPageView('/homepage');
```

## Core Features

### Event Tracking

- Standard event tracking with categories
- Page view tracking
- User identification and profile tracking
- Error tracking
- Performance metrics
- Component visibility tracking

### Device and Browser Detection

- Automatic device type detection
- Browser identification
- Operating system detection
- Screen size tracking

### React Integration

- Automatic page view tracking with Next.js router
- Component visibility tracking
- Form submission tracking
- User interaction events

## API Reference

### Core Analytics API

```typescript
// Initialize the analytics service
analyticsAPI.initialize(config?: Partial<AnalyticsConfig>): Promise<void>

// Track a generic event
analyticsAPI.trackEvent(event: Partial<AnalyticsEvent>): Promise<void>

// Track a page view
analyticsAPI.trackPageView(path: string, title?: string): Promise<void>

// Identify a user
analyticsAPI.identifyUser(id: string, traits?: Record<string, any>): Promise<void>

// Reset user tracking (for logout)
analyticsAPI.resetUser(): Promise<void>

// Track an error
analyticsAPI.trackError(errorData: {
  errorCode?: string;
  errorMessage: string;
  errorSource?: string;
  stackTrace?: string;
}): Promise<void>

// Track performance metric
analyticsAPI.trackPerformance(performanceData: {
  metric: string;
  value: number;
  unit?: string;
}): Promise<void>

// Get current configuration
analyticsAPI.getConfig(): AnalyticsConfig

// Enable or disable analytics
analyticsAPI.setEnabled(enabled: boolean): void
```

### React Hook API

```typescript
const {
  // Methods
  trackEvent,       // Track generic event
  trackInteraction, // Track user interaction
  trackFormSubmission, // Track form submission
  trackConversion,  // Track conversion
  trackError        // Track error
} = useAnalytics();

// For tracking component visibility
const { ref } = useTrackComponentVisibility('hero-section', {
  threshold: 0.5,
  once: true,
  trackTime: true
});

// Then in JSX
<section ref={ref}>...</section>
```

## Event Categories

The service defines standard event categories to keep tracking consistent:

- `USER`: User account events (signup, login, profile updates)
- `CONTENT`: Content interaction (viewing articles, videos, podcasts)
- `NAVIGATION`: Page navigation and app routing
- `ENGAGEMENT`: User interactions and engagement metrics
- `CONVERSION`: Purchase and goal completion events
- `ERROR`: Error tracking and monitoring
- `PERFORMANCE`: Performance metrics and timing
- `CUSTOM`: Custom events not fitting other categories

## Configuration

The analytics service can be configured with:

```typescript
interface AnalyticsConfig {
  enabled: boolean;               // Master switch for analytics
  anonymousTracking?: boolean;    // Track anonymous users
  trackErrors?: boolean;          // Automatically track JS errors
  trackPerformance?: boolean;     // Track performance metrics
  samplingRate?: number;          // Sample rate (0-1)
  providers?: {                   // Analytics providers to enable
    googleAnalytics?: boolean;
    mixpanel?: boolean;
    segment?: boolean;
    amplitude?: boolean;
    custom?: boolean;
  };
}
```

## Security Considerations

- No PII (Personally Identifiable Information) is collected by default
- User IDs are only tracked after explicit identification
- Sensitive data should never be included in event properties
- Error tracking strips sensitive data from error messages

## Migration Strategy

1. For new code, use the consolidated API:
   ```typescript
   import { analyticsAPI, useAnalytics } from '@/services/analytics';
   ```

2. For existing code, continue using the compatibility layer:
   ```typescript
   import { AnalyticsService } from '@/services/analytics';
   ```

3. Gradually migrate to the new API as code is updated.

## Testing

Run unit tests for the analytics service:

```bash
npm run test src/services/analytics
```

## Best Practices

1. **Consistent Event Naming**: Use snake_case for event names and camelCase for properties
2. **Use Categories**: Always specify an appropriate event category
3. **Minimal Properties**: Include only necessary properties to avoid bloat
4. **User Consent**: Honor user preferences for analytics tracking
5. **Performance First**: Analytics should never impact app performance
