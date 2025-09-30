export interface Store {
  id: string;
  userId: string;
  name: string;
  description?: string | undefined;
  createdAt: string;
  stripeConnectAccountId?: string | undefined;
  isActive: boolean;
}

export interface CreateStoreInput {
  name: string;
  description?: string | undefined;
}
