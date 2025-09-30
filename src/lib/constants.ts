export const COLLECTIONS = {
  EVENTS: 'events',
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  PAYMENTS_TEST: 'PaymentsTest',
  NOTIFICATIONS: 'notifications',
  CONTENT: 'ContentTest',
  CATERERS: 'ContentTest',
  VENUES: 'venues',
  STORES: 'stores',
  TRANSACTIONS: 'transactions',
  CONVERSATIONS: 'conversations',
  LOCATIONS: 'locations',
  USER_LOCATIONS: 'user_locations',
  WALLETS: 'wallets',
  REFERRAL_CODES: 'referral_codes',
  CREDIT_TRANSACTIONS: 'credit_transactions',
  USER_SETTINGS: 'user_settings',
};

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const EVENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  UPCOMING: 'upcoming',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
