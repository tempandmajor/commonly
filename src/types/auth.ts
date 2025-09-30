export interface User {
  id: string;
  email: string;
  name?: string | undefined;
  username?: string | undefined;
  bio?: string | undefined;
  profilePicture?: string | undefined;
  avatar?: string | undefined;
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;
  roles?: Array<'user' | undefined| 'admin' | 'event_organizer' | 'venue_owner' | 'caterer' | 'moderator'>;
  isAdmin?: boolean | undefined;
  isVerified?: boolean | undefined;
  phoneNumber?: string | undefined;
  isPhoneVerified?: boolean | undefined;
  followers?: string[] | undefined| number;
  following?: string[] | undefined| number;
  isFollowing?: boolean | undefined;
  isPrivate?: boolean | undefined;
  isEligibleForSubscription?: boolean | undefined;
  hasStore?: boolean | undefined;
  provider?: 'email' | undefined| 'google' | 'phone';
  stripeCustomerId?: string | undefined;
  platformCredit?: number | undefined;
  subscription?: {
    tier: string | undefined;
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: string | undefined;
  };
  createdAt?: Date;
  updatedAt?: Date;
  user_metadata?: {
    [key: string]: unknown;
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void> | undefined;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
