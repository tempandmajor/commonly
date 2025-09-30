# Authentication Service

This module provides a consolidated authentication service for the Commonly app, handling all user authentication, registration, and profile management functionality.

## Directory Structure

```
/src/services/auth/
  /api/         - Core API functions for auth operations
  /core/        - Types and interfaces
  /utils/       - Auth-specific utilities
  /hooks/       - React hooks for auth state management
  /compatibility/ - Legacy compatibility layers
  /tests/       - Unit tests
  README.md     - This documentation file
  index.ts      - Main export file
```

## Usage

### Modern Usage (Recommended)

```typescript
// Import the API directly
import { authAPI } from '@/services/auth';

// Using the auth API
const user = await authAPI.signInWithEmail({
  email: 'user@example.com',
  password: 'password123'
});

// For React components, use the hook
import { useAuth } from '@/services/auth';

function MyComponent() {
  const { user, login, logout } = useAuth();
  
  const handleLogin = async () => {
    await login({
      email: 'user@example.com',
      password: 'password123'
    });
  };
  
  return (
    <div>
      {user ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Legacy Usage (Backward Compatibility)

```typescript
// Import legacy service
import { AuthService, SocialAuthService } from '@/services/auth';

// Using legacy auth service
const user = await AuthService.login('user@example.com', 'password123');
await SocialAuthService.loginWithGoogle();
```

## Core Features

### User Authentication

- Email/password authentication
- Phone number with OTP verification
- Social login (Google, Facebook, Apple, etc.)
- Session management
- Password reset

### User Management

- User registration
- Profile management
- Email/password updates
- Account verification

### React Integration

- AuthProvider context for app-wide auth state
- useAuth hook for component access to auth state and methods

## API Reference

### Authentication

```typescript
// Sign in with email and password
authAPI.signInWithEmail({ email, password }): Promise<User | null>

// Sign in with phone number (send OTP)
authAPI.signInWithPhone({ phone }): Promise<{ user: User | null; isNewUser: boolean }>

// Verify OTP code
authAPI.signInWithPhone({ phone, code }): Promise<{ user: User | null; isNewUser: boolean }>

// Sign in with a third-party provider
authAPI.signInWithProvider(provider, redirectTo?): Promise<void>

// Sign up a new user
authAPI.signUp(registrationData): Promise<User | null>

// Sign out the current user
authAPI.signOut(): Promise<void>
```

### User Profile

```typescript
// Get the current session
authAPI.getSession(): Promise<{ user: User | null; session: any }>

// Get the current user with profile data
authAPI.getCurrentUser(): Promise<User | null>

// Update user profile
authAPI.updateProfile(userId, profileData): Promise<UserProfile | null>

// Update user email
authAPI.updateEmail(email): Promise<void>

// Update user password
authAPI.updatePassword(password): Promise<void>

// Reset password (send email)
authAPI.resetPassword({ email }): Promise<void>

// Reset password (with code)
authAPI.resetPassword({ email, code, newPassword }): Promise<void>
```

## React Hook API

```typescript
const {
  // State
  user,           // Current user or null
  session,        // Current session or null
  loading,        // Loading state
  error,          // Error state
  
  // Methods
  login,          // Login with email/password
  loginWithPhone, // Login with phone number
  loginWithProvider, // Login with social provider
  logout,         // Sign out
  signup,         // Register new user
  refreshUser,    // Refresh user data
  updateUserProfile, // Update profile
  updateUserEmail,   // Update email
  updateUserPassword, // Update password
  resetUserPassword,  // Reset password
} = useAuth();
```

## Security Considerations

- Sensitive operations are performed server-side
- Authentication state is synced with Supabase
- Session management follows best practices
- Password reset flows are secure

## Migration Strategy

1. For new code, use the consolidated API:
   ```typescript
   import { authAPI, useAuth } from '@/services/auth';
   ```

2. For existing code, continue using the compatibility layer:
   ```typescript
   import { AuthService } from '@/services/auth';
   ```

3. Gradually migrate to the new API as code is updated.

## Testing

Run unit tests for the authentication service:

```bash
npm run test src/services/auth
```
