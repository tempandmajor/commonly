import { expect, describe, it, vi } from 'vitest';
import { creditAPI, walletAPI, transactionsAPI, stripeAPI } from '../';
import { TransactionType, TransactionStatus } from '../core/types';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWallet })),
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: [mockTransaction] })),
            })),
          })),
        })),
        insert: vi.fn(() => Promise.resolve({ data: mockTransaction })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: mockTransaction })),
        })),
      })),
    })),
  })),
}));

// Mock Stripe client
vi.mock('../edge/helpers', () => ({
  createStripeClient: vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn(() => Promise.resolve({ url: 'https://checkout.stripe.com/test' })),
      },
    },
    customers: {
      create: vi.fn(() => Promise.resolve({ id: 'cus_test123' })),
      retrieve: vi.fn(() => Promise.resolve({ id: 'cus_test123' })),
    },
    paymentMethods: {
      list: vi.fn(() => Promise.resolve({ data: [] })),
    },
    setupIntents: {
      create: vi.fn(() => Promise.resolve({ client_secret: 'seti_test123' })),
    },
    paymentIntents: {
      retrieve: vi.fn(() => Promise.resolve({ status: 'succeeded' })),
    },
  })),
}));

// Mock data
const mockUserId = 'user-123';
const mockWallet = {
  id: 'wallet-123',
  user_id: mockUserId,
  credit_balance: 100,
  balance_in_cents: 10000,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const mockTransaction = {
  id: 'tx-123',
  user_id: mockUserId,
  wallet_id: 'wallet-123',
  amount_in_cents: 1000,
  description: 'Test transaction',
  transaction_type: 'credit_addition',
  status: 'completed',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('Credit API', () => {
  it('should get user credit balance', async () => {
    const balance = await creditAPI.getBalance(mockUserId);
    expect(balance).toBe(100);
  });

  it('should add credit to user wallet', async () => {
    const result = await creditAPI.addCredit(mockUserId, 50, 'Added test credit');
    expect(result).toBeTruthy();
  });

  it('should check if user has enough credit', async () => {
    const hasEnough = await creditAPI.hasEnoughCredit(mockUserId, 50);
    expect(hasEnough).toBe(true);
  });

  it('should deduct credit from user wallet', async () => {
    const result = await creditAPI.deductCredit(mockUserId, 25, {
      description: 'Deducted test credit',
    });
    expect(result).toBeTruthy();
  });
});

describe('Wallet API', () => {
  it('should get user wallet', async () => {
    const wallet = await walletAPI.getWallet(mockUserId);
    expect(wallet.id).toBe('wallet-123');
    expect(wallet.balance).toBe(100);
  });

  it("should create wallet if it doesn't exist", async () => {
    const wallet = await walletAPI.getOrCreateWallet('new-user');
    expect(wallet).toBeDefined();
  });

  it('should update wallet balance', async () => {
    const result = await walletAPI.updateWalletBalance(mockUserId, 150);
    expect(result).toBeTruthy();
  });
});

describe('Transactions API', () => {
  it('should create a transaction', async () => {
    const transaction = await transactionsAPI.createTransaction(
      mockUserId,
      10.0,
      TransactionType.CREDIT_ADDITION,
      'Test credit addition',
      { status: TransactionStatus.COMPLETED }
    );
    expect(transaction).toBeDefined();
    expect(transaction.type).toBe(TransactionType.CREDIT_ADDITION);
  });

  it('should get transaction history', async () => {
    const transactions = await transactionsAPI.getTransactionHistory(mockUserId, 10, 0);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].userId).toBe(mockUserId);
  });

  it('should update transaction status', async () => {
    const updated = await transactionsAPI.updateTransactionStatus(
      'tx-123',
      TransactionStatus.COMPLETED
    );
    expect(updated).toBeTruthy();
  });
});

describe('Stripe API', () => {
  it('should create checkout session', async () => {
    const url = await stripeAPI.createCheckoutSession({
      userId: mockUserId,
      amount: 49.99,
      description: 'Premium subscription',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(url).toBe('https://checkout.stripe.com/test');
  });

  it('should verify payment intent', async () => {
    const success = await stripeAPI.verifyPaymentIntent('pi_test123');
    expect(success).toBe(true);
  });

  it('should list payment methods', async () => {
    const methods = await stripeAPI.listPaymentMethods(mockUserId);
    expect(Array.isArray(methods)).toBe(true);
  });
});
