export interface ProfileData {
  name: string;
  username: string;
  bio: string;
  email: string;
  phoneNumber: string;
  isPrivate: boolean;
  isEligibleForSubscription: boolean;
}

export interface UseProfileStateProps {
  userId?: string | undefined;
}

// Add User interface needed by ProfileContext
export interface User {
  id: string;
  email: string;
  name?: string | undefined;
  username?: string | undefined;
  photoURL?: string | undefined;
  isAdmin?: boolean | undefined;
  isVerified?: boolean | undefined;
  lastLogin?: string | undefined;
  createdAt?: string | undefined;
  stripeCustomerId?: string | undefined;
}
