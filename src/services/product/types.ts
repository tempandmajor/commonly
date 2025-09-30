
export interface ProductQueryOptions {
  limit?: number | undefined;
  lastProductId?: string | undefined;
  category?: string | undefined| null;
  inStock?: boolean | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  sellerId?: string | undefined;
  searchQuery?: string | undefined;
  sortBy?: string | undefined; // Adding the missing sortBy option
}

export interface PurchaseOptions {
  productId: string;
  quantity: number;
  userId?: string | undefined;
  customerEmail?: string | undefined;
}
