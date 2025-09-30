import { test, expect } from '@playwright/test';

// Minimal happy-path skeleton; assumes preview env URL via BASE_URL and BFF via BFF_URL
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Helpers (stubbed)
async function login(page: any) {
  await page.goto(`${BASE_URL}/login`);
  // Implement project-specific login; for now just check page exists
  await expect(page).toHaveTitle(/Commonly/i);
}

test.describe('Payments happy-path', () => {
  test('user can start add payment method flow', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/wallet`);
    await expect(page.getByRole('heading', { name: /Wallet/i })).toBeVisible();

    // Navigate to add payment method page
    await page.getByRole('link', { name: /Add Payment Method/i }).click({ timeout: 10000 });
    await expect(page).toHaveURL(/add-payment-method/);

    // Ensure Stripe Elements appears (selector depends on implementation)
    await expect(page.locator('[data-elements-stable-field-name="cardNumber"]')).toBeVisible({ timeout: 15000 });
  });
}); 