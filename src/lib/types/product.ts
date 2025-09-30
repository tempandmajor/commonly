export interface Product {
  id: string;
  name: string;
  title?: string | undefined; // Added for compatibility
  description: string;
  detailedDescription?: string | undefined;
  price: number;
  compareAtPrice?: number | undefined;
  images: string[];
  category: string;
  tags: string[];
  createdAt: string;
  inStock: boolean;
  stockQuantity: number;
  variations?: ProductVariation[] | undefined;
  shipping?: ShippingInfo | undefined;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string | undefined; // Added property
  weight?: number | undefined;
  dimensions?: ProductDimensions | undefined;
  deliveryTime?: string | undefined;
  printProvider?: string | undefined;
  features?: string[] | undefined; // Added property
}

export interface ProductVariation {
  id: string;
  name: string;
  options: string[];
  price?: number | undefined;
}

export interface ShippingInfo {
  weight: number;
  dimensions: ProductDimensions;
  shippingClass?: string | undefined;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}
