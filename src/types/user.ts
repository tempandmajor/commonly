export interface AppUser {
  id: string;
  email: string;
  name?: string | undefined;
  username?: string | undefined;
  bio?: string | undefined;
  profilePicture?: string | undefined;
  avatar?: string | undefined;
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  created_at: string; // Make this required to match the Profile.tsx usage
  updated_at?: string | undefined;
  location?: string | undefined; // Add location field
  website?: string | undefined; // Add website field
  role?: 'user' | undefined| 'admin' | 'event_organizer' | 'venue_owner' | 'caterer';
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
