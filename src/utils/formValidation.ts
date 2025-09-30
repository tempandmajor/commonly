import { toast } from 'sonner';
import { ZodError, ZodSchema } from 'zod';

/**
 * Validates form data against a Zod schema
 * @param schema Zod schema to validate against
 * @param data Form data to validate
 * @returns Object containing validation result and any validation errors
 */
export function validateForm<T>(
  schema: ZodSchema,
  data: unknown
): {
  success: boolean;
  data: T | null;
  errors: Record<string, string> | null;
} {
  try {
    const validData = schema.parse(data);
    return {
      success: true,
      data: validData as T,
      errors: null,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      // Convert Zod validation errors to a more usable format
      const formattedErrors = error.errors.reduce(
        (acc, curr) => {
          const path = curr.path.join('.');
          acc[path] = curr.message;
          return acc;
        },
        {} as Record<string, string>
      );

      return {
        success: false,
        data: null,
        errors: formattedErrors,
      };
    }

    // For non-Zod errors
    toast.error('An unexpected error occurred during form validation');

    return {
      success: false,
      data: null,
      errors: { _form: 'An unexpected error occurred' },
    };
  }
}

/**
 * Creates a toast notification for each validation error
 * @param errors Record of validation errors
 */
export function showValidationErrors(errors: Record<string, string> | null): void {
  if (!errors) return;

  // Show only the first 3 errors to avoid overwhelming the user
  const errorMessages = Object.values(errors).slice(0, 3);

  errorMessages.forEach(message => {
    toast.error(message);
  });

  // If there are more errors, show a summary
  const total = (Object.keys(errors) as (keyof typeof errors)[]).length;
  if (total > 3) {
    toast.error(`And ${total - 3} more validation errors`);
  }
}

