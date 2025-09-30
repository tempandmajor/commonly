import * as z from 'zod';
import { commonValidations } from './shared';

// Report reason types for different content
export const eventReportReasons = [
  'inappropriate_content',
  'misleading_information',
  'scam',
  'duplicate',
  'harmful',
  'cancelled_event',
  'fake_event',
  'spam',
  'copyright',
  'other',
] as const;

export const userReportReasons = [
  'harassment',
  'spam',
  'fake_profile',
  'inappropriate_content',
  'impersonation',
  'underage',
  'self_harm',
  'violence',
  'hate_speech',
  'other',
] as const;

export const contentReportReasons = [
  'spam',
  'harassment',
  'hate_speech',
  'violence',
  'misinformation',
  'inappropriate_content',
  'copyright',
  'self_harm',
  'illegal_activity',
  'other',
] as const;

export const productReportReasons = [
  'counterfeit',
  'misleading',
  'prohibited_item',
  'scam',
  'inappropriate',
  'copyright',
  'quality_issue',
  'not_as_described',
  'other',
] as const;

// Base report schema
const baseReportSchema = z.object({
  details: z
    .string()
    .min(10, 'Please provide at least 10 characters of detail')
    .max(1000, 'Details must be less than 1000 characters'),
  attachments: z
    .array(commonValidations.imageUrl)
    .max(5, 'Maximum 5 attachments allowed')
    .optional(),
  reporterEmail: commonValidations.email.optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

// Event report schema
export const eventReportSchema = baseReportSchema.extend({
  eventId: z.string().min(1, 'Event ID is required'),
  eventTitle: z.string().optional(),
  reason: z.enum(eventReportReasons, {
    required_error: 'Please select a reason for reporting',
  }),
  affectedUsers: z.number().min(0).optional(),
  evidenceUrls: z.array(commonValidations.url).optional(),
});

export type EventReportFormValues = z.infer<typeof eventReportSchema>;

// User report schema
export const userReportSchema = baseReportSchema.extend({
  reportedUserId: z.string().min(1, 'User ID is required'),
  reportedUsername: z.string().optional(),
  reason: z.enum(userReportReasons, {
    required_error: 'Please select a reason for reporting',
  }),
  incidentDate: z.date().optional(),
  witnesses: z.array(z.string()).optional(),
  previousReports: z.boolean().default(false),
});

export type UserReportFormValues = z.infer<typeof userReportSchema>;

// Content report schema (posts, comments, etc)
export const contentReportSchema = baseReportSchema.extend({
  contentId: z.string().min(1, 'Content ID is required'),
  contentType: z.enum(['post', 'comment', 'message', 'review']),
  contentUrl: commonValidations.url.optional(),
  reason: z.enum(contentReportReasons, {
    required_error: 'Please select a reason for reporting',
  }),
  contentText: z.string().max(500).optional(),
});

export type ContentReportFormValues = z.infer<typeof contentReportSchema>;

// Product report schema
export const productReportSchema = baseReportSchema.extend({
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().optional(),
  sellerId: z.string().optional(),
  reason: z.enum(productReportReasons, {
    required_error: 'Please select a reason for reporting',
  }),
  purchaseDate: z.date().optional(),
  orderNumber: z.string().optional(),
});

export type ProductReportFormValues = z.infer<typeof productReportSchema>;

// Appeal schema for rejected reports
export const reportAppealSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
  appealReason: z
    .string()
    .min(20, 'Please provide at least 20 characters explaining your appeal')
    .max(2000, 'Appeal must be less than 2000 characters'),
  additionalEvidence: z.array(commonValidations.url).optional(),
  contactMethod: z.enum(['email', 'phone', 'in_app']).default('email'),
});

export type ReportAppealFormValues = z.infer<typeof reportAppealSchema>;

// Helper functions for report forms
export const getReportReasonLabel = (reason: string): string => {
  const labels: Record<string, string> = {
    inappropriate_content: 'Inappropriate Content',
    misleading_information: 'Misleading Information',
    scam: 'Potential Scam',
    duplicate: 'Duplicate Event',
    harmful: 'Harmful or Dangerous',
    cancelled_event: 'Cancelled Event',
    fake_event: 'Fake Event',
    spam: 'Spam',
    copyright: 'Copyright Violation',
    harassment: 'Harassment or Bullying',
    fake_profile: 'Fake Profile',
    impersonation: 'Impersonation',
    underage: 'Underage User',
    self_harm: 'Self Harm',
    violence: 'Violence or Threats',
    hate_speech: 'Hate Speech',
    misinformation: 'Misinformation',
    illegal_activity: 'Illegal Activity',
    counterfeit: 'Counterfeit Product',
    misleading: 'Misleading Description',
    prohibited_item: 'Prohibited Item',
    quality_issue: 'Quality Issue',
    not_as_described: 'Not as Described',
    other: 'Other',
  };

  return labels[reason] || reason;
};

// Default values
export const eventReportDefaults: Partial<EventReportFormValues> = {
  details: '',
  attachments: [],
  priority: 'medium',
};

export const userReportDefaults: Partial<UserReportFormValues> = {
  details: '',
  attachments: [],
  priority: 'medium',
  previousReports: false,
};

export const contentReportDefaults: Partial<ContentReportFormValues> = {
  details: '',
  attachments: [],
  priority: 'medium',
};

export const productReportDefaults: Partial<ProductReportFormValues> = {
  details: '',
  attachments: [],
  priority: 'medium',
};
