import * as z from 'zod';
import { commonValidations } from './shared';

export enum CommunityType {
  Public = 'public',
  Private = 'private',
  Invite = 'invite_only',
}

export enum CommunityCategory {
  Music = 'music',
  Art = 'art',
  Technology = 'technology',
  Sports = 'sports',
  Gaming = 'gaming',
  Education = 'education',
  Business = 'business',
  Lifestyle = 'lifestyle',
  Entertainment = 'entertainment',
  Other = 'other',
}

export const communityFormSchema = z.object({
  // Basic Information
  name: commonValidations.requiredString('Community name', 3, 50),
  description: commonValidations.requiredString('Description', 10, 500),
  shortDescription: commonValidations
    .requiredString('Short description', 10, 150)
    .describe('A brief description that appears in search results'),

  // Category and Type
  category: z.nativeEnum(CommunityCategory, {
    required_error: 'Please select a category',
  }),
  type: z.nativeEnum(CommunityType, {
    required_error: 'Please select a community type',
  }),

  // Visual Assets
  coverImage: commonValidations.imageUrl.describe('Community cover image URL'),
  icon: commonValidations.imageUrl.optional().describe('Community icon/avatar URL'),

  // Settings
  memberLimit: z
    .number()
    .int('Member limit must be a whole number')
    .min(2, 'Community must allow at least 2 members')
    .max(100000, 'Member limit cannot exceed 100,000')
    .optional(),

  isModerated: commonValidations.booleanWithDefault(true).describe('Enable community moderation'),

  allowMemberPosts: commonValidations
    .booleanWithDefault(true)
    .describe('Allow members to create posts'),

  requireApproval: commonValidations
    .booleanWithDefault(false)
    .describe('Require approval for new members'),

  // Rules and Guidelines
  rules: z
    .array(
      z.object({
        id: z.string(),
        title: commonValidations.requiredString('Rule title', 3, 100),
        description: commonValidations.optionalString(300),
      })
    )
    .min(1, 'Please add at least one community rule')
    .max(10, 'Maximum 10 rules allowed'),

  // Welcome Message
  welcomeMessage: commonValidations.optionalString(1000).describe('Message shown to new members'),

  // Tags for discoverability
  tags: z
    .array(z.string().min(2).max(20))
    .min(1, 'Add at least one tag')
    .max(5, 'Maximum 5 tags allowed')
    .describe('Tags help people discover your community'),

  // Social Links (optional)

  socialLinks: z
    .object({
      website: commonValidations.url.optional(),
      twitter: commonValidations.url.optional(),
      discord: commonValidations.url.optional(),
      telegram: commonValidations.url.optional(),
    })
    .optional(),

  // Advanced Settings

  minimumAccountAge: z
    .number()
    .int()
    .min(0)
    .max(365)
    .default(0)
    .describe('Minimum account age in days to join'),

  enableAnalytics: commonValidations.booleanWithDefault(true).describe('Track community analytics'),

});

export type CommunityFormValues = z.infer<typeof communityFormSchema>;

// Default values for the form
export const communityFormDefaults: Partial<CommunityFormValues> = {
  type: CommunityType.Public,
  category: CommunityCategory.Other,
  isModerated: true,
  allowMemberPosts: true,
  requireApproval: false,
  rules: [
    {
      id: '1',
      title: 'Be respectful',
      description: 'Treat all members with respect and kindness',
    },
  ],
  tags: [],
  minimumAccountAge: 0,
  enableAnalytics: true,
};

export const communitySubscriptionSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  monthlyPrice: z
    .number()
    .min(1, 'Monthly price must be at least $1')
    .max(999, 'Monthly price cannot exceed $999'),
  yearlyPrice: z
    .number()
    .min(1, 'Yearly price must be at least $1')
    .max(9999, 'Yearly price cannot exceed $9999'),
  recurringEvent: z
    .object({
      title: z
        .string()
        .min(3, 'Event title must be at least 3 characters')
        .max(100, 'Event title cannot exceed 100 characters'),
      description: z
        .string()
        .min(10, 'Event description must be at least 10 characters')
        .max(500, 'Event description cannot exceed 500 characters'),
      schedule: z.enum(['monthly', 'weekly', 'bi-weekly']),
      dayOfMonth: z.number().min(1).max(31).optional(),
      dayOfWeek: z.number().min(0).max(6).optional(),
      time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
      duration: z
        .number()
        .min(30, 'Duration must be at least 30 minutes')
        .max(480, 'Duration cannot exceed 8 hours'),
      location: z.string().min(3, 'Location must be at least 3 characters'),
      isVirtual: z.boolean().default(false),
      platform: z.string().optional(),
      maxCapacity: z.number().min(1).max(10000).optional(),
    })
    .refine(
      data => {
        if (data.schedule === 'monthly' && !data.dayOfMonth) {
          return false;
        }
        if (
          (data.schedule === 'weekly' || data.schedule === 'bi-weekly') &&
          data.dayOfWeek === undefined
        ) {
          return false;
        }
        if (data.isVirtual && !data.platform) {
          return false;
        }
        return true;
      },
      {
        message: 'Invalid schedule configuration',
        path: ['schedule'],
      }
    ),
  benefits: z
    .array(z.string().min(1, 'Benefit cannot be empty'))
    .min(1, 'At least one benefit is required'),
  autoCreateEvents: z.boolean().default(true),
});

export const communitySubscriptionSchema = z.object({
  communityId: z.string().min(1, 'Community ID is required'),
  subscriptionType: z.enum(['monthly', 'yearly']),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
});
