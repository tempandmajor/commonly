import { addCardPaymentMethod, removePaymentMethod } from '../../services/wallet/paymentMethods';

export const addCardToStripe = async (cardToken: string, userId: string): Promise<boolean> => {
  try {
    const result = await addCardPaymentMethod(cardToken);
    return result !== null;
  } catch (error) {
    return false;
  }
};

export const removeCardFromStripe = async (cardId: string, userId: string): Promise<boolean> => {
  try {
    const result = await removePaymentMethod(userId, cardId);
    return result;
  } catch (error) {
    return false;
  }
};
