import { create } from 'zustand';

interface CheckoutData {
  amount: number;
  type: 'ticket' | 'subscription' | 'product';
  requiresStripeConnect?: boolean | undefined;
  eventId?: string | undefined;
  productId?: string | undefined;
  description?: string | undefined;
}

interface CheckoutModalStore {
  isOpen: boolean;
  checkoutData: CheckoutData | null;
  openModal: (data: CheckoutData) => void;
  closeModal: () => void;
}

export const useCheckoutModal = create<CheckoutModalStore>(set => ({
  isOpen: false,
  checkoutData: null,
  openModal: data => set({ isOpen: true, checkoutData: data }),
  closeModal: () => set({ isOpen: false, checkoutData: null }),
}));
