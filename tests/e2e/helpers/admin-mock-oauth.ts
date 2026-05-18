/**
 * tests/e2e/helpers/admin-mock-oauth.ts
 * AC-6(US-007): mockAdminLogin(page, {email, role}) UI automation helper
 * Uses the admin SPA login form with mock OAuth (DEV only)
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface MockLoginOptions {
  email: string;
  role?: 'super_admin' | 'admin' | 'readonly_admin';
}

/**
 * Automates the admin login form using mock OAuth.
 * Navigates to /login, fills email, clicks mock OAuth button, waits for /admin redirect.
 */
export async function mockAdminLogin(page: Page, opts: MockLoginOptions): Promise<void> {
  const { email } = opts;

  // Navigate to admin login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill email input
  const emailInput = page.locator('#admin-email');
  await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
  await emailInput.fill(email);

  // Click mock OAuth login button (DEV-only button)
  const mockLoginBtn = page.locator('button[type="submit"]').filter({ hasText: 'mock OAuth 登录' });
  await mockLoginBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await mockLoginBtn.click();

  // Wait for redirect to /admin (successful login)
  await page.waitForURL('**/admin/**', { timeout: 15_000 });

  // Verify admin layout rendered
  await expect(page.locator('[data-testid="admin-layout"]')).toBeVisible({ timeout: 10_000 });
}
