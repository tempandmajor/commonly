import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BffClient } from '@commonly/api-client';

const BFF_URL = process.env.NEXT_PUBLIC_BFF_U as string | undefined;

function generateIdempotencyKey(prefix = 'setup_intent'): string {

  const rand = Math.random().toString(36).slice(2);
  const time = Date.now().toString(36) as string;
  return `${prefix}_${time}_${rand}`;
}

async function callBff(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: unknown,
  extraHeaders?: Record<string, string>
) {
  if (!BFF_URL) throw new Error('BFF not configured');
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Authentication required');
  const resp = await fetch(`${BFF_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
          ...(extraHeaders || {}),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.error || `BFF error ${resp.status}`);
  return json;

}

// Base function to call Supabase Edge Functions with improved auth handling
const callEdgeFunction = async (
  functionName: string,
  data?: unknown,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    extraHeaders?: Record<string, string>;
  }
) => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error: ' + sessionError.message);
    }
    if (!session?.access_token) {
      console.error('No access token found in session');
      throw new Error('You must be logged in to perform this action');
    }

    const { data: result, error } = await supabase.functions.invoke(functionName, {
      body: data as Record<string, unknown> | undefined,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
          ...(options?.extraHeaders || {}),
      },
      ...(options && { method: options.method }),
    });

    if (error) {
      console.error(`Edge function ${functionName} error:`, error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        toast.error('Authentication failed. Please try logging out and back in.');
        throw new Error('Authentication failed. Please refresh your session.');
      }
      if (error.message?.includes('FunctionsHttpError')) {
        const errorMessage = `${functionName} function error: ${error.message}`;
        console.error(errorMessage);
        toast.error(`Service temporarily unavailable. Please try again later.`);
        throw new Error(errorMessage);
      }
      throw error;
    }

    return result;

  } catch (error) {
    console.error(`Error calling edge function ${functionName}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error) as string;
    if (
      !errorMessage?.includes('Authentication failed') &&
      !errorMessage?.includes('Service temporarily unavailable')
    ) {
      toast.error(`Failed to execute ${functionName}. Please try again.`);
    }
    throw error;
  }

};

// Payment Methods
export const getPaymentMethods = async () => {
  if (BFF_URL) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token as string;
    const client = new BffClient(BFF_URL);
    const res = await client.listPaymentMethods(token);
    return res;
  }
  return callEdgeFunction('payment-methods', null, { method: 'GET' });
};

export const createSetupIntent = async () => {
  const key = generateIdempotencyKey();
  if (BFF_URL) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token as string;
    const client = new BffClient(BFF_URL);
    const res = await client.createSetupIntent(token, key);
    return res;
  }
  return callEdgeFunction('payment-methods', null, {
    method: 'POST',
    extraHeaders: { 'idempotency-key': key },
  });
};

export const deletePaymentMethod = async (paymentMethodId: string) => {
  if (BFF_URL) return callBff(`/api/payments/methods/${paymentMethodId}`, 'DELETE');
  return callEdgeFunction(
    'payment-methods',
    { payment_method_id: paymentMethodId },
    { method: 'DELETE' }
  );
};

export const createConnectDashboardLink = async () => {
  if (BFF_URL) return callBff('/api/connect/dashboard-link', 'POST');
  return callEdgeFunction(
    'connect-account',
    { action: 'create_dashboard_link' },
    { method: 'POST' }
  );
};

export const manageSecrets = async (
  action: 'GET' | 'PUT',
  data?: { name: string; value: string }
) => {
  return callEdgeFunction('manage-secrets', data, { method: action === 'GET' ? 'GET' : 'PUT' });
};
export const createCheckoutSession = async (checkoutData: unknown) => {
  if (BFF_URL) return callBff('/api/payments/checkout', 'POST', checkoutData);
  return callEdgeFunction('create-checkout-session', checkoutData, { method: 'POST' });
};
export const checkCustomerPaymentMethods = async () => {
  return callEdgeFunction('payment-methods', null, { method: 'GET' });
};
export const checkSubscription = async () => {
  return callEdgeFunction('check-subscription', null, { method: 'GET' });
};
export const cancelSubscription = async (subscriptionId: string) => {
  return callEdgeFunction('cancel-subscription', { subscriptionId }, { method: 'POST' });
};
export const createCustomerPortalSession = async (returnUrl?: string) => {
  if (BFF_URL) return callBff('/api/payments/customer-portal', 'POST', { returnUrl });
  return callEdgeFunction('customer-portal', { returnUrl }, { method: 'POST' });
};
export const getConnectAccountStatus = async () => {
  return callEdgeFunction('connect-account', null, { method: 'GET' });
};
export const createConnectOnboardingLink = async () => {
  return callEdgeFunction(
    'connect-account',
    { action: 'create_onboarding_link' },
    { method: 'POST' }
  );
};
export const setDefaultPaymentMethodEdge = async (paymentMethodId: string) => {
  if (BFF_URL) return callBff('/api/payments/set-default', 'POST', { paymentMethodId });
  return callEdgeFunction(
    'payment-handler',
    { action: 'set_default', payment_method_id: paymentMethodId },
    { method: 'POST' }
  );
};
export const verifyPaymentIntentEdge = async (paymentIntentId: string) => {
  if (BFF_URL)
    return callBff('/api/payments/verify-intent', 'POST', { payment_intent_id: paymentIntentId });
  return callEdgeFunction(
    'payment-handler',
    { action: 'verify_payment', payment_intent_id: paymentIntentId },
    { method: 'POST' }
  );
};

