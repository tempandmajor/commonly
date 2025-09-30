
import * as z from "zod";
import { EventCategory, EventType } from "@/lib/types/event";

export const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters').max(150, 'Short description cannot exceed 150 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.nativeEnum(EventCategory),
  type: z.nativeEnum(EventType),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  startDate: z.date(),
  endDate: z.date().optional(),
  targetAmount: z.union([z.number(), z.string().transform(val => parseInt(val) || 0)]),
  isPrivate: z.boolean().default(false),
  isFree: z.boolean().default(false),
  price: z.union([z.number(), z.string().transform(val => parseFloat(val) || 0)]).optional(),
  capacity: z.union([z.number(), z.string().transform(val => parseInt(val) || 0)]).optional(),
  maxTicketsPerPurchase: z.union([z.number(), z.string().transform(val => parseInt(val) || 0)]).optional(),
  ageRestriction: z.union([z.number(), z.string().transform(val => parseInt(val) || 0)]).optional(),
  bannerImage: z.string().optional(),
  isAllOrNothing: z.boolean().default(false),
  sponsorshipTiers: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, 'Name is required'),
      price: z.union([z.number(), z.string().transform(val => parseFloat(val) || 0)]),
      description: z.string().min(10, 'Description must be at least 10 characters'),
      benefits: z.array(z.string()),
      maxSponsors: z.union([z.number(), z.string().transform(val => parseInt(val) || 0)]).optional(),
      currentSponsors: z.number().optional(),
      sponsors: z.array(z.any()).optional()
    })
  ).optional().default([]),
  campaignDuration: z.string().optional(),
  // Add community fields
  communityId: z.string().optional(),
  communityName: z.string().optional()
});

export type EventFormValues = z.infer<typeof eventFormSchema>;
