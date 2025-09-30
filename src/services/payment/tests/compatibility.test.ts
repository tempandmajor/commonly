import { expect, describe, it, vi } from 'vitest';
import * as LegacyPlatformCredit from '../compatibility/platformCredit';
import * as LegacyWallet from '../compatibility/wallet';
import { creditAPI, walletAPI } from '../index';

// Mock the new APIs that compatibility layers depend on
vi.mock('../api/credit', () => ({
  getBalance: vi.fn(() => Promise.resolve(100)),
  addCredit: vi.fn(() => Promise.resolve(true)),
  deductCredit: vi.fn(() => Promise.resolve(true)),
  hasEnoughCredit: vi.fn(() => Promise.resolve(true)),
  processCredit: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../api/wallet', () => ({
  getWallet: vi.fn(() =>
    Promise.resolve({
      id: 'wallet-123',
      userId: 'user-123',
      balance: 100,
      availableBalance: 100,
      pendingBalance: 0,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    })
  ),
  getOrCreateWallet: vi.fn(() =>
    Promise.resolve({
      id: 'wallet-123',
      userId: 'user-123',
      balance: 100,
      availableBalance: 100,
      pendingBalance: 0,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    })
  ),
  updateWalletBalance: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../api/transactions', () => ({
  createTransaction: vi.fn(() =>
    Promise.resolve({
      id: 'tx-123',
      userId: 'user-123',
      amount: 10,
      description: 'Test transaction',
      type: 'credit_addition',
      status: 'completed',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    })
  ),
  getTransactionHistory: vi.fn(() =>
    Promise.resolve([
      {
        id: 'tx-123',
        userId: 'user-123',
        amount: 10,
        description: 'Test transaction',
        type: 'credit_addition',
        status: 'completed',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      },
    ])
  ),
  updateTransactionStatus: vi.fn(() => Promise.resolve(true)),
}));

describe('Legacy PlatformCredit API Compatibility', () => {
  const userId = 'user-123';

  it('should get credit balance', async () => {
    const balance = await LegacyPlatformCredit.PlatformCredit.getBalance(userId);
    expect(balance).toBe(100);
    expect(creditAPI.getBalance).toHaveBeenCalledWith(userId);
  });

  it('should add credits', async () => {
    const result = await LegacyPlatformCredit.PlatformCredit.addCredits({
      userId,
      amount: 50,
      description: 'Test addition',
    });
    expect(result).toBeTruthy();
    expect(creditAPI.addCredit).toHaveBeenCalled();
  });

  it('should deduct credits', async () => {
    const result = await LegacyPlatformCredit.PlatformCredit.deductCredits({
      userId,
      amount: 25,
      description: 'Test deduction',
    });
    expect(result).toBeTruthy();
    expect(creditAPI.deductCredit).toHaveBeenCalled();
  });

  it('should check if user has enough credits', async () => {
    const result = await LegacyPlatformCredit.PlatformCredit.hasEnoughCredits(userId, 50);
    expect(result).toBeTruthy();
    expect(creditAPI.hasEnoughCredit).toHaveBeenCalledWith(userId, 50);
  });

  it('should get transaction history', async () => {
    const transactions = await LegacyPlatformCredit.PlatformCredit.getTransactionHistory(
      userId,
      10,
      0
    );
    expect(transactions).toHaveLength(1);
    expect(transactions[0].id).toBe('tx-123');
  });
});

describe('Legacy Wallet API Compatibility', () => {
  const userId = 'user-123';

  it('should get wallet', async () => {
    const wallet = await LegacyWallet.WalletService.getWallet(userId);
    expect(wallet).toBeDefined();
    expect(wallet.id).toBe('wallet-123');
    expect(walletAPI.getWallet).toHaveBeenCalledWith(userId);
  });

  it('should create wallet if not exists', async () => {
    const wallet = await LegacyWallet.WalletService.getOrCreateWallet(userId);
    expect(wallet).toBeDefined();
    expect(wallet.id).toBe('wallet-123');
    expect(walletAPI.getOrCreateWallet).toHaveBeenCalledWith(userId);
  });

  it('should update wallet balance', async () => {
    const result = await LegacyWallet.WalletService.updateBalance(userId, 150);
    expect(result).toBeTruthy();
    expect(walletAPI.updateWalletBalance).toHaveBeenCalledWith(userId, 150);
  });

  it('should add transaction', async () => {
    const result = await LegacyWallet.WalletService.addTransaction({
      userId,
      amount: 10,
      type: 'credit',
      description: 'Test transaction',
    });
    expect(result).toBeDefined();
  });
});
