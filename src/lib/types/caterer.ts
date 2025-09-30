export interface Caterer {
  id: string;
  name: string;
  description: string;
  contactInfo: {
    email: string;
    phone: string;
    website?: string | undefined;
  };
  location: string;
  cuisineTypes: string[];
  rating?: number;
  priceRange: string;
  services: string[];
  menuOptions: MenuOption[];
  images: string[];
  availableDates?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuOption {
  id: string;
  name: string;
  description: string;
  price: number;
  servingSize: number;
  dietaryOptions: string[];
  image?: string | undefined;
}

// Add the missing enum types
export enum CuisineType {
  Italian = 'Italian',
  Chinese = 'Chinese',
  Japanese = 'Japanese',
  Mexican = 'Mexican',
  Indian = 'Indian',
  French = 'French',
  Mediterranean = 'Mediterranean',
  American = 'American',
  Thai = 'Thai',
  MiddleEastern = 'Middle Eastern',
  Greek = 'Greek',
  Spanish = 'Spanish',
  Korean = 'Korean',
  Vietnamese = 'Vietnamese',
  Caribbean = 'Caribbean',
  African = 'African',
  Fusion = 'Fusion',
}

export enum DietType {
  Vegetarian = 'Vegetarian',
  Vegan = 'Vegan',
  GlutenFree = 'Gluten-Free',
  DairyFree = 'Dairy-Free',
  NutFree = 'Nut-Free',
  Kosher = 'Kosher',
  Halal = 'Halal',
  Pescatarian = 'Pescatarian',
  Keto = 'Keto',
  Paleo = 'Paleo',
  LowCarb = 'Low-Carb',
  LowSodium = 'Low-Sodium',
  Organic = 'Organic',
  SugarFree = 'Sugar-Free',
}

export enum PriceRange {
  Budget = '$',
  Moderate = '$$',
  Premium = '$$$',
  Luxury = '$$$$',
}

// Add missing constants that are used in CatererFilterSidebar
export const CUISINE_TYPES = Object.values(CuisineType);
export const DIET_TYPES = Object.values(DietType);
export const PRICE_RANGES = Object.values(PriceRange);
