export type { User } from '../../types/auth';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string | undefined;
  bio?: string | undefined;
  location?: string | undefined;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showEmail: boolean;
    showLocation: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
}

// Remove duplicate AppUser interface - use the one from /types/user.ts
