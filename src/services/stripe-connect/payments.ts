import { ConnectedPaymentOptions, PaymentResult } from '../payment/types';
import { initiateConnectedCheckout } from '../payment/connectedCheckout';

export const createConnectedPayment = async (
  options: ConnectedPaymentOptions
): Promise<PaymentResult> => {
  return initiateConnectedCheckout(options);
};
