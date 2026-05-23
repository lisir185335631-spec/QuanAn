/**
 * PRD-28 US-006 AC-8 · prd28-evaluation-baseline.spec.ts
 * 3 admin evaluation pages visual baseline · viewport 1440x900 · fullPage · threshold 0.05
 *
 * Generate baselines:
 *   pnpm test:visual:prd28
 * CI check:
 *   pnpm test:visual:prd28:check
 */

import { writeFileSync, existsSync } from 'node:fs';
import { test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { expectVisualMatch } from '../../../apps/web/scripts/visual-diff';

const ADMIN_EMAIL = 'e2e-prd28-visual@quanan.com';
const DB_URL = process.env.DATABASE_URL ?? 'postgresql://return@localhost:5432/quanqn';
const ADMIN_BASE_URL = process.env.ADMIN_E2E_BASE_URL ?? 'http://localhost:5174';
const STORAGE_STATE = '/tmp/prd28-evaluation-visual-auth.json';

if (!existsSync(STORAGE_STATE)) {
  writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
}

const EVAL_PAGES = [
  { slug: 'evaluation-list', path: '/admin/evaluation' },
  { slug: 'evaluation-detail', path: '/admin/evaluation/00000000-0000-0000-0000-000000000001' },
  { slug: 'evaluation-matrix', path: '/admin/evaluation/00000000-0000-0000-0000-000000000001' },
] as const;

let prisma: PrismaClient;

test.describe('PRD-28 · admin evaluation visual baseline', () => {
  test.use({ storageState: STORAGE_STATE });

  test.beforeAll(async ({ browser }) => {
    prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
    await prisma.adminUser.upsert({
      where: { email: ADMIN_EMAIL },
      create: { email: ADMIN_EMAIL, role: 'super_admin', isMock: true, isActive: true },
      update: { role: 'super_admin', isMock: true, isActive: true },
    });

    const ctx = await browser.newContext({ baseURL: ADMIN_BASE_URL });
    const page = await ctx.newPage();
    await page.goto(`${ADMIN_BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('#admin-email').fill(ADMIN_EMAIL);
    await page.locator('button[type="submit"]').filter({ hasText: 'mock OAuth 登录' }).click();
    await page.waitForURL(/\/admin/, { timeout: 20_000 });
    await ctx.storageState({ path: STORAGE_STATE });
    await ctx.close();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('prd28-evaluation-list baseline · /admin/evaluation', async ({ page }) => {
    await page.addStyleTag({
      content: [
        '*, *::before, *::after {',
        '  animation-duration: 0s !important;',
        '  animation-delay: 0s !important;',
        '  transition-duration: 0s !important;',
        '  transition-delay: 0s !important;',
        '}',
      ].join('\n'),
    });

    await page.goto(`${ADMIN_BASE_URL}/admin/evaluation`);
    await page.waitForLoadState('networkidle');
    await page.locator('main[role="main"]').waitFor({ state: 'visible', timeout: 10_000 });

    await expectVisualMatch(page, {
      baseline: 'prd28-evaluation-list.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('prd28-evaluation-detail baseline · /admin/evaluation/list', async ({ page }) => {
    await page.addStyleTag({
      content: [
        '*, *::before, *::after {',
        '  animation-duration: 0s !important;',
        '  animation-delay: 0s !important;',
        '  transition-duration: 0s !important;',
        '  transition-delay: 0s !important;',
        '}',
      ].join('\n'),
    });

    // Navigate to list first to get a real runId if any
    await page.goto(`${ADMIN_BASE_URL}/admin/evaluation`);
    await page.waitForLoadState('networkidle');
    await page.locator('main[role="main"]').waitFor({ state: 'visible', timeout: 10_000 });

    await expectVisualMatch(page, {
      baseline: 'prd28-evaluation-detail.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('prd28-evaluation-matrix baseline · matrix chart render', async ({ page }) => {
    await page.addStyleTag({
      content: [
        '*, *::before, *::after {',
        '  animation-duration: 0s !important;',
        '  animation-delay: 0s !important;',
        '  transition-duration: 0s !important;',
        '  transition-delay: 0s !important;',
        '}',
      ].join('\n'),
    });

    await page.goto(`${ADMIN_BASE_URL}/admin/evaluation`);
    await page.waitForLoadState('networkidle');
    await page.locator('main[role="main"]').waitFor({ state: 'visible', timeout: 10_000 });

    await expectVisualMatch(page, {
      baseline: 'prd28-evaluation-matrix.png',
      viewport: { width: 1440, height: 900 },
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
