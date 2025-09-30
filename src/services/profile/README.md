# User Profile Service

This module provides a consolidated user profile service for the Commonly app, handling all profile-related operations, data management, and integrations with other services.

## Directory Structure

```
/src/services/profile/
  /api/         - Core profile API functionality
  /core/        - Types and interfaces
  /hooks/       - React hooks for profile operations
  /utils/       - Profile-specific utilities
  /compatibility/ - Legacy compatibility layers
  /tests/       - Unit tests
  README.md     - This documentation file
  index.ts      - Main export file
```

## Usage

### Modern Usage (Recommended)

```typescript
// Import the profile API
import { profileAPI, useProfileById, profileUtils } from '@/services/profile';

// Get profile by user ID
const profile = await profileAPI.getProfileById('user123');

// Use in a React component
function UserProfileCard({ userId }) {
  const { profile, loading, error } = useProfileById(userId);
  
  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!profile) return <div>Profile not found</div>;
  
  return (
    <div>
      <img src={profileUtils.getProfileAvatarUrl(profile)} alt="Avatar" />
      <h2>{profileUtils.formatDisplayName(profile)}</h2>
      <p>{profile.bio}</p>
      <div>Account Type: {profileUtils.getAccountTypeLabel(profile.account_type)}</div>
      <div>Status: {profileUtils.getProfileStatusLabel(profile.status)}</div>
    </div>
  );
}

// Update a profile
const { updateProfile, loading } = useProfileUpdate();
const handleUpdateBio = async (newBio) => {
  await updateProfile(profileId, { bio: newBio });
};

// Search for profiles
const { results, loading, search, nextPage } = useProfileSearch({
  query: 'john',
  limit: 10
});
```

### Legacy Usage (Backward Compatibility)

```typescript
// Import legacy service
import { ProfileService } from '@/services/profile';

// Using legacy API
const profile = await ProfileService.getUserProfile('user123');
const isAdmin = ProfileService.checkIfAdmin(profile);
const displayName = ProfileService.formatUserDisplayName(profile);
```

## Core Features

### Profile Management

- Create, read, update, delete user profiles
- Profile search with pagination and filtering
- Username availability checking and suggestions
- Profile avatar management
- Account types (personal, business, creator, organizer, admin)
- Status management (active, inactive, suspended, pending verification, deleted)

### Data Types

- Structured profile data with strong typing
- Contact information
- Social media links
- Notification preferences
- Privacy settings

### React Integration

- Hooks for all common profile operations
- Automatic loading/error states
- Search with pagination
- Profile update with optimistic updates

## API Reference

### Profile API

```typescript
// Core profile API
profileAPI.getProfileById(userId: string): Promise<UserProfile | null>
profileAPI.getProfileByUsername(username: string): Promise<UserProfile | null>
profileAPI.createProfile(profileData: ProfileCreateData): Promise<UserProfile>
profileAPI.updateProfile(profileId: string, data: ProfileUpdateData): Promise<UserProfile>
profileAPI.updateProfileAvatar(profileId: string, file: File): Promise<UserProfile>
profileAPI.deleteProfile(profileId: string): Promise<void>
profileAPI.searchProfiles(params: ProfileSearchParams): Promise<ProfileSearchResult>
profileAPI.isUsernameAvailable(username: string, excludeProfileId?: string): Promise<boolean>
profileAPI.getSuggestedUsernames(baseName: string, count?: number): Promise<string[]>
```

### React Hooks

```typescript
// Profile hooks
useProfileById(userId: string, options?): {
  profile: UserProfile | null;
  loading: boolean;
  error: ProfileError | null;
  refreshProfile: () => Promise<void>;
}

useProfileByUsername(username: string, options?): {
  profile: UserProfile | null;
  loading: boolean;
  error: ProfileError | null;
}

useProfileUpdate(): {
  updateProfile: (profileId: string, data: ProfileUpdateData) => Promise<UserProfile>;
  updateProfileAvatar: (profileId: string, file: File) => Promise<UserProfile>;
  loading: boolean;
  error: ProfileError | null;
}

useProfileSearch(initialParams?: ProfileSearchParams): {
  results: ProfileSearchResult;
  loading: boolean;
  error: ProfileError | null;
  search: (params?: ProfileSearchParams) => Promise<ProfileSearchResult>;
  nextPage: () => Promise<ProfileSearchResult> | null;
  previousPage: () => Promise<ProfileSearchResult> | null;
  searchParams: ProfileSearchParams;
  setSearchParams: React.Dispatch<React.SetStateAction<ProfileSearchParams>>;
}

useUsernameCheck(): {
  isAvailable: boolean | null;
  loading: boolean;
  error: ProfileError | null;
  checkUsername: (username: string, excludeProfileId?: string) => Promise<boolean>;
}

useSuggestedUsernames(): {
  suggestions: string[];
  loading: boolean;
  error: ProfileError | null;
  getSuggestions: (baseName: string, count?: number) => Promise<string[]>;
}
```

### Utilities

```typescript
// Profile utilities
profileUtils.formatDisplayName(profile: UserProfile | null): string
profileUtils.getProfileAvatarUrl(profile: UserProfile | null): string
profileUtils.getProfileInitials(profile: UserProfile | null): string
profileUtils.isAdmin(profile: UserProfile | null): boolean
profileUtils.isCreator(profile: UserProfile | null): boolean
profileUtils.isOrganizer(profile: UserProfile | null): boolean
profileUtils.isBusiness(profile: UserProfile | null): boolean
profileUtils.isProfileActive(profile: UserProfile | null): boolean
profileUtils.isProfileDeleted(profile: UserProfile | null): boolean
profileUtils.isProfileSuspended(profile: UserProfile | null): boolean
profileUtils.isProfilePendingVerification(profile: UserProfile | null): boolean
profileUtils.isProfileFieldVisible(profile: UserProfile | null, field: string, currentUserId?: string): boolean
profileUtils.getAccountTypeLabel(accountType?: AccountType): string
profileUtils.getProfileStatusLabel(status?: ProfileStatus): string
profileUtils.formatContactInfo(profile: UserProfile | null): string
profileUtils.validateUsername(username: string): { isValid: boolean; message?: string }
```

## Types

```typescript
// Core profile types
enum ProfileStatus {
  ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION, DELETED
}

enum AccountType {
  PERSONAL, BUSINESS, CREATOR, ORGANIZER, ADMIN
}

enum PrivacySetting {
  PUBLIC, FRIENDS_ONLY, PRIVATE
}

interface UserProfile {
  id: string;
  userId: string;
  username?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  status: ProfileStatus;
  account_type: AccountType;
  contact_info?: ContactInfo;
  social_links?: SocialLinks;
  notification_preferences?: NotificationPreferences;
  privacy_settings?: Record<string, PrivacySetting>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Error handling
enum ProfileErrorType {
  NOT_FOUND, ALREADY_EXISTS, INVALID_DATA, PERMISSION_DENIED,
  USERNAME_TAKEN, DATABASE_ERROR, UNKNOWN_ERROR
}

class ProfileError extends Error {
  public readonly type: ProfileErrorType;
  public readonly originalError?: Error;
  public readonly data?: any;
}
```

## Error Handling

The Profile service provides detailed error handling:

- **NOT_FOUND**: Profile could not be found
- **ALREADY_EXISTS**: Profile already exists
- **INVALID_DATA**: Invalid profile data provided
- **PERMISSION_DENIED**: User lacks permission for the operation
- **USERNAME_TAKEN**: Username is already in use
- **DATABASE_ERROR**: Database or storage error
- **UNKNOWN_ERROR**: Unspecified error

Each error provides:
- Human-readable message
- Error type for programmatic handling
- Original error (if applicable)
- Related data (if available)

## Security Considerations

1. **Row Level Security (RLS)**: The profile service respects Supabase RLS policies
2. **Privacy Settings**: Profiles have configurable field-level privacy settings
3. **Validation**: Username and profile data are validated before storage

## Migration Strategy

1. For new code, use the consolidated API:
   ```typescript
   import { profileAPI, useProfileById } from '@/services/profile';
   ```

2. For existing code, continue using the compatibility layer:
   ```typescript
   import { ProfileService } from '@/services/profile';
   ```

3. Gradually migrate to the new API as code is updated.

## Testing

Run unit tests for the profile service:

```bash
npm run test src/services/profile
```
