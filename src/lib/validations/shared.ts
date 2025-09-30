import * as z from 'zod';

// Common validation messages
export const validationMessages = {
  required: (field: string) => `${field} is required`,
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) => `${field} cannot exceed ${max} characters`,
  email: 'Please enter a valid email address',
  url: 'Please enter a valid URL',
  number: 'Please enter a valid number',
  positive: 'Value must be greater than 0',
  integer: 'Value must be a whole number',
  future: 'Date must be in the future',
  past: 'Date must be in the past',
  phone: 'Please enter a valid phone number',
  password: {
    min: 'Password must be at least 8 characters',
    uppercase: 'Password must contain at least one uppercase letter',
    lowercase: 'Password must contain at least one lowercase letter',
    number: 'Password must contain at least one number',
    special: 'Password must contain at least one special character',
  },
};

// Common validation rules
export const commonValidations = {
  // Required string with min/max length
  requiredString: (field: string, min = 1, max = 255) =>
    z
      .string()
      .min(min, validationMessages.minLength(field, min))
      .max(max, validationMessages.maxLength(field, max)),

  // Optional string with max length
  optionalString: (max = 255) =>
    z.string().max(max, validationMessages.maxLength('Field', max)).optional().or(z.literal('')),

  // Email validation
  email: z.string().email(validationMessages.email).toLowerCase().trim(),

  // URL validation
  url: z.string().url(validationMessages.url).or(z.literal('')),

  // Phone number validation
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, validationMessages.phone)
    .optional(),

  // Positive number
  positiveNumber: z.number().positive(validationMessages.positive),

  // Positive integer
  positiveInteger: z.number().int(validationMessages.integer).positive(validationMessages.positive),

  // Price validation (allows 0 for free items)
  price: z
    .number()
    .nonnegative('Price cannot be negative')
    .multipleOf(0.01, 'Price must have at most 2 decimal places'),

  // Password validation
  password: z
    .string()
    .min(8, validationMessages.password.min)
    .regex(/[A-Z]/, validationMessages.password.uppercase)
    .regex(/[a-z]/, validationMessages.password.lowercase)
    .regex(/[0-9]/, validationMessages.password.number)
    .regex(/[^A-Za-z0-9]/, validationMessages.password.special),

  // Simple password (for less secure contexts)
  simplePassword: z.string().min(6, 'Password must be at least 6 characters'),

  // Future date
  futureDate: z.date().refine(date => date > new Date(), {
    message: validationMessages.future,
  }),

  // Past date
  pastDate: z.date().refine(date => date < new Date(), {
    message: validationMessages.past,
  }),

  // Image URL
  imageUrl: z
    .string()
    .url('Please provide a valid image URL')
    .regex(/\.(jpg|jpeg|png|webp|gif|svg)$/i, 'URL must point to an image file')
    .or(z.literal('')),

  // Boolean with default
  booleanWithDefault: (defaultValue = false) => z.boolean().default(defaultValue),
};

// Complex validation schemas
export const addressSchema = z.object({
  street: commonValidations.requiredString('Street address'),
  city: commonValidations.requiredString('City'),
  state: commonValidations.requiredString('State/Province'),
  postalCode: commonValidations.requiredString('Postal code'),
  country: commonValidations.requiredString('Country'),
});

export const socialLinksSchema = z.object({
  website: commonValidations.url.optional(),
  twitter: commonValidations.url.optional(),
  instagram: commonValidations.url.optional(),
  facebook: commonValidations.url.optional(),
  linkedin: commonValidations.url.optional(),
  youtube: commonValidations.url.optional(),
  tiktok: commonValidations.url.optional(),
});

// Helper function to create enum validation
export const createEnumValidation = <T extends string>(
  enumObject: Record<string, T>,
  field: string
) => {
  const values = Object.values(enumObject) as [T, ...T[]];
  return z.enum(values, {
    required_error: validationMessages.required(field),
    invalid_type_error: `Please select a valid ${field.toLowerCase()}`,
  });
};

// Custom validation for file uploads
export const fileValidation = (maxSizeMB: number, allowedTypes: string[]) => {
  return z.custom<File>(
    file => {
      if (!(file instanceof File)) return false;
      if (file.size > maxSizeMB * 1024 * 1024) return false;
      return allowedTypes.some(type => file.type.startsWith(type));
    },
    {
      message: `File must be less than ${maxSizeMB}MB and one of: ${allowedTypes.join(', ')}`,
    }
  );
};
