export interface Seller {
  id: string;
  name: string;
  avatar: string; // Changed from optional to required to match component expectations
  products: number;
  bio?: string | undefined;
  rating?: number | undefined;
  featured?: boolean | undefined;
}
