import { z } from 'zod';

// Welcome step validation schema
export const welcomeStepSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(30, 'First name must be less than 30 characters'),

  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(30, 'Last name must be less than 30 characters'),

  avatar: z
    .object({
      file: z.any().optional(),
      url: z.string().url().optional(),
    })
    .optional(),

  bio: z.string().max(250, 'Bio must be less than 250 characters').optional(),
});

// Role selection validation schema
export const roleSelectionSchema = z.object({
  primaryRole: z.enum([
    'creator',
    'attendee',
    'organizer',
    'business-owner',
    'freelancer',
    'student',
    'entrepreneur',
    'other',
  ]),

  interests: z
    .array(
      z.enum([
        'events',
        'networking',
        'learning',
        'entertainment',
        'business',
        'technology',
        'arts-culture',
        'sports-fitness',
        'food-drink',
        'travel',
        'music',
        'photography',
        'writing',
        'marketing',
        'design',
      ])
    )
    .min(1, 'Please select at least one interest')
    .max(10, 'Maximum 10 interests allowed'),

  experience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),

  goals: z
    .array(
      z.enum([
        'attend-events',
        'create-events',
        'build-community',
        'network-professionally',
        'learn-new-skills',
        'promote-business',
        'find-opportunities',
        'share-knowledge',
        'discover-content',
        'collaborate',
      ])
    )
    .min(1, 'Please select at least one goal')
    .max(5, 'Maximum 5 goals allowed'),
});

// Location and preferences validation schema
export const preferencesStepSchema = z.object({
  location: z.object({
    city: z.string().min(2, 'City name is required'),
    state: z.string().optional(),
    country: z.string().min(2, 'Country is required'),
    timezone: z.string(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  }),

  searchRadius: z.number().min(1).max(500).default(25),

  language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt']).default('en'),

  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']).default('USD'),

  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
    marketing: z.boolean().default(false),
    events: z.boolean().default(true),
    messages: z.boolean().default(true),
    mentions: z.boolean().default(true),
  }),

  privacy: z.object({
    profileVisibility: z.enum(['public', 'friends', 'private']).default('public'),
    showLocation: z.boolean().default(true),
    allowMessages: z.boolean().default(true),
    showActivity: z.boolean().default(true),
  }),
});

// Social connections validation schema
export const socialConnectionsSchema = z.object({
  socialProfiles: z.object({
    twitter: z.string().url('Please enter a valid Twitter URL').optional().or(z.literal('')),
    linkedin: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
    instagram: z.string().url('Please enter a valid Instagram URL').optional().or(z.literal('')),
    facebook: z.string().url('Please enter a valid Facebook URL').optional().or(z.literal('')),
    website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
    portfolio: z.string().url('Please enter a valid portfolio URL').optional().or(z.literal('')),
  }),

  findFriends: z.object({
    syncContacts: z.boolean().default(false),
    findByEmail: z.boolean().default(true),
    findByPhone: z.boolean().default(false),
  }),

  inviteFriends: z
    .array(
      z.object({
        email: z.string().email('Please enter a valid email'),
        name: z.string().optional(),
      })
    )
    .max(10, 'Maximum 10 invites at once')
    .optional(),
});

// Complete onboarding validation schema
export const completeOnboardingSchema = z.object({
  newsletter: z.object({
    subscribe: z.boolean().default(true),
    frequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
    interests: z.array(z.string()).optional(),
  }),

  tour: z.object({
    takeTour: z.boolean().default(true),
    tourType: z.enum(['quick', 'detailed', 'skip']).default('quick'),
  }),

  verification: z.object({
    verifyEmail: z.boolean().default(true),
    verifyPhone: z.boolean().default(false),
    verifyIdentity: z.boolean().default(false),
  }),

  recommendations: z.object({
    enableRecommendations: z.boolean().default(true),
    shareData: z.boolean().default(false),
  }),
});

// Combined onboarding validation schema
export const onboardingSchema = z.object({
  currentStep: z.number().min(0).max(4).default(0),
  completedSteps: z.array(z.number()).default([]),

  welcome: welcomeStepSchema.partial(),
  role: roleSelectionSchema.partial(),
  preferences: preferencesStepSchema.partial(),
  social: socialConnectionsSchema.partial(),
  complete: completeOnboardingSchema.partial(),

  skipRemaining: z.boolean().default(false),
  completeOnboarding: z.boolean().default(false),
});

// Form defaults
export const welcomeStepDefaults = {
  firstName: '',
  lastName: '',
  bio: '',
};

export const roleSelectionDefaults = {
  primaryRole: 'attendee' as const,
  interests: [],
  experience: 'beginner' as const,
  goals: [],
};

export const preferencesStepDefaults = {
  location: {
    city: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  searchRadius: 25,
  language: 'en' as const,
  currency: 'USD' as const,
  notifications: {
    email: true,
    push: true,
    sms: false,
    marketing: false,
    events: true,
    messages: true,
    mentions: true,
  },
  privacy: {
    profileVisibility: 'public' as const,
    showLocation: true,
    allowMessages: true,
    showActivity: true,
  },
};

export const socialConnectionsDefaults = {
  socialProfiles: {
    twitter: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    website: '',
    portfolio: '',
  },
  findFriends: {
    syncContacts: false,
    findByEmail: true,
    findByPhone: false,
  },
  inviteFriends: [],
};

export const completeOnboardingDefaults = {
  newsletter: {
    subscribe: true,
    frequency: 'weekly' as const,
    interests: [],
  },
  tour: {
    takeTour: true,
    tourType: 'quick' as const,
  },
  verification: {
    verifyEmail: true,
    verifyPhone: false,
    verifyIdentity: false,
  },
  recommendations: {
    enableRecommendations: true,
    shareData: false,
  },
};

export const onboardingDefaults = {
  currentStep: 0,
  completedSteps: [],
  welcome: welcomeStepDefaults,
  role: roleSelectionDefaults,
  preferences: preferencesStepDefaults,
  social: socialConnectionsDefaults,
  complete: completeOnboardingDefaults,
  skipRemaining: false,
  completeOnboarding: false,
};

// Type exports
export type WelcomeStepValues = z.infer<typeof welcomeStepSchema>;
export type RoleSelectionValues = z.infer<typeof roleSelectionSchema>;
export type PreferencesStepValues = z.infer<typeof preferencesStepSchema>;
export type SocialConnectionsValues = z.infer<typeof socialConnectionsSchema>;
export type CompleteOnboardingValues = z.infer<typeof completeOnboardingSchema>;
export type OnboardingValues = z.infer<typeof onboardingSchema>;

// Step information
export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  estimatedTime: string;
}

// Progress tracking
export interface OnboardingProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  percentComplete: number;
  isComplete: boolean;
}
