import { z } from 'zod';

// Account settings validation schema
export const accountSettingsSchema = z.object({
  profile: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(30),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(30),
    displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
    location: z.string().max(100, 'Location must be less than 100 characters').optional(),
    birthday: z.string().optional(),
    gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say', 'other']).optional(),
    phoneNumber: z.string().optional(),
    timezone: z.string(),
    language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt']),
  }),

  email: z.object({
    primary: z.string().email('Please enter a valid email address'),
    backup: z.string().email('Please enter a valid backup email').optional().or(z.literal('')),
    emailOnLogin: z.boolean().default(true),
    emailOnPasswordChange: z.boolean().default(true),
    twoFactorEnabled: z.boolean().default(false),
  }),

  password: z
    .object({
      currentPassword: z.string().optional(),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain uppercase, lowercase, and number'
        )
        .optional(),
      confirmPassword: z.string().optional(),
    })
    .refine(
      data => {
        if (data.newPassword && data.newPassword !== data.confirmPassword) {
          return false;
        }
        return true;
      },
      {
        message: "Passwords don't match",
        path: ['confirmPassword'],
      }
    ),

  avatar: z
    .object({
      url: z.string().url().optional(),
      file: z.any().optional(),
    })
    .optional(),

  socialProfiles: z.object({
    twitter: z.string().url('Please enter a valid Twitter URL').optional().or(z.literal('')),
    linkedin: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
    instagram: z.string().url('Please enter a valid Instagram URL').optional().or(z.literal('')),
    facebook: z.string().url('Please enter a valid Facebook URL').optional().or(z.literal('')),
    github: z.string().url('Please enter a valid GitHub URL').optional().or(z.literal('')),
    youtube: z.string().url('Please enter a valid YouTube URL').optional().or(z.literal('')),
    portfolio: z.string().url('Please enter a valid portfolio URL').optional().or(z.literal('')),
  }),

  deactivation: z.object({
    reason: z
      .enum(['taking-break', 'privacy-concerns', 'not-useful', 'too-many-notifications', 'other'])
      .optional(),
    feedback: z.string().max(500).optional(),
    deleteData: z.boolean().default(false),
  }),
});

// Privacy settings validation schema
export const privacySettingsSchema = z.object({
  profile: z.object({
    visibility: z.enum(['public', 'friends', 'private']),
    showEmail: z.boolean().default(false),
    showPhoneNumber: z.boolean().default(false),
    showLocation: z.boolean().default(true),
    showBirthday: z.boolean().default(false),
    showActivity: z.boolean().default(true),
    showFriends: z.boolean().default(true),
    allowSearch: z.boolean().default(true),
  }),

  messaging: z.object({
    allowMessages: z.boolean().default(true),
    friendsOnly: z.boolean().default(false),
    filterRequests: z.boolean().default(true),
    autoAcceptFromFriends: z.boolean().default(true),
    readReceipts: z.boolean().default(true),
    onlineStatus: z.boolean().default(true),
  }),

  content: z.object({
    whoCanSeeMyPosts: z.enum(['public', 'friends', 'custom']),
    whoCanTagMe: z.enum(['everyone', 'friends', 'no-one']),
    whoCanMentionMe: z.enum(['everyone', 'friends', 'no-one']),
    moderateComments: z.boolean().default(false),
    hideFromSearch: z.boolean().default(false),
    allowIndexing: z.boolean().default(true),
  }),

  data: z.object({
    trackingConsent: z.boolean().default(false),
    analyticsConsent: z.boolean().default(false),
    marketingConsent: z.boolean().default(false),
    cookiePreferences: z.enum(['essential', 'functional', 'all']),
    dataRetention: z.enum(['1-year', '2-years', '5-years', 'indefinite']),
    downloadData: z.boolean().default(false),
  }),

  blocking: z.object({
    blockedUsers: z.array(z.string()).default([]),
    blockedKeywords: z.array(z.string()).default([]),
    restrictedMode: z.boolean().default(false),
  }),
});

// Notification settings validation schema
export const notificationSettingsSchema = z.object({
  email: z.object({
    enabled: z.boolean().default(true),
    frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']),
    newFollowers: z.boolean().default(true),
    likes: z.boolean().default(true),
    comments: z.boolean().default(true),
    mentions: z.boolean().default(true),
    directMessages: z.boolean().default(true),
    eventInvitations: z.boolean().default(true),
    eventReminders: z.boolean().default(true),
    eventUpdates: z.boolean().default(true),
    productUpdates: z.boolean().default(false),
    newsletter: z.boolean().default(false),
    marketing: z.boolean().default(false),
    systemAlerts: z.boolean().default(true),
  }),

  push: z.object({
    enabled: z.boolean().default(true),
    newFollowers: z.boolean().default(true),
    likes: z.boolean().default(false),
    comments: z.boolean().default(true),
    mentions: z.boolean().default(true),
    directMessages: z.boolean().default(true),
    eventInvitations: z.boolean().default(true),
    eventReminders: z.boolean().default(true),
    eventStarting: z.boolean().default(true),
    quiet: z.object({
      enabled: z.boolean().default(false),
      startTime: z.string().default('22:00'),
      endTime: z.string().default('08:00'),
      weekendsOnly: z.boolean().default(false),
    }),
  }),

  inApp: z.object({
    enabled: z.boolean().default(true),
    newFollowers: z.boolean().default(true),
    likes: z.boolean().default(true),
    comments: z.boolean().default(true),
    mentions: z.boolean().default(true),
    directMessages: z.boolean().default(true),
    eventInvitations: z.boolean().default(true),
    eventReminders: z.boolean().default(true),
    systemAlerts: z.boolean().default(true),
    achievements: z.boolean().default(true),
  }),

  sms: z.object({
    enabled: z.boolean().default(false),
    phoneNumber: z.string().optional(),
    securityAlerts: z.boolean().default(true),
    eventReminders: z.boolean().default(false),
    importantUpdates: z.boolean().default(true),
  }),

  categories: z.object({
    social: z.boolean().default(true),
    events: z.boolean().default(true),
    products: z.boolean().default(true),
    security: z.boolean().default(true),
    marketing: z.boolean().default(false),
    system: z.boolean().default(true),
  }),
});

// Preferences settings validation schema
export const preferencesSettingsSchema = z.object({
  display: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt']),
    timezone: z.string(),
    dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
    timeFormat: z.enum(['12h', '24h']),
    fontSize: z.enum(['small', 'medium', 'large']),
    reducedMotion: z.boolean().default(false),
    highContrast: z.boolean().default(false),
  }),

  content: z.object({
    defaultFeedView: z.enum(['following', 'discover', 'local']),
    autoplayVideos: z.boolean().default(true),
    showNSFWContent: z.boolean().default(false),
    contentLanguages: z.array(z.string()).default(['en']),
    recommendationsEnabled: z.boolean().default(true),
    trendsEnabled: z.boolean().default(true),
  }),

  location: z.object({
    shareLocation: z.boolean().default(false),
    defaultLocation: z.string().optional(),
    searchRadius: z.number().min(1).max(500).default(25),
    showNearbyEvents: z.boolean().default(true),
    locationAccuracy: z.enum(['exact', 'city', 'region']),
  }),

  interaction: z.object({
    autoFollowBack: z.boolean().default(false),
    showReadReceipts: z.boolean().default(true),
    keyboardShortcuts: z.boolean().default(true),
    soundEffects: z.boolean().default(true),
    hapticFeedback: z.boolean().default(true),
    confirmBeforeLeaving: z.boolean().default(true),
  }),

  advanced: z.object({
    developerMode: z.boolean().default(false),
    betaFeatures: z.boolean().default(false),
    apiAccess: z.boolean().default(false),
    dataExport: z.object({
      format: z.enum(['json', 'csv', 'xml']),
      includeMedia: z.boolean().default(false),
      frequency: z.enum(['manual', 'weekly', 'monthly']),
    }),
  }),
});

// Combined settings validation schema
export const settingsSchema = z.object({
  account: accountSettingsSchema.partial(),
  privacy: privacySettingsSchema.partial(),
  notifications: notificationSettingsSchema.partial(),
  preferences: preferencesSettingsSchema.partial(),
});

// Form defaults
export const accountSettingsDefaults = {
  profile: {
    firstName: '',
    lastName: '',
    displayName: '',
    bio: '',
    website: '',
    location: '',
    birthday: '',
    phoneNumber: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en' as const,
  },
  email: {
    primary: '',
    backup: '',
    emailOnLogin: true,
    emailOnPasswordChange: true,
    twoFactorEnabled: false,
  },
  password: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
  socialProfiles: {
    twitter: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    github: '',
    youtube: '',
    portfolio: '',
  },
  deactivation: {
    deleteData: false,
  },
};

export const privacySettingsDefaults = {
  profile: {
    visibility: 'public' as const,
    showEmail: false,
    showPhoneNumber: false,
    showLocation: true,
    showBirthday: false,
    showActivity: true,
    showFriends: true,
    allowSearch: true,
  },
  messaging: {
    allowMessages: true,
    friendsOnly: false,
    filterRequests: true,
    autoAcceptFromFriends: true,
    readReceipts: true,
    onlineStatus: true,
  },
  content: {
    whoCanSeeMyPosts: 'public' as const,
    whoCanTagMe: 'friends' as const,
    whoCanMentionMe: 'everyone' as const,
    moderateComments: false,
    hideFromSearch: false,
    allowIndexing: true,
  },
  data: {
    trackingConsent: false,
    analyticsConsent: false,
    marketingConsent: false,
    cookiePreferences: 'functional' as const,
    dataRetention: '2-years' as const,
    downloadData: false,
  },
  blocking: {
    blockedUsers: [],
    blockedKeywords: [],
    restrictedMode: false,
  },
};

export const notificationSettingsDefaults = {
  email: {
    enabled: true,
    frequency: 'daily' as const,
    newFollowers: true,
    likes: true,
    comments: true,
    mentions: true,
    directMessages: true,
    eventInvitations: true,
    eventReminders: true,
    eventUpdates: true,
    productUpdates: false,
    newsletter: false,
    marketing: false,
    systemAlerts: true,
  },
  push: {
    enabled: true,
    newFollowers: true,
    likes: false,
    comments: true,
    mentions: true,
    directMessages: true,
    eventInvitations: true,
    eventReminders: true,
    eventStarting: true,
    quiet: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      weekendsOnly: false,
    },
  },
  inApp: {
    enabled: true,
    newFollowers: true,
    likes: true,
    comments: true,
    mentions: true,
    directMessages: true,
    eventInvitations: true,
    eventReminders: true,
    systemAlerts: true,
    achievements: true,
  },
  sms: {
    enabled: false,
    phoneNumber: '',
    securityAlerts: true,
    eventReminders: false,
    importantUpdates: true,
  },
  categories: {
    social: true,
    events: true,
    products: true,
    security: true,
    marketing: false,
    system: true,
  },
};

export const preferencesSettingsDefaults = {
  display: {
    theme: 'system' as const,
    language: 'en' as const,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY' as const,
    timeFormat: '12h' as const,
    fontSize: 'medium' as const,
    reducedMotion: false,
    highContrast: false,
  },
  content: {
    defaultFeedView: 'following' as const,
    autoplayVideos: true,
    showNSFWContent: false,
    contentLanguages: ['en'],
    recommendationsEnabled: true,
    trendsEnabled: true,
  },
  location: {
    shareLocation: false,
    defaultLocation: '',
    searchRadius: 25,
    showNearbyEvents: true,
    locationAccuracy: 'city' as const,
  },
  interaction: {
    autoFollowBack: false,
    showReadReceipts: true,
    keyboardShortcuts: true,
    soundEffects: true,
    hapticFeedback: true,
    confirmBeforeLeaving: true,
  },
  advanced: {
    developerMode: false,
    betaFeatures: false,
    apiAccess: false,
    dataExport: {
      format: 'json' as const,
      includeMedia: false,
      frequency: 'manual' as const,
    },
  },
};

export const settingsDefaults = {
  account: accountSettingsDefaults,
  privacy: privacySettingsDefaults,
  notifications: notificationSettingsDefaults,
  preferences: preferencesSettingsDefaults,
};

// Type exports
export type AccountSettingsValues = z.infer<typeof accountSettingsSchema>;
export type PrivacySettingsValues = z.infer<typeof privacySettingsSchema>;
export type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;
export type PreferencesSettingsValues = z.infer<typeof preferencesSettingsSchema>;
export type SettingsValues = z.infer<typeof settingsSchema>;

// Settings categories
export interface SettingsCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  sections: SettingsSection[];
}

export interface SettingsSection {
  id: string;
  title: string;
  description?: string | undefined;
  fields: string[];
}
