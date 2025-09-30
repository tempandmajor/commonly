# User Service

## Overview

The User Service provides a comprehensive set of APIs and hooks for managing users within the Commonly application. This service has been consolidated to improve maintainability, type safety, and developer experience.

## Features

- **Authentication**: User sign-in, sign-out, and metadata management
- **User Profiles**: Creating, updating, and deleting user profiles
- **User Settings**: Managing user-specific settings and platform credit
- **User Preferences**: Handling preferences like theme, language, and notifications
- **File Storage**: Upload and manage profile images and user files
- **React Hooks**: Tanstack Query-based hooks for all major operations

## Structure

```
/user
  /api                 # Core API functions
    /auth.ts           # Authentication operations
    /profile.ts        # Profile management
    /settings.ts       # Settings management
    /preferences.ts    # User preferences
    /storage.ts        # File storage operations
    /index.ts          # Combined API exports
  /core                # Core utilities and types
    /client.ts         # Supabase client and caching
    /constants.ts      # Service constants
    /errors.ts         # Error handling
  /hooks               # React hooks
    /useUser.tsx       # User-related hooks
    /index.ts          # Hook exports
  /tests               # Test files
    /api.test.ts       # API tests
    /hooks.test.tsx    # Hook tests
    /setup.ts          # Test setup utilities
  /index.ts            # Main service entry point
  /README.md           # Documentation
```

## API Usage

### Authentication

```typescript
import { authAPI } from '@/services/user/api';

// Get the current authenticated user
const currentUser = await authAPI.getCurrentUser();

// Get a user by their ID
const user = await authAPI.getUserById('user-id-123');

// Get a user by their username
const userByName = await authAPI.getUserByUsername('johndoe');

// Sign out the current user
await authAPI.signOut();

// Update user metadata
await authAPI.updateUserMetadata({ role: 'admin', customField: 'value' });
```

### User Profiles

```typescript
import { profileAPI } from '@/services/user/api';

// Create a new user profile
await profileAPI.createUserProfile('user-id-123', {
  display_name: 'John Doe',
  bio: 'Software developer',
  avatar_url: 'https://example.com/avatar.jpg'
});

// Update an existing user profile
await profileAPI.updateUserProfile('user-id-123', {
  bio: 'Senior software developer'
});

// Update user avatar
await profileAPI.updateUserAvatar('user-id-123', 'https://example.com/new-avatar.jpg');

// Search for users
const users = await profileAPI.searchUsers('john');
```

### User Settings

```typescript
import { settingsAPI } from '@/services/user/api';

// Get user settings
const settings = await settingsAPI.getUserSettings('user-id-123');

// Update user settings
await settingsAPI.updateUserSettings('user-id-123', {
  platformCredit: 100,
  paymentPreferences: {
    defaultMethod: 'stripe',
    autoRecharge: true
  }
});

// Initialize user settings (for new users)
await settingsAPI.initializeUserSettings('user-id-123');

// Add platform credit
await settingsAPI.addPlatformCredit('user-id-123', 50);
```

### User Preferences

```typescript
import { preferencesAPI } from '@/services/user/api';

// Get user preferences
const preferences = await preferencesAPI.getUserPreferences('user-id-123');

// Update preferences
await preferencesAPI.updateUserPreferences('user-id-123', {
  theme: 'dark',
  language: 'en'
});

// Update specific preference sections
await preferencesAPI.updateTheme('user-id-123', 'light');
await preferencesAPI.updateLanguage('user-id-123', 'fr');
await preferencesAPI.updateNotificationPreferences('user-id-123', {
  email: true,
  push: false
});

// Reset preferences to defaults
await preferencesAPI.resetPreferences('user-id-123');
```

### Storage

```typescript
import { storageAPI } from '@/services/user/api';

// Upload a profile image
const imageUrl = await storageAPI.uploadProfileImage('user-id-123', imageFile);

// Upload a user file
const fileUrl = await storageAPI.uploadUserFile('user-id-123', 'general', documentFile);

// List user files
const files = await storageAPI.listUserFiles('user-id-123', 'general');

// Delete a file
await storageAPI.deleteUserFile('user-id-123', 'general/document.pdf');

// Get a signed URL for temporary access
const signedUrl = await storageAPI.getSignedUrl('user-id-123', 'general/private-doc.pdf', 60);
```

## React Hooks Usage

The User Service provides React hooks built on top of `@tanstack/react-query` for seamless integration with React components:

### Current User

```tsx
import { useCurrentUser } from '@/services/user/hooks';

function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUser();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading user</div>;
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <img src={user?.avatar_url} alt="Avatar" />
    </div>
  );
}
```

### User Fetching

```tsx
import { useUser, useUserByUsername } from '@/services/user/hooks';

// Fetch by ID
function UserDetail({ userId }) {
  const { data: user } = useUser(userId);
  // ...
}

// Fetch by username
function UserProfile({ username }) {
  const { data: user } = useUserByUsername(username);
  // ...
}
```

### Profile Updates

```tsx
import { useUpdateProfile, useUploadProfileImage } from '@/services/user/hooks';

function EditProfile({ userId }) {
  const updateProfile = useUpdateProfile();
  const uploadImage = useUploadProfileImage();
  
  const handleSubmit = async (formData) => {
    await updateProfile.mutateAsync({
      userId,
      data: {
        display_name: formData.name,
        bio: formData.bio
      }
    });
  };
  
  const handleImageUpload = async (file) => {
    const imageUrl = await uploadImage.mutateAsync({
      userId,
      file
    });
    // Use the imageUrl...
  };
  
  return (
    // Form implementation...
  );
}
```

### Settings & Preferences

```tsx
import { 
  useUserSettings, 
  useUpdateUserSettings,
  useUserPreferences,
  useUpdateUserPreferences
} from '@/services/user/hooks';

function SettingsPanel({ userId }) {
  // Settings
  const { data: settings } = useUserSettings(userId);
  const updateSettings = useUpdateUserSettings();
  
  // Preferences
  const { data: preferences } = useUserPreferences(userId);
  const updatePreferences = useUpdateUserPreferences();
  
  const handleUpdateSettings = async (newSettings) => {
    await updateSettings.mutateAsync({
      userId,
      settings: newSettings
    });
  };
  
  const handleUpdatePreferences = async (newPreferences) => {
    await updatePreferences.mutateAsync({
      userId,
      preferences: newPreferences
    });
  };
  
  return (
    // Settings and preferences UI...
  );
}
```

### Sign Out

```tsx
import { useSignOut } from '@/services/user/hooks';

function LogoutButton() {
  const signOut = useSignOut();
  
  return (
    <button 
      onClick={() => signOut.mutate()}
      disabled={signOut.isLoading}
    >
      {signOut.isLoading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}
```

## Backward Compatibility

The main service entry point maintains backward compatibility with legacy code. These legacy functions are marked as deprecated and will redirect to the new implementations.

```typescript
import { 
  checkUsernameAvailability, 
  uploadProfileImage 
} from '@/services/user';

// Still works but will log deprecation warning
await checkUsernameAvailability('johndoe');
await uploadProfileImage('user-id-123', imageFile);
```

## Testing

The User Service includes comprehensive test coverage:

- **API Tests**: Test all API functions with mocked Supabase responses
- **Hook Tests**: Test React hooks with React Testing Library and mocked API responses

Run tests with:

```bash
# Run all user service tests
npx vitest run -c vitest.config.ts "src/services/user/tests/**"

# Watch mode
npx vitest -c vitest.config.ts "src/services/user/tests/**"
```

## Error Handling

The service includes standardized error handling:

```typescript
import { createUserError, isUserError } from '@/services/user/core/errors';

try {
  // Some operation
} catch (error) {
  if (isUserError(error)) {
    // Handle specific user service error
    console.error(`User error: ${error.message}`);
  } else {
    // Handle other errors
    console.error('Unknown error:', error);
  }
}
```

## Caching

The service implements intelligent caching for user profiles and settings to optimize performance and reduce redundant database calls. Cache invalidation is handled automatically when data is modified.
