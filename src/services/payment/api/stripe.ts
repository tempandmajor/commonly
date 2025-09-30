/**
 * Stripe API Service for Payment Operations
 */

export interface StripeSubscription {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due';
  current_period_start: number;
  current_period_end: number;
  customer: string;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        currency: string;
      };
    }>;
  };
  metadata?: Record<string, any>;
}

export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'month' | undefined| 'year';
    interval_count: number;
  };
}

export interface StripeProduct {
  id: string;
  name: string;
  description?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export class StripeAPI {
  static async createSubscription(options: {
    customer: string;
    items: Array<{ price: string; quantity?: number }>;
    metadata?: Record<string, any>;
  }): Promise<StripeSubscription> {
    console.log('Creating subscription:', options);

    return {
      id: 'sub_mock_' + Date.now(),
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      customer: options.customer,
      items: {
        data: options.items.map(item => ({
          id: 'si_mock_' + Date.now(),
          price: {
            id: item.price,
            unit_amount: 1000, // $10.00
            currency: 'usd',
          },
        })),
      },
      metadata: options.metadata,
    };
  }

  static async retrieveSubscription(subscriptionId: string): Promise<StripeSubscription> {
    console.log('Retrieving subscription:', subscriptionId);

    return {
      id: subscriptionId,
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      customer: 'cus_mock',
      items: {
        data: [
          {
            id: 'si_mock',
            price: {
              id: 'price_mock',
              unit_amount: 1000,
              currency: 'usd',
            },
          },
        ],
      },
    };
  }

  static async updateSubscription(
    subscriptionId: string,
    updates: Partial<StripeSubscription>
  ): Promise<StripeSubscription> {
    console.log('Updating subscription:', subscriptionId, updates);

    const existing = await this.retrieveSubscription(subscriptionId);
    return { ...existing, ...updates };
  }

  static async cancelSubscription(subscriptionId: string): Promise<StripeSubscription> {
    console.log('Canceling subscription:', subscriptionId);

    const existing = await this.retrieveSubscription(subscriptionId);
    return { ...existing, status: 'canceled' };
  }

  static async listPrices(): Promise<StripePrice[]> {
    console.log('Listing prices');

    return [
      {
        id: 'price_mock_monthly',
        unit_amount: 1000,
        currency: 'usd',
        recurring: {
          interval: 'month',
          interval_count: 1,
        },
      },
      {
        id: 'price_mock_yearly',
        unit_amount: 10000,
        currency: 'usd',
        recurring: {
          interval: 'year',
          interval_count: 1,
        },
      },
    ];
  }

  static async listProducts(): Promise<StripeProduct[]> {
    console.log('Listing products');

    return [
      {
        id: 'prod_mock',
        name: 'Premium Subscription',
        description: 'Access to premium features',
      },
    ];
  }
}

// Additional convenience functions
export const createCheckoutSession = (options: any) => {
  console.log('Creating checkout session via API:', options);
  return {
    id: 'cs_api_mock_' + Date.now(),
    url: 'https://checkout.stripe.com/mock',
    status: 'open',
  };
};

export default StripeAPI;
