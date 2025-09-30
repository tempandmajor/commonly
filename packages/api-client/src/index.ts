import { z } from 'zod'

export type FetchLike = typeof fetch

const PaymentMethodSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  card: z
    .object({ brand: z.string().optional(), last4: z.string().optional(), exp_month: z.number().optional(), exp_year: z.number().optional() })
    .optional(),
  billing_details: z.object({ name: z.string().optional(), email: z.string().optional() }).optional(),
  is_default: z.boolean().optional()
})

export const PaymentsResponse = {
  list: z.object({ paymentMethods: z.array(PaymentMethodSchema) }),
  setupIntent: z.object({ client_secret: z.string(), setup_intent_id: z.string() })
}

export class BffClient {
  constructor(private baseUrl: string, private fetchImpl: FetchLike = fetch) {}

  private async request<T>(path: string, init: RequestInit & { authToken?: string } = {}): Promise<T> {
    const { authToken, headers, ...rest } = init as any
    const resp = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(headers || {})
      }
    })
    const json = await resp.json().catch(() => ({}))
    if (!resp.ok) throw new Error(json?.error || `BFF error ${resp.status}`)
    return json as T
  }

  async listPaymentMethods(authToken: string) {
    const json = await this.request<unknown>(`/api/payments/methods`, { method: 'GET', authToken })
    return PaymentsResponse.list.parse(json)
  }

  async createSetupIntent(authToken: string, idempotencyKey?: string) {
    const json = await this.request<unknown>(`/api/payments/methods`, { method: 'POST', authToken, headers: idempotencyKey ? { 'idempotency-key': idempotencyKey } : {} })
    return PaymentsResponse.setupIntent.parse(json)
  }

  async setDefaultPaymentMethod(authToken: string, paymentMethodId: string) {
    return this.request(`/api/payments/set-default`, { method: 'POST', authToken, body: JSON.stringify({ paymentMethodId }) })
  }

  async deletePaymentMethod(authToken: string, id: string) {
    return this.request(`/api/payments/methods/${id}`, { method: 'DELETE', authToken })
  }
} 