# Notification Service

This module provides a consolidated notification service for the Commonly app, handling toast notifications, in-app notifications, and providing extensibility for other notification types like email and push notifications.

## Directory Structure

```
/src/services/notification/
  /api/          - Core API functions
  /core/         - Types and interfaces
  /hooks/        - React hooks for notifications
  /utils/        - Notification utilities
  /compatibility/ - Legacy compatibility layers
  /tests/        - Unit tests
  README.md      - This documentation file
  index.ts       - Main export file
```

## Usage

### Modern Usage (Recommended)

```tsx
// Initialize in _app.tsx
import { notificationAPI } from '@/services/notification';

// In your app initialization
useEffect(() => {
  notificationAPI.initialize({
    enabled: true,
    providers: {
      toast: true,
      inApp: true
    }
  });
}, []);

// For React components using hooks
import { useNotification } from '@/services/notification';

function MyComponent() {
  const { 
    showSuccessToast, 
    showErrorToast,
    inAppNotifications,
    unreadCount,
    markAsRead
  } = useNotification();
  
  const handleSubmit = async () => {
    try {
      await saveData();
      showSuccessToast('Success', 'Your data was saved successfully');
    } catch (error) {
      showErrorToast('Error', 'Failed to save data');
    }
  };
  
  return (
    <div>
      <button onClick={handleSubmit}>Save</button>
      
      {/* Show notification count badge */}
      <div className="notification-icon">
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </div>
      
      {/* Display in-app notifications */}
      <div className="notifications-panel">
        {inAppNotifications.map(notification => (
          <div 
            key={notification.id} 
            className={notification.read ? 'read' : 'unread'}
            onClick={() => markAsRead(notification.id!)}
          >
            <h4>{notification.title}</h4>
            <p>{notification.message}</p>
            <small>{formatRelativeTime(notification.timestamp!)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Using the Provider

```tsx
// In your app wrapper
import { NotificationProvider } from '@/services/notification';

function MyApp({ Component, pageProps }) {
  return (
    <NotificationProvider options={{ loadInAppNotifications: true }}>
      <Component {...pageProps} />
    </NotificationProvider>
  );
}

// In any component
import { useNotificationContext } from '@/services/notification';

function NotificationBadge() {
  const { unreadCount } = useNotificationContext();
  
  return (
    <div className="badge">
      {unreadCount > 0 && <span>{unreadCount}</span>}
    </div>
  );
}
```

### Legacy Usage (Backward Compatibility)

```tsx
// Import legacy service
import { ToastService } from '@/services/notification';

// Using legacy toast service
ToastService.success('Your data was saved successfully');
ToastService.error('Failed to save data');
```

## Core Features

### Toast Notifications

- Standard toast notifications with titles and messages
- Multiple variants: default, success, info, warning, error
- Configurable duration and position
- Support for action buttons
- Deduplication to prevent notification spam

### In-App Notifications

- Persistent notifications stored in memory (or database in future)
- Read/unread status tracking
- Support for notification links and actions
- Automatic sorting by timestamp
- Grouping by date ranges (today, yesterday, this week, etc.)

### Future Extensibility

- Email notifications (integration with email service)
- Push notifications (integration with push service)
- SMS notifications

### Notification Management

- User preference management
- Throttling and rate limiting
- Prioritization of important notifications
- Expiration of time-sensitive notifications

## API Reference

### Core Notification API

```typescript
// Initialize the notification service
notificationAPI.initialize(config?: Partial<NotificationConfig>): Promise<void>

// Show toast notifications
notificationAPI.showToast(title: string, message: string, variant?: NotificationVariant, options?: Partial<ToastNotification>): Promise<NotificationEvent>
notificationAPI.showSuccessToast(title: string, message: string, options?: Partial<ToastNotification>): Promise<NotificationEvent>
notificationAPI.showInfoToast(title: string, message: string, options?: Partial<ToastNotification>): Promise<NotificationEvent>
notificationAPI.showWarningToast(title: string, message: string, options?: Partial<ToastNotification>): Promise<NotificationEvent>
notificationAPI.showErrorToast(title: string, message: string, options?: Partial<ToastNotification>): Promise<NotificationEvent>

// In-app notifications
notificationAPI.createInAppNotification(userId: string, title: string, message: string, options?: Partial<InAppNotification>): Promise<NotificationEvent>
notificationAPI.getInAppNotifications(userId: string, includeRead?: boolean): InAppNotification[]
notificationAPI.markAsRead(notificationId: string): InAppNotification | null
notificationAPI.deleteNotification(notificationId: string): boolean
notificationAPI.clearUserNotifications(userId: string): number

// Configuration
notificationAPI.getConfig(): NotificationConfig
notificationAPI.setEnabled(enabled: boolean): void
```

### React Hooks API

```typescript
const {
  // Toast notifications
  showToast,
  showSuccessToast,
  showInfoToast,
  showWarningToast,
  showErrorToast,
  
  // In-app notifications
  inAppNotifications,
  unreadCount,
  isLoadingNotifications,
  refetchNotifications,
  
  // In-app notification actions
  markAsRead,
  deleteNotification,
  clearAllNotifications,
  createInAppNotification,
  
  // Status
  isMutating,
} = useNotification({
  loadInAppNotifications: true,
  includeRead: false,
  refetchInterval: 30000
});

// For feature/component badges
const { 
  isDismissed,
  dismissBadge,
  resetBadge
} = useBadgeNotification('feature-tour');
```

## Notification Types

The service defines several notification types:

- `TOAST`: Temporary on-screen notifications
- `IN_APP`: Persistent in-app notifications stored for later viewing
- `EMAIL`: Email notifications (future)
- `PUSH`: Push notifications (future)
- `SMS`: SMS notifications (future)

## Notification Variants

For visual styling, the following variants are supported:

- `DEFAULT`: Standard notification
- `SUCCESS`: Success-themed notification
- `INFO`: Informational notification
- `WARNING`: Warning notification
- `ERROR`: Error notification

## Configuration

The notification service can be configured with:

```typescript
interface NotificationConfig {
  enabled: boolean;
  providers: {
    toast?: boolean;
    inApp?: boolean;
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  defaultToastDuration?: number;
  defaultToastPosition?: string;
  maxQueueSize?: number;
  throttleLimit?: number;
  throttleWindow?: number;
}
```

## Integration with Other Services

- **Auth Service**: Used for getting current user information
- **Sonner**: Used for rendering toast notifications
- **React Query**: Used for managing notification state and data fetching

## Security Considerations

- Sensitive data should never be included in notification content
- In-app notifications are user-specific and should respect privacy
- Appropriate access control should be enforced for notification management

## Migration Strategy

1. For new code, use the consolidated API:
   ```typescript
   import { notificationAPI, useNotification } from '@/services/notification';
   ```

2. For existing code, continue using the compatibility layer:
   ```typescript
   import { ToastService, AlertService } from '@/services/notification';
   ```

3. Gradually migrate to the new API as code is updated.

## Future Improvements

- Database persistence for in-app notifications
- Integrations with email and push notification services
- Advanced notification grouping and categorization
- Notification analytics and tracking
- Advanced templating for notification content

## Best Practices

1. **Keep Content Concise**: Notifications should be clear and to the point
2. **Use Appropriate Variants**: Use the correct variant for the message type
3. **Avoid Notification Overload**: Don't overwhelm users with too many notifications
4. **Prioritize Properly**: Use high priority only for truly important notifications
5. **Respect User Preferences**: Honor notification settings and preferences
