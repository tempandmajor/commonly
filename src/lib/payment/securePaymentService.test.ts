/**
 * Secure Payment Service Tests
 */

import { describe, it, expect } from 'vitest';
import { SecurePaymentService } from './securePaymentService';
import { dollarsToCents } from '../validation/payment';

describe('SecurePaymentService', () => {
  describe('createPaymentIntent', () => {
    it('should create a payment intent with valid data', async () => {
      const result = await SecurePaymentService.createPaymentIntent({
        amount: dollarsToCents(100),
        currency: 'USD',
        paymentMethod: 'card',
        description: 'Test payment',
        idempotencyKey: `test_${Date.now()}`,
      });

      expect(result).toHaveProperty('paymentIntentId');
      expect(result).toHaveProperty('clientSecret');
      expect(result.paymentIntentId).toMatch(/^pi_/);
    });

    it('should enforce idempotency', async () => {
      const idempotencyKey = `test_idempotent_${Date.now()}`;

      const result1 = await SecurePaymentService.createPaymentIntent({
        amount: dollarsToCents(100),
        currency: 'USD',
        paymentMethod: 'card',
        description: 'Test payment',
        idempotencyKey,
      });

      const result2 = await SecurePaymentService.createPaymentIntent({
        amount: dollarsToCents(200), // Different amount
        currency: 'USD',
        paymentMethod: 'card',
        description: 'Test payment',
        idempotencyKey, // Same key
      });

      // Should return the same result
      expect(result2.paymentIntentId).toBe(result1.paymentIntentId);
    });

    it('should reject invalid amounts', async () => {
      await expect(
        SecurePaymentService.createPaymentIntent({
          amount: -100, // Negative amount
          currency: 'USD',
          paymentMethod: 'card',
          description: 'Test payment',
          idempotencyKey: `test_${Date.now()}`,
        })
      ).rejects.toThrow();
    });

    it('should reject amounts exceeding maximum', async () => {
      await expect(
        SecurePaymentService.createPaymentIntent({
          amount: 100000000, // Too large
          currency: 'USD',
          paymentMethod: 'card',
          description: 'Test payment',
          idempotencyKey: `test_${Date.now()}`,
        })
      ).rejects.toThrow();
    });

    it('should require idempotency key', async () => {
      await expect(
        SecurePaymentService.createPaymentIntent({
          amount: dollarsToCents(100),
          currency: 'USD',
          paymentMethod: 'card',
          description: 'Test payment',
          idempotencyKey: '', // Empty key
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('processRefund', () => {
    it('should process a refund with valid data', async () => {
      const result = await SecurePaymentService.processRefund({
        transactionId: '123e4567-e89b-12d3-a456-426614174000',
        amount: dollarsToCents(50),
        reason: 'requested_by_customer',
        idempotencyKey: `refund_${Date.now()}`,
      });

      expect(result).toHaveProperty('refundId');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('status');
      expect(result.refundId).toMatch(/^re_/);
    });

    it('should enforce refund idempotency', async () => {
      const idempotencyKey = `refund_idempotent_${Date.now()}`;

      const result1 = await SecurePaymentService.processRefund({
        transactionId: '123e4567-e89b-12d3-a456-426614174001',
        amount: dollarsToCents(50),
        reason: 'requested_by_customer',
        idempotencyKey,
      });

      const result2 = await SecurePaymentService.processRefund({
        transactionId: '123e4567-e89b-12d3-a456-426614174001',
        amount: dollarsToCents(100), // Different amount
        reason: 'requested_by_customer',
        idempotencyKey, // Same key
      });

      // Should return the same result
      expect(result2.refundId).toBe(result1.refundId);
    });

    it('should require valid transaction ID (UUID)', async () => {
      await expect(
        SecurePaymentService.processRefund({
          transactionId: 'invalid-uuid',
          reason: 'requested_by_customer',
          idempotencyKey: `refund_${Date.now()}`,
        })
      ).rejects.toThrow();
    });

    it('should require valid refund reason', async () => {
      await expect(
        SecurePaymentService.processRefund({
          transactionId: '123e4567-e89b-12d3-a456-426614174000',
          reason: 'invalid_reason' as any,
          idempotencyKey: `refund_${Date.now()}`,
        })
      ).rejects.toThrow();
    });
  });

  describe('processWalletTransaction', () => {
    it('should process a credit transaction', async () => {
      const result = await SecurePaymentService.processWalletTransaction({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        amount: dollarsToCents(100),
        type: 'credit',
        description: 'Test credit',
        idempotencyKey: `wallet_${Date.now()}`,
      });

      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('newBalance');
      expect(result.transactionId).toMatch(/^wt_/);
    });

    it('should process a debit transaction', async () => {
      const result = await SecurePaymentService.processWalletTransaction({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        amount: dollarsToCents(50),
        type: 'debit',
        description: 'Test debit',
        idempotencyKey: `wallet_${Date.now()}`,
      });

      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('newBalance');
    });

    it('should enforce wallet transaction idempotency', async () => {
      const idempotencyKey = `wallet_idempotent_${Date.now()}`;

      const result1 = await SecurePaymentService.processWalletTransaction({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        amount: dollarsToCents(100),
        type: 'credit',
        description: 'Test credit',
        idempotencyKey,
      });

      const result2 = await SecurePaymentService.processWalletTransaction({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        amount: dollarsToCents(200), // Different amount
        type: 'credit',
        description: 'Test credit',
        idempotencyKey, // Same key
      });

      // Should return the same result
      expect(result2.transactionId).toBe(result1.transactionId);
    });

    it('should require valid user ID (UUID)', async () => {
      await expect(
        SecurePaymentService.processWalletTransaction({
          userId: 'invalid-uuid',
          amount: dollarsToCents(100),
          type: 'credit',
          description: 'Test credit',
          idempotencyKey: `wallet_${Date.now()}`,
        })
      ).rejects.toThrow();
    });

    it('should require description', async () => {
      await expect(
        SecurePaymentService.processWalletTransaction({
          userId: '123e4567-e89b-12d3-a456-426614174000',
          amount: dollarsToCents(100),
          type: 'credit',
          description: '', // Empty description
          idempotencyKey: `wallet_${Date.now()}`,
        })
      ).rejects.toThrow();
    });
  });

  describe('updateTransactionStatus', () => {
    it('should allow valid status transitions', async () => {
      await expect(
        SecurePaymentService.updateTransactionStatus(
          'trans_123',
          'processing',
          'user_123'
        )
      ).resolves.not.toThrow();
    });

    it('should create audit logs', () => {
      const logs = SecurePaymentService.getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toHaveProperty('timestamp');
      expect(logs[0]).toHaveProperty('action');
      expect(logs[0]).toHaveProperty('userId');
    });
  });

  describe('getAuditLogs', () => {
    it('should return all logs when no filters applied', () => {
      const logs = SecurePaymentService.getAuditLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter logs by user ID', () => {
      const logs = SecurePaymentService.getAuditLogs('user_123');
      logs.forEach((log) => {
        expect(log.userId).toBe('user_123');
      });
    });

    it('should filter logs by date range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const logs = SecurePaymentService.getAuditLogs(
        undefined,
        oneHourAgo,
        now
      );

      logs.forEach((log) => {
        expect(log.timestamp.getTime()).toBeGreaterThanOrEqual(oneHourAgo.getTime());
        expect(log.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });
});