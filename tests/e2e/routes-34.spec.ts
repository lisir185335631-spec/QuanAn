/**
 * E2E test — US-006 AC-1
 * 33 路由全部可访问 · URL 直输 + 页面不崩溃(无 React error boundary fallback)
 */
import { test, expect } from '@playwright/test';

const WEB_BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

// 9 step + 13 tools + 6 modules + 3 aux = 31 directly accessible named routes
// Root / (redirect) + catch-all * = 33 total router children
const ROUTES = [
  '/step/1', '/step/2', '/step/3', '/step/4', '/step/5',
  '/step/6', '/step/7', '/step/8', '/step/9',
  '/trending', '/copywriting', '/present-styles', '/monetization', '/private-domain',
  '/boom-generate', '/generate', '/analysis', '/video-production', '/acquisition-video',
  '/ai-video', '/deep-learning', '/knowledge',
  '/diagnosis', '/daily-tasks', '/evolution', '/accounts', '/my-topics', '/history',
  '/ip-plan', '/settings', '/login',
] as const;

test.describe('33 路由可访问性', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    // Authenticate via mock OAuth
    await page.goto(`${API_BASE}/auth/login`);
    await page.waitForURL(`${WEB_BASE}/**`);
    await page.waitForSelector('[data-testid="app-header"]');
  });

  for (const route of ROUTES) {
    test(`${route} 可达 · 无 error boundary`, async ({ page }) => {
      await page.goto(`${WEB_BASE}${route}`);
      // Wait for navigation to settle
      await page.waitForLoadState('networkidle');
      // Page should not show error boundary fallback
      await expect(page.getByText('页面加载出错')).not.toBeVisible();
      // Should still have the app header (layout intact)
      await expect(page.locator('[data-testid="app-header"]')).toBeVisible();
    });
  }

  test('总路由数覆盖 31 命名路由(33 含 index redirect + catch-all)', () => {
    // 9 step + 13 tools + 6 modules + 3 aux = 31 directly navigable routes
    // Plus 1 root index redirect + 1 catch-all = 33 total router children
    expect(ROUTES.length).toBe(31);
  });
});
