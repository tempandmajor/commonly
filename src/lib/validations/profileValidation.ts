import * as z from 'zod';
import { commonValidations } from './shared';

export enum AccountType {
  Personal = 'personal',
  Creator = 'creator',
  Business = 'business',
  Organization = 'organization',
}

export enum ProfileVisibility {
  Public = 'public',
  Private = 'private',
  Friends = 'friends',
}

// Social link schema
const socialLinkSchema = z.object({
  platform: z.string(),
  url: commonValidations.url,
  verified: commonValidations.booleanWithDefault(false),
});

// Notification preferences schema
const notificationPreferencesSchema = z.object({
  email: z.object({
    newsletter: commonValidations.booleanWithDefault(true),
    eventReminders: commonValidations.booleanWithDefault(true),
    productUpdates: commonValidations.booleanWithDefault(true),
    communityActivity: commonValidations.booleanWithDefault(true),
    messages: commonValidations.booleanWithDefault(true),
  }),
  push: z.object({
    eventReminders: commonValidations.booleanWithDefault(true),
    messages: commonValidations.booleanWithDefault(true),
    mentions: commonValidations.booleanWithDefault(true),
    likes: commonValidations.booleanWithDefault(false),
    comments: commonValidations.booleanWithDefault(true),
  }),
});

// Privacy settings schema
const privacySettingsSchema = z.object({
  profileVisibility: z.nativeEnum(ProfileVisibility).default(ProfileVisibility.Public),
  showEmail: commonValidations.booleanWithDefault(false),
  showLocation: commonValidations.booleanWithDefault(true),
  showBirthdate: commonValidations.booleanWithDefault(false),
  allowMessagesFrom: z.enum(['anyone', 'friends', 'none']).default('friends'),
  showActivityStatus: commonValidations.booleanWithDefault(true),
});

// Main profile form schema
export const profileFormSchema = z.object({
  // Basic Information
  name: commonValidations.requiredString('Name', 2, 50) as string,
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  email: commonValidations.email,
  bio: commonValidations.optionalString(500) as string,

  // Profile Details
  avatar: commonValidations.imageUrl.optional(),
  coverImage: commonValidations.imageUrl.optional(),
  location: commonValidations.optionalString(100) as string,
  website: commonValidations.url.optional(),
  birthdate: z.date().optional(),
  phone: commonValidations.phone.optional(),

  // Account Settings
  accountType: z.nativeEnum(AccountType).default(AccountType.Personal),
  verified: commonValidations.booleanWithDefault(false),

  // Professional Information
  profession: commonValidations.optionalString(100) as string,
  company: commonValidations.optionalString(100) as string,
  education: commonValidations.optionalString(200) as string,
  skills: z.array(z.string().min(1).max(30)).max(20, 'Maximum 20 skills allowed').optional(),

  // Social Links
  socialLinks: z.array(socialLinkSchema).max(10, 'Maximum 10 social links allowed').optional(),

  // Interests and Preferences
  interests: z.array(z.string().min(1).max(30)).max(20, 'Maximum 20 interests allowed').optional(),
  languages: z.array(z.string()).max(10, 'Maximum 10 languages allowed').optional(),

  // Settings
  notificationPreferences: notificationPreferencesSchema.optional(),
  privacySettings: privacySettingsSchema.optional(),

  // Creator-specific fields
  stripeConnectId: z.string().optional(),
  paypalEmail: commonValidations.email.optional(),
  supportersCount: z.number().int().nonnegative().default(0),
  monthlyRevenue: z.number().nonnegative().default(0),

  // Stats (read-only, but included for completeness)
  followersCount: z.number().int().nonnegative().default(0),
  followingCount: z.number().int().nonnegative().default(0),
  eventsCreated: z.number().int().nonnegative().default(0),
  productsCreated: z.number().int().nonnegative().default(0),

  // Metadata
  joinedDate: z.date().optional(),
  lastActive: z.date().optional(),
  isActive: commonValidations.booleanWithDefault(true),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Partial schema for updates (all fields optional)
export const profileUpdateSchema = profileFormSchema.partial();

export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;

// Default values for the form
export const profileFormDefaults: Partial<ProfileFormValues> = {
  accountType: AccountType.Personal,
  verified: false,
  isActive: true,
  supportersCount: 0,
  monthlyRevenue: 0,
  followersCount: 0,
  followingCount: 0,
  eventsCreated: 0,
  productsCreated: 0,
  socialLinks: [],
  interests: [],
  languages: [],
  skills: [],
  notificationPreferences: {
    email: {
      newsletter: true,
      eventReminders: true,
      productUpdates: true,
      communityActivity: true,
      messages: true,
    },
    push: {
      eventReminders: true,
      messages: true,
      mentions: true,
      likes: false,
      comments: true,
    },
  },
  privacySettings: {
    profileVisibility: ProfileVisibility.Public,
    showEmail: false,
    showLocation: true,
    showBirthdate: false,
    allowMessagesFrom: 'friends',
    showActivityStatus: true,
  },
};
