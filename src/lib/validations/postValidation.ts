import * as z from 'zod';
import { commonValidations } from './shared';

// Post types
export const postTypes = ['text', 'image', 'video', 'audio', 'poll', 'event', 'product'] as const;
export const postVisibility = ['public', 'followers', 'friends', 'private'] as const;
export const postStatus = ['draft', 'published', 'scheduled'] as const;

// Base post fields used across all types
const basePostFields = {
  content: z
    .string()
    .min(1, 'Post content is required')
    .max(5000, 'Post must be less than 5000 characters'),

  visibility: z.enum(postVisibility).default('public'),
  status: z.enum(postStatus).default('published'),

  // Scheduling
  scheduledDate: z.date().optional(),

  // Location
  location: z
    .object({
      name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),

  // Tags and mentions
  tags: z.array(z.string()).max(30, 'Maximum 30 tags allowed').default([]),
  mentions: z.array(z.string()).default([]),

  // Settings
  allowComments: commonValidations.booleanWithDefault(true),
  allowReactions: commonValidations.booleanWithDefault(true),
  allowSharing: commonValidations.booleanWithDefault(true),
  hideFromFeed: commonValidations.booleanWithDefault(false),
  isPinned: commonValidations.booleanWithDefault(false),
};

// Text post schema
export const textPostSchema = z.object({
          ...basePostFields,
  type: z.literal('text'),
  formatting: z
    .object({
      bold: z.array(z.tuple([z.number(), z.number()])).optional(),
      italic: z.array(z.tuple([z.number(), z.number()])).optional(),
      underline: z.array(z.tuple([z.number(), z.number()])).optional(),
      links: z
        .array(
          z.object({
            start: z.number(),
            end: z.number(),
            url: commonValidations.url,
          })
        )
        .optional(),
    })
    .optional(),
});

export type TextPostFormValues = z.infer<typeof textPostSchema>;

// Image post schema
export const imagePostSchema = z.object({
          ...basePostFields,
  type: z.literal('image'),
  images: z
    .array(
      z.object({
        url: commonValidations.imageUrl,
        caption: z.string().max(200).optional(),
        altText: z.string().max(200).optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),

  layout: z.enum(['grid', 'carousel', 'single']).default('grid'),
});

export type ImagePostFormValues = z.infer<typeof imagePostSchema>;

// Video post schema
export const videoPostSchema = z.object({
          ...basePostFields,
  type: z.literal('video'),
  video: z.object({
    url: commonValidations.url,
    thumbnailUrl: commonValidations.imageUrl.optional(),
    duration: z.number().min(1).max(3600), // Max 1 hour
    width: z.number().optional(),
    height: z.number().optional(),
  }),

  autoplay: commonValidations.booleanWithDefault(false),
  loop: commonValidations.booleanWithDefault(false),
  muted: commonValidations.booleanWithDefault(true),
});

export type VideoPostFormValues = z.infer<typeof videoPostSchema>;

// Audio post schema
export const audioPostSchema = z.object({
          ...basePostFields,
  type: z.literal('audio'),
  audio: z.object({
    url: commonValidations.url,
    duration: z.number().min(1).max(3600), // Max 1 hour
    title: z.string().max(100).optional(),
    artist: z.string().max(100).optional(),
    coverUrl: commonValidations.imageUrl.optional(),
  }),

  visualizer: z.enum(['waveform', 'bars', 'circular']).default('waveform'),
});

export type AudioPostFormValues = z.infer<typeof audioPostSchema>;

// Poll post schema
export const pollPostSchema = z.object({
          ...basePostFields,
  type: z.literal('poll'),
  poll: z.object({
    question: commonValidations.requiredString('Poll question', 1, 200) as string,
    options: z
      .array(
        z.object({
          text: commonValidations.requiredString('Option', 1, 100) as string,
          emoji: z.string().optional(),
        })
      )
      .min(2, 'At least 2 options required')
      .max(6, 'Maximum 6 options allowed'),

    allowMultiple: commonValidations.booleanWithDefault(false),
    endDate: z.date().optional(),
    showResults: z.enum(['always', 'after_vote', 'after_end']).default('after_vote'),
    allowAddOptions: commonValidations.booleanWithDefault(false),
  }),
});

export type PollPostFormValues = z.infer<typeof pollPostSchema>;

// Event announcement post schema
export const eventPostSchema = z.object({
          ...basePostFields,
  type: z.literal('event'),
  event: z.object({
    eventId: z.string().optional(),
    title: commonValidations.requiredString('Event title', 1, 200) as string,
    startDate: z.date(),
    endDate: z.date().optional(),
    location: z.string().optional(),
    ticketUrl: commonValidations.url.optional(),
    coverImage: commonValidations.imageUrl.optional(),
  }),

  showRSVP: commonValidations.booleanWithDefault(true),
  showTicketButton: commonValidations.booleanWithDefault(true),
});

export type EventPostFormValues = z.infer<typeof eventPostSchema>;

// Product showcase post schema
export const productPostSchema = z.object({
          ...basePostFields,
  type: z.literal('product'),
  product: z.object({
    productId: z.string().optional(),
    name: commonValidations.requiredString('Product name', 1, 200) as string,
    description: z.string().max(500).optional(),
    price: z.number().min(0),
    currency: z.string().default('USD'),
    images: z.array(commonValidations.imageUrl).min(1).max(5),
    ctaText: z.string().default('Shop Now'),
    ctaUrl: commonValidations.url.optional(),
  }),

  showPrice: commonValidations.booleanWithDefault(true),
  enableQuickBuy: commonValidations.booleanWithDefault(false),
});

export type ProductPostFormValues = z.infer<typeof productPostSchema>;

// Story schema (24-hour posts)
export const storySchema = z.object({
  type: z.enum(['image', 'video', 'text']),
  content: z.string().max(500).optional(),
  mediaUrl: commonValidations.url.optional(),

  // Story specific
  duration: z.number().min(3).max(15).default(5), // seconds
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  font: z.enum(['default', 'serif', 'mono', 'handwritten']).default('default'),

  // Interactive elements
  stickers: z
    .array(
      z.object({
        type: z.enum(['emoji', 'gif', 'poll', 'question', 'location', 'mention']),
        position: z.object({ x: z.number(), y: z.number() }),
        scale: z.number().default(1),
        rotation: z.number().default(0),
        data: z.any(),
      })
    )
    .optional(),

  // Privacy
  hideFromUsers: z.array(z.string()).optional(),
  shareWithOnly: z.array(z.string()).optional(),
});

export type StoryFormValues = z.infer<typeof storySchema>;

// Helper functions
export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions = content.match(mentionRegex) || [];
  return mentions.map(m => m.substring(1));
};

export const extractHashtags = (content: string): string[] => {
  const hashtagRegex = /#(\w+)/g;
  const hashtags = content.match(hashtagRegex) || [];
  return hashtags.map(h => h.substring(1));
};

export const validateMediaFile = (file: File, type: 'image' | 'video' | 'audio') => {
  const limits = {
    image: {
      size: 10 * 1024 * 1024,
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
    video: { size: 100 * 1024 * 1024, types: ['video/mp4', 'video/webm', 'video/quicktime'] },
    audio: { size: 50 * 1024 * 1024, types: ['audio/mpeg', 'audio/wav', 'audio/ogg'] },
  };

  const limit = limits[type];

  if (file.size > limit.size) {
    return { valid: false, error: `File size must be less than ${limit.size / 1024 / 1024}MB` };
  }

  if (!limit.types.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Accepted: ${limit.types.join(', ')}` };
  }

  return { valid: true };
};

// Combined type for all posts
export type CreatePostFormValues =
  | TextPostFormValues
  | ImagePostFormValues
  | VideoPostFormValues
  | AudioPostFormValues
  | PollPostFormValues
  | EventPostFormValues
  | ProductPostFormValues;

// Default values
export const postDefaults: Partial<TextPostFormValues> = {
  content: '',
  type: 'text',
  visibility: 'public',
  status: 'published',
  tags: [],
  mentions: [],
  allowComments: true,
  allowReactions: true,
  allowSharing: true,
  hideFromFeed: false,
  isPinned: false,
};

export const storyDefaults: StoryFormValues = {
  type: 'image',
  duration: 5,
  font: 'default',
};
