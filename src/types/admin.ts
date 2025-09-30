// Admin-specific types to avoid conflicts with other type definitions

export interface Category {
  id: string;
  name: string;
  description: string;
  venueCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  city: string;
  state: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationFormData {
  city: string;
  state: string;
  country: string;
}

export interface Venue {
  id: string;
  name: string;
  description?: string | undefined;
  capacity?: number | undefined;
  location?: string | undefined;
  address?: {
    street: string | undefined;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  owner?: {
    id: string;
    name: string;
  };
  status: 'active' | 'pending' | 'suspended';
  featured: boolean;
  bookingCount: number;
  rating: number;
  pricePerHour?: number;
  images?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Studio {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  owner: string;
  address: string;
  created_at: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
}

// Content Management Types
export interface ContentSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'video';
  order: number;
}

export interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  subtitle?: string | undefined;
  sections?: ContentSection[] | undefined;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Management Types
export interface Artist {
  id: string;
  name: string;
  genre?: string | undefined;
  location?: string | undefined;
  bio?: string | undefined;
  image?: string | undefined;
  imageUrl?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  role: string;
  bio?: string | undefined;
  image?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  title?: string | undefined;
  description: string;
  icon?: string | undefined;
  price: number;
  category: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Records Management Types
export interface Album {
  id: string;
  title: string;
  artistId: string;
  artist?: string | undefined;
  releaseDate: string;
  imageUrl?: string | undefined;
  coverImage?: string | undefined;
  description?: string | undefined;
  createdAt: string;
}

// Settings Types
export interface PlatformSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;

  // General Settings
  platformName: string;
  siteUrl: string;
  description: string;

  // API Settings
  apiEnabled: boolean;
  rateLimit: number;
  webhooksEnabled: boolean;

  // Notification Settings
  notifyNewUsers: boolean;
  notifyNewEvents: boolean;
  notifyReports: boolean;
  weeklyDigest: boolean;

  // Security Settings
  requireTwoFactor: boolean;
  enforcePasswordPolicy: boolean;
  limitLoginAttempts: boolean;
  sessionTimeout: number;

  socialLinks: {
    facebook?: string | undefined;
    twitter?: string | undefined;
    instagram?: string | undefined;
    linkedin?: string | undefined;
    youtube?: string | undefined;
  };
  apiKeys: {
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
  security: {
    twoFactorRequired: boolean;
    passwordMinLength: number;
    sessionTimeout: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Navigation Types
export interface AdminNavItem {
  title: string;
  href: string;
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string } | undefined | undefined | undefined>;
  description: string;
  badge?: string;
}
