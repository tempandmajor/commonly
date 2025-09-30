import * as z from 'zod';
import { commonValidations } from './shared';

// Comment types
export const commentTypes = ['text', 'reply', 'review', 'feedback'] as const;
export const commentStatus = ['visible', 'hidden', 'flagged', 'deleted'] as const;

// Base comment schema
export const baseCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),

  parentId: z.string().optional(), // For replies

  // Attachments
  attachments: z
    .array(
      z.object({
        type: z.enum(['image', 'video', 'gif', 'sticker']),
        url: commonValidations.url,
        thumbnail: commonValidations.url.optional(),
        alt: z.string().optional(),
      })
    )
    .max(4, 'Maximum 4 attachments allowed')
    .optional(),

  // Mentions
  mentions: z.array(z.string()).optional(),

  // Settings
  isPrivate: commonValidations.booleanWithDefault(false),
  allowReplies: commonValidations.booleanWithDefault(true),
});

export type BaseCommentFormValues = z.infer<typeof baseCommentSchema>;

// Standard comment schema
export const commentSchema = baseCommentSchema.extend({
  type: z.literal('text').default('text'),
});

export type CommentFormValues = z.infer<typeof commentSchema>;

// Reply schema
export const replySchema = baseCommentSchema.extend({
  type: z.literal('reply').default('reply'),
  parentId: z.string().min(1, 'Parent comment ID is required'),

  // Reply-specific
  mentionParentAuthor: commonValidations.booleanWithDefault(true),
});

export type ReplyFormValues = z.infer<typeof replySchema>;

// Review comment schema
export const reviewCommentSchema = baseCommentSchema.extend({
  type: z.literal('review').default('review'),

  // Review-specific
  rating: z.number().min(1).max(5),
  title: z.string().min(1, 'Review title is required').max(100),

  // Review categories
  categories: z
    .object({
      quality: z.number().min(1).max(5).optional(),
      service: z.number().min(1).max(5).optional(),
      value: z.number().min(1).max(5).optional(),
      experience: z.number().min(1).max(5).optional(),
    })
    .optional(),

  // Verification
  isVerifiedPurchase: commonValidations.booleanWithDefault(false),

  // Recommendations
  wouldRecommend: z.boolean().optional(),

  // Review images
  images: z
    .array(
      z.object({
        url: commonValidations.imageUrl,
        caption: z.string().max(200).optional(),
      })
    )
    .max(5, 'Maximum 5 images allowed')
    .optional(),
});

export type ReviewCommentFormValues = z.infer<typeof reviewCommentSchema>;

// Feedback comment schema
export const feedbackCommentSchema = baseCommentSchema.extend({
  type: z.literal('feedback').default('feedback'),

  // Feedback-specific
  category: z.enum(['bug', 'feature', 'improvement', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),

  // Contact info (optional for feedback)
  contactEmail: commonValidations.email.optional(),

  // Environment info
  environment: z
    .object({
      browser: z.string().optional(),
      os: z.string().optional(),
      version: z.string().optional(),
    })
    .optional(),
});

export type FeedbackCommentFormValues = z.infer<typeof feedbackCommentSchema>;

// Edit comment schema
export const editCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),

  // Track edits
  editReason: z.string().max(200).optional(),

  // Update attachments
  attachments: z
    .array(
      z.object({
        id: z.string().optional(), // Existing attachment
        type: z.enum(['image', 'video', 'gif', 'sticker']),
        url: commonValidations.url,
        thumbnail: commonValidations.url.optional(),
        alt: z.string().optional(),
        isDeleted: z.boolean().optional(), // Mark for deletion
      })
    )
    .max(4, 'Maximum 4 attachments allowed')
    .optional(),
});

export type EditCommentFormValues = z.infer<typeof editCommentSchema>;

// Moderate comment schema (for admins/moderators)
export const moderateCommentSchema = z.object({
  action: z.enum(['approve', 'hide', 'flag', 'delete']),
  reason: z.string().min(1, 'Reason is required').max(500),

  // Moderation details
  violationType: z
    .enum([
      'spam',
      'harassment',
      'hate_speech',
      'misinformation',
      'inappropriate_content',
      'copyright',
      'other',
    ])
    .optional(),

  // Actions
  warnUser: commonValidations.booleanWithDefault(false),
  banUser: commonValidations.booleanWithDefault(false),
  banDuration: z.number().min(1).max(365).optional(), // Days

  // Notes
  internalNotes: z.string().max(1000).optional(),
});

export type ModerateCommentFormValues = z.infer<typeof moderateCommentSchema>;

// Reaction schema
export const reactionSchema = z.object({
  type: z.enum(['like', 'love', 'laugh', 'wow', 'sad', 'angry']),
  commentId: z.string().min(1),
});

export type ReactionFormValues = z.infer<typeof reactionSchema>;

// Comment thread schema (for nested comments)
export const commentThreadSchema = z.object({
  maxDepth: z.number().min(1).max(5).default(3),
  sortBy: z.enum(['newest', 'oldest', 'popular', 'controversial']).default('newest'),
  showDeleted: commonValidations.booleanWithDefault(false),
  showHidden: commonValidations.booleanWithDefault(false),
  expandReplies: commonValidations.booleanWithDefault(true),
});

export type CommentThreadSettings = z.infer<typeof commentThreadSchema>;

// Bulk action schema
export const bulkCommentActionSchema = z.object({
  commentIds: z.array(z.string()).min(1, 'Select at least one comment'),
  action: z.enum(['delete', 'hide', 'approve', 'flag']),
  reason: z.string().max(500).optional(),
});

export type BulkCommentActionFormValues = z.infer<typeof bulkCommentActionSchema>;

// Helper functions
export const extractMentionsFromComment = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions = content.match(mentionRegex) || [];
  return mentions.map(m => m.substring(1));
};

export const formatCommentTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

export const calculateCommentDepth = (comment: unknown, comments: unknown[]): number => {
  let depth = 0;
  let current = comment;

  while (current.parentId) {
    depth++;
    current = comments.find(c => c.id === current.parentId);
    if (!current || depth > 10) break; // Prevent infinite loops
  }

  return depth;
};

// Default values
export const commentDefaults: Partial<CommentFormValues> = {
  content: '',
  type: 'text',
  attachments: [],
  mentions: [],
  isPrivate: false,
  allowReplies: true,
};

export const reviewDefaults: Partial<ReviewCommentFormValues> = {
  content: '',
  type: 'review',
  rating: 5,
  title: '',
  isVerifiedPurchase: false,
  images: [],
};

export const feedbackDefaults: Partial<FeedbackCommentFormValues> = {
  content: '',
  type: 'feedback',
  category: 'other',
  priority: 'medium',
};
