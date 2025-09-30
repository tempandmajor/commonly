import { z } from 'zod';

export interface CreatePromotionFormProps {
  initialTarget?: string | undefined;
  initialTargetId?: string | undefined;
  initialTitle?: string | undefined;
}

export interface PromotionSummaryProps {
  estimatedReach: number;
  estimatedCost: number;
  budget: number;
}

export const promotionFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  budget: z.number().min(10, 'Budget must be at least $10'),
  dailyBudgetLimit: z.number().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).nullable().optional(),
  targetType: z.enum(['event', 'venue', 'artist', 'post', 'caterer'] as const),
  targetId: z.string(),
  audience: z.array(z.string()),
  deliveryMethod: z.enum(['feed', 'ai-message', 'combined'] as const),
  aiDeliveryTone: z.enum(['casual', 'professional', 'friendly'] as const).optional(),
  ageRangeMin: z.number().min(13).optional(),
  ageRangeMax: z.number().max(100).optional(),
  locationRadius: z.number().optional(),
  locationTargeting: z.array(z.string()).optional(),
  interestTags: z.array(z.string()).optional(),
  bidAmount: z.number().min(0.01).optional(),
});

export type PromotionFormValues = z.infer<typeof promotionFormSchema>;

export interface TargetAudienceProps {
  form: unknown;
  isLoading: boolean;
  selectedLocations: string[];
  setSelectedLocations: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface FormFieldWrapperProps {
  name: string;
  label: string;
  description?: string | undefined;
  form: unknown;
  children: React.ReactNode;
}
