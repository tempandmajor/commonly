import { z } from 'zod';

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),

  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),

  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must be less than 2000 characters'),

  inquiryType: z
    .enum([
      'general',
      'support',
      'partnership',
      'media',
      'bug-report',
      'feature-request',
      'business',
      'other',
    ])
    .optional(),

  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),

  company: z.string().max(100, 'Company name must be less than 100 characters').optional(),

  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),

  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        url: z.string().url(),
      })
    )
    .max(5, 'Maximum 5 attachments allowed')
    .optional(),

  consentToContact: z.boolean().refine(val => val === true, 'You must consent to being contacted'),

  marketingConsent: z.boolean().default(false).optional(),

  followUpMethod: z.enum(['email', 'phone', 'either']).default('email'),
});

// Support ticket validation schema
export const supportTicketSchema = z.object({
  subject: z
    .string()
    .min(10, 'Subject must be at least 10 characters')
    .max(100, 'Subject must be less than 100 characters'),

  description: z
    .string()
    .min(30, 'Description must be at least 30 characters')
    .max(3000, 'Description must be less than 3000 characters'),

  category: z.enum([
    'technical-issue',
    'account-problem',
    'billing-inquiry',
    'feature-request',
    'bug-report',
    'general-support',
    'security-concern',
    'data-request',
  ]),

  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),

  browser: z.string().optional(),
  operatingSystem: z.string().optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),

  stepsToReproduce: z.string().max(1000, 'Steps must be less than 1000 characters').optional(),

  expectedBehavior: z
    .string()
    .max(500, 'Expected behavior must be less than 500 characters')
    .optional(),

  actualBehavior: z
    .string()
    .max(500, 'Actual behavior must be less than 500 characters')
    .optional(),

  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        url: z.string().url(),
      })
    )
    .max(10, 'Maximum 10 attachments allowed')
    .optional(),

  affectedUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),

  errorMessage: z.string().max(500, 'Error message must be less than 500 characters').optional(),
});

// Feedback form validation schema
export const feedbackFormSchema = z.object({
  rating: z.number().min(1, 'Please provide a rating').max(5, 'Rating must be between 1 and 5'),

  feedbackType: z.enum([
    'bug-report',
    'feature-request',
    'improvement-suggestion',
    'compliment',
    'complaint',
    'general-feedback',
  ]),

  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),

  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),

  feature: z.string().max(50, 'Feature name must be less than 50 characters').optional(),

  userRole: z.enum(['creator', 'attendee', 'organizer', 'admin', 'business', 'other']).optional(),

  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),

  wouldRecommend: z.boolean().optional(),

  additionalComments: z
    .string()
    .max(1000, 'Additional comments must be less than 1000 characters')
    .optional(),

  allowFollowUp: z.boolean().default(false),

  screenshots: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        url: z.string().url(),
      })
    )
    .max(5, 'Maximum 5 screenshots allowed')
    .optional(),
});

// Newsletter subscription validation schema
export const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),

  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(30, 'First name must be less than 30 characters')
    .optional(),

  lastName: z.string().max(30, 'Last name must be less than 30 characters').optional(),

  interests: z
    .array(
      z.enum([
        'events',
        'products',
        'community-updates',
        'partnerships',
        'technology',
        'creator-tools',
        'business-features',
        'promotions',
      ])
    )
    .min(1, 'Please select at least one interest'),

  frequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),

  timezone: z.string().optional(),

  language: z.enum(['en', 'es', 'fr', 'de', 'it', 'pt']).default('en'),

  consentToMarketing: z
    .boolean()
    .refine(val => val === true, 'You must consent to marketing communications'),

  source: z
    .enum(['website', 'social-media', 'referral', 'search-engine', 'advertisement', 'other'])
    .optional(),
});

// Form defaults
export const contactFormDefaults = {
  name: '',
  email: '',
  subject: '',
  message: '',
  priority: 'medium' as const,
  company: '',
  phone: '',
  consentToContact: false,
  marketingConsent: false,
  followUpMethod: 'email' as const,
};

export const supportTicketDefaults = {
  subject: '',
  description: '',
  category: 'general-support' as const,
  priority: 'medium' as const,
  browser: '',
  operatingSystem: '',
  stepsToReproduce: '',
  expectedBehavior: '',
  actualBehavior: '',
  affectedUrl: '',
  errorMessage: '',
};

export const feedbackFormDefaults = {
  rating: 0,
  feedbackType: 'general-feedback' as const,
  title: '',
  description: '',
  feature: '',
  additionalComments: '',
  allowFollowUp: false,
};

export const newsletterDefaults = {
  email: '',
  firstName: '',
  lastName: '',
  interests: [],
  frequency: 'weekly' as const,
  language: 'en' as const,
  consentToMarketing: false,
};

// Type exports
export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type SupportTicketValues = z.infer<typeof supportTicketSchema>;
export type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;
export type NewsletterValues = z.infer<typeof newsletterSchema>;
