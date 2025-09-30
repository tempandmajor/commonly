import { z } from 'zod';

// Ticket priority levels
export const ticketPriority = ['low', 'medium', 'high', 'urgent'] as const;
export const ticketStatus = [
  'open',
  'in-progress',
  'waiting-on-customer',
  'resolved',
  'closed',
] as const;
export const ticketCategory = [
  'account-issue',
  'billing',
  'technical-problem',
  'feature-request',
  'general-inquiry',
  'bug-report',
  'security',
  'other',
] as const;

// Help ticket schema
export const helpTicketSchema = z.object({
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),

  category: z.enum(ticketCategory),

  priority: z.enum(ticketPriority).default('medium'),

  description: z
    .string()
    .min(20, 'Please provide more detail (at least 20 characters)')
    .max(5000, 'Description must be less than 5000 characters'),

  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        url: z.string(),
      })
    )
    .max(10, 'Maximum 10 attachments allowed')
    .optional(),

  // Contact preferences
  contactMethod: z.enum(['email', 'phone', 'chat', 'any']).default('email'),
  preferredContactTime: z.string().optional(),

  // System information
  systemInfo: z
    .object({
      browser: z.string().optional(),
      os: z.string().optional(),
      screenResolution: z.string().optional(),
      appVersion: z.string().optional(),
    })
    .optional(),

  // Related items
  relatedOrderId: z.string().optional(),
  relatedEventId: z.string().optional(),
  relatedUserId: z.string().optional(),

  // Auto-filled fields
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  sessionId: z.string().optional(),
});

// Knowledge base article schema
export const kbArticleSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),

  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must be less than 100 characters'),

  category: z.string().min(1, 'Category is required'),

  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),

  content: z
    .string()
    .min(100, 'Content must be at least 100 characters')
    .max(50000, 'Content must be less than 50000 characters'),

  excerpt: z.string().max(300, 'Excerpt must be less than 300 characters').optional(),

  status: z.enum(['draft', 'published', 'archived']).default('draft'),

  visibility: z.enum(['public', 'users-only', 'staff-only']).default('public'),

  featured: z.boolean().default(false),

  helpfulness: z
    .object({
      helpful: z.number().default(0),
      notHelpful: z.number().default(0),
    })
    .optional(),

  relatedArticles: z.array(z.string()).max(5, 'Maximum 5 related articles'),

  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        type: z.string(),
      })
    )
    .optional(),

  seo: z
    .object({
      metaTitle: z.string().max(60, 'Meta title must be less than 60 characters').optional(),
      metaDescription: z
        .string()
        .max(160, 'Meta description must be less than 160 characters')
        .optional(),
      keywords: z.array(z.string()).max(10, 'Maximum 10 keywords').optional(),
    })
    .optional(),
});

// FAQ item schema
export const faqItemSchema = z.object({
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters')
    .max(300, 'Question must be less than 300 characters'),

  answer: z
    .string()
    .min(20, 'Answer must be at least 20 characters')
    .max(2000, 'Answer must be less than 2000 characters'),

  category: z.string().min(1, 'Category is required'),

  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed'),

  order: z.number().min(0).default(0),

  featured: z.boolean().default(false),

  status: z.enum(['active', 'inactive']).default('active'),

  helpfulness: z
    .object({
      helpful: z.number().default(0),
      notHelpful: z.number().default(0),
    })
    .optional(),

  relatedFaqs: z.array(z.string()).max(3, 'Maximum 3 related FAQs'),

  relatedArticles: z.array(z.string()).max(3, 'Maximum 3 related articles'),
});

// Live chat initialization schema
export const liveChatSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),

  email: z.string().email('Please enter a valid email'),

  department: z.enum(['sales', 'support', 'billing', 'general']).default('support'),

  initialMessage: z
    .string()
    .min(1, 'Please enter a message')
    .max(500, 'Initial message must be less than 500 characters'),

  priority: z.enum(['normal', 'high']).default('normal'),

  userData: z
    .object({
      userId: z.string().optional(),
      accountType: z.string().optional(),
      orderHistory: z.boolean().optional(),
    })
    .optional(),
});

// Support search schema
export const supportSearchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(200, 'Search query must be less than 200 characters'),

  searchIn: z
    .array(z.enum(['articles', 'faqs', 'tickets', 'community']))
    .default(['articles', 'faqs']),

  category: z.string().optional(),

  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),

  sortBy: z.enum(['relevance', 'date', 'popularity', 'helpfulness']).default('relevance'),

  filters: z
    .object({
      onlyResolved: z.boolean().default(false),
      onlyFeatured: z.boolean().default(false),
      hasAttachments: z.boolean().default(false),
    })
    .optional(),
});

// Ticket update schema
export const ticketUpdateSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be less than 5000 characters'),

  status: z.enum(ticketStatus).optional(),

  priority: z.enum(ticketPriority).optional(),

  assignedTo: z.string().optional(),

  attachments: z
    .array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
        url: z.string(),
      })
    )
    .max(5, 'Maximum 5 attachments per update')
    .optional(),

  internalNote: z.boolean().default(false),

  resolution: z.string().max(1000).optional(),

  tags: z.array(z.string()).max(10).optional(),
});

// Default values
export const helpTicketDefaults = {
  priority: 'medium' as const,
  contactMethod: 'email' as const,
  attachments: [],
};

export const kbArticleDefaults = {
  status: 'draft' as const,
  visibility: 'public' as const,
  featured: false,
  tags: [],
  relatedArticles: [],
};

export const faqItemDefaults = {
  status: 'active' as const,
  featured: false,
  order: 0,
  tags: [],
  relatedFaqs: [],
  relatedArticles: [],
};

export const liveChatDefaults = {
  department: 'support' as const,
  priority: 'normal' as const,
};

export const supportSearchDefaults = {
  searchIn: ['articles', 'faqs'] as ('articles' | 'faqs' | 'tickets' | 'community')[],
  sortBy: 'relevance' as const,
};

// Type exports
export type HelpTicketFormValues = z.infer<typeof helpTicketSchema>;
export type KbArticleFormValues = z.infer<typeof kbArticleSchema>;
export type FaqItemFormValues = z.infer<typeof faqItemSchema>;
export type LiveChatFormValues = z.infer<typeof liveChatSchema>;
export type SupportSearchFormValues = z.infer<typeof supportSearchSchema>;
export type TicketUpdateFormValues = z.infer<typeof ticketUpdateSchema>;

// Helper functions
export const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    'account-issue': '👤',
    billing: '💳',
    'technical-problem': '🔧',
    'feature-request': '✨',
    'general-inquiry': '💬',
    'bug-report': '🐛',
    security: '🔒',
    other: '📋',
  };
  return icons[category] || '📋';
};

export const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    low: 'text-gray-600 bg-gray-100',
    medium: 'text-gray-700 bg-gray-200',
    high: 'text-gray-800 bg-gray-300',
    urgent: 'text-black bg-gray-400',
  };
  return colors[priority] || 'text-gray-600 bg-gray-100';
};

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    open: 'text-gray-600 bg-gray-100',
    'in-progress': 'text-gray-700 bg-gray-200',
    'waiting-on-customer': 'text-gray-800 bg-gray-300',
    resolved: 'text-black bg-gray-400',
    closed: 'text-gray-600 bg-gray-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
};
