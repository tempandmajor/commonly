import * as z from 'zod';
import { commonValidations } from './shared';

export enum ProductCategory {
  Electronics = 'electronics',
  Clothing = 'clothing',
  Books = 'books',
  Art = 'art',
  Music = 'music',
  Food = 'food',
  Sports = 'sports',
  Toys = 'toys',
  Home = 'home',
  Other = 'other',
}

export enum ProductStatus {
  Draft = 'draft',
  Active = 'active',
  OutOfStock = 'out_of_stock',
  Discontinued = 'discontinued',
}

export enum ShippingType {
  Physical = 'physical',
  Digital = 'digital',
  Service = 'service',
}

// Product variant schema
export const productVariantSchema = z.object({
  id: z.string(),
  name: commonValidations.requiredString('Variant name', 1, 50) as string,
  options: z
    .array(
      z.object({
        id: z.string(),
        value: commonValidations.requiredString('Option value', 1, 30) as string,
        priceAdjustment: z.number().default(0),
        stockQuantity: z.number().int().nonnegative().optional(),
        sku: z.string().optional(),
      })
    )
    .min(1, 'Add at least one option'),
});

export const productFormSchema = z
  .object({
    // Basic Information
    name: commonValidations.requiredString('Product name', 3, 100) as string,
    description: commonValidations.requiredString('Description', 20, 2000) as string,
    shortDescription: commonValidations.requiredString('Short description', 10, 200) as string,

    // Categorization
    category: z.nativeEnum(ProductCategory, {
      required_error: 'Please select a category',
    }),
    tags: z
      .array(z.string().min(1).max(30))
      .min(1, 'Add at least one tag')
      .max(10, 'Maximum 10 tags allowed'),

    // Pricing
    price: commonValidations.price,
    compareAtPrice: commonValidations.price.optional(),
    costPerItem: commonValidations.price.optional(),

    // Inventory
    sku: z
      .string()
      .regex(/^[A-Z0-9-_]+$/i, 'SKU can only contain letters, numbers, hyphens, and underscores')
      .optional(),
    trackQuantity: commonValidations.booleanWithDefault(true),
    stockQuantity: z
      .number()
      .int('Stock must be a whole number')
      .nonnegative('Stock cannot be negative')
      .optional(),
    allowBackorders: commonValidations.booleanWithDefault(false),

    // Shipping
    shippingType: z.nativeEnum(ShippingType, {
      required_error: 'Please select shipping type',
    }),
    weight: z.number().positive('Weight must be greater than 0').optional(),
    dimensions: z
      .object({
        length: z.number().positive().optional(),
        width: z.number().positive().optional(),
        height: z.number().positive().optional(),
      })
      .optional(),

    // Media
    images: z
      .array(
        z.object({
          id: z.string(),
          url: commonValidations.imageUrl,
          alt: z.string().optional(),
          isPrimary: z.boolean().default(false),
        })
      )
      .min(1, 'Add at least one product image')
      .max(10, 'Maximum 10 images allowed'),

    // Variants
    hasVariants: commonValidations.booleanWithDefault(false),
    variants: z.array(productVariantSchema).optional(),

    // SEO
    seoTitle: commonValidations.optionalString(70) as string,
    seoDescription: commonValidations.optionalString(160) as string,
    seoKeywords: z.array(z.string()).max(10).optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
      .optional(),

    // Status
    status: z.nativeEnum(ProductStatus).default(ProductStatus.Draft),
    publishDate: z.date().optional(),

    // Additional Settings
    isFeatured: commonValidations.booleanWithDefault(false),
    allowReviews: commonValidations.booleanWithDefault(true),
    requiresShipping: commonValidations.booleanWithDefault(true),
    taxable: commonValidations.booleanWithDefault(true),
  })
  .refine(
    data => {
      // Compare price validation
      if (data.compareAtPrice && data.compareAtPrice <= data.price) {
        return false;
      }
      return true;
    },
    {
      message: 'Compare price must be greater than regular price',
      path: ['compareAtPrice'],
    }
  )
  .refine(
    data => {
      // Weight required for physical products
      if (data.shippingType === ShippingType.Physical && !data.weight) {
        return false;
      }
      return true;
    },
    {
      message: 'Weight is required for physical products',
      path: ['weight'],
    }
  );

export type ProductFormValues = z.infer<typeof productFormSchema>;

// Default values for the form
export const productFormDefaults: Partial<ProductFormValues> = {
  category: ProductCategory.Other,
  status: ProductStatus.Draft,
  shippingType: ShippingType.Physical,
  trackQuantity: true,
  allowBackorders: false,
  hasVariants: false,
  images: [],
  tags: [],
  isFeatured: false,
  allowReviews: true,
  requiresShipping: true,
  taxable: true,
};

// Common product categories
export const PRODUCT_CATEGORIES = [
  { value: 'General', label: 'General' },
  { value: 'Apparel', label: 'Apparel' },
  { value: 'Digital Products', label: 'Digital Products' },
  { value: 'Accessories', label: 'Accessories' },
  { value: 'Home Goods', label: 'Home Goods' },
  { value: 'Art & Prints', label: 'Art & Prints' },
  { value: 'Books & Media', label: 'Books & Media' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Food & Beverage', label: 'Food & Beverage' },
  { value: 'Health & Beauty', label: 'Health & Beauty' },
  { value: 'Sports & Outdoors', label: 'Sports & Outdoors' },
  { value: 'Toys & Games', label: 'Toys & Games' },
] as const;

// Product status options
export const PRODUCT_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'sold_out', label: 'Sold Out' },
  { value: 'discontinued', label: 'Discontinued' },
] as const;
