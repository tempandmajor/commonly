import { test, expect } from '@playwright/test';

const BFF_URL = process.env.BFF_URL;

test.describe('BFF metrics', () => {
  test('ledger invariants endpoint responds', async ({ request }) => {
    test.skip(!BFF_URL, 'BFF_URL not set');
    const resp = await request.get(`${BFF_URL}/api/metrics/ledger-invariants`);
    expect([200, 503]).toContain(resp.status());
    if (resp.status() === 200) {
      const json = await resp.json();
      expect(typeof json.ok).toBe('boolean');
      expect(typeof json.checked).toBe('number');
      expect(typeof json.violations).toBe('number');
    }
  });

  test('outbox metrics endpoint responds', async ({ request }) => {
    test.skip(!BFF_URL, 'BFF_URL not set');
    const resp = await request.get(`${BFF_URL}/api/metrics/outbox`);
    expect([200, 503]).toContain(resp.status());
    if (resp.status() === 200) {
      const json = await resp.json();
      expect(typeof json.unprocessed).toBe('number');
      expect(typeof json.dlq).toBe('number');
    }
  });
}); 