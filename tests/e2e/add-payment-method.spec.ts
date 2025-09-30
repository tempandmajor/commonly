/* @ts-nocheck */
import { test, expect } from '@playwright/test';

// This is a smoke test scaffold. It requires VITE_* env and a running preview URL to be meaningful.
// We skip if required env vars are not provided in CI.
const APP_URL = process.env.PREVIEW_URL || process.env.APP_URL || 'http://localhost:4173';
const STRIPE_PK = process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

test.describe('Add Payment Method page', () => {
  test.skip(!STRIPE_PK, 'Stripe publishable key not provided');

  test('renders and shows form controls', async ({ page }) => {
    await page.goto(`${APP_URL}/wallet/add-payment-method`);

    await expect(page.getByRole('heading', { name: 'Add Payment Method' })).toBeVisible();
    await expect(page.getByText('Secure Payment Processing')).toBeVisible();
    await expect(page.getByLabel('Cardholder Name')).toBeVisible();
    await expect(page.getByLabel('Street Address')).toBeVisible();
    await expect(page.getByLabel('City')).toBeVisible();
    await expect(page.getByLabel('State')).toBeVisible();
    await expect(page.getByLabel('Postal Code')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Add Payment Method' })).toBeVisible();
  });
}); 