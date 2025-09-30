/**
 * Stripe Client Service
 */

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string | undefined;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  metadata?: Record<string, any>;
}

export interface SetupIntent {
  id: string;
  client_secret: string;
  status: string;
  payment_method?: string | undefined;
}

export interface Customer {
  id: string;
  email?: string | undefined;
  name?: string | undefined;
  default_payment_method?: string | undefined;
}

export class StripeClient {
  static async createSetupIntent(customerId?: string): Promise<SetupIntent> {
    console.log('Creating setup intent for customer:', customerId);

    return {
      id: 'seti_mock_' + Date.now(),
      client_secret: 'seti_mock_secret',
      status: 'requires_payment_method',
    };
  }

  static async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    console.log('Listing payment methods for customer:', customerId);

    // Mock payment methods
    return [
      {
        id: 'pm_mock_1',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
      },
    ];
  }

  static async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<PaymentMethod> {
    console.log('Attaching payment method:', paymentMethodId, 'to customer:', customerId);

    return {
      id: paymentMethodId,
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
      },
    };
  }

  static async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    console.log('Detaching payment method:', paymentMethodId);
  }

  static async createCustomer(options: {
    email?: string;
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<Customer> {
    console.log('Creating customer:', options);

    return {
      id: 'cus_mock_' + Date.now(),
      email: options.email,
      name: options.name,
    };
  }

  static async retrieveCustomer(customerId: string): Promise<Customer> {
    console.log('Retrieving customer:', customerId);

    return {
      id: customerId,
      email: 'user@example.com',
    };
  }

  static async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer> {
    console.log('Updating customer:', customerId, updates);

    return {
      id: customerId,
          ...updates,
    };
  }
}

export default StripeClient;
