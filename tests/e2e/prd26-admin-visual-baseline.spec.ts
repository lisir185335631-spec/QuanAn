/**
 * PRD-26 US-002 AC-1~3 · prd26-admin-visual-baseline.spec.ts
 * 17 admin pages visual baseline · viewport 1440x900 · fullPage · threshold 0.05
 *
 * First run (generate baselines):
 *   playwright test tests/e2e/prd26-admin-visual-baseline.spec.ts --update-snapshots
 * CI check:
 *   playwright test tests/e2e/prd26-admin-visual-baseline.spec.ts
 */

import { writeFileSync, existsSync } from 'node:fs';
import { test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { expectVisualMatch } from '../../apps/web/scripts/visual-diff';

const ADMIN_EMAIL = 'e2e-prd26-visual@quanan.com';
const DB_URL = process.env.DATABASE_URL ?? 'postgresql://return@localhost:5432/quanqn';
const ADMIN_BASE_URL = process.env.ADMIN_E2E_BASE_URL ?? 'http://localhost:5174';
const STORAGE_STATE = '/tmp/prd26-admin-visual-auth.json';

// Ensure storageState file exists (empty) before test.use reads it at context creation time;
// beforeAll will overwrite with a real session before any test's page fixture is created.
if (!existsSync(STORAGE_STATE)) {
  writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
}

// AC-2: 17-page matrix — P0 core 6 + P0 review 2 + P1 health 5 + P2 advanced 4
const ADMIN_PAGES = [
  // P0 核心
  { slug: 'nsm', path: '/admin/nsm' },
  { slug: 'users', path: '/admin/users' },
  { slug: 'accounts', path: '/admin/accounts' },
  { slug: 'cost', path: '/admin/cost' },
  { slug: 'audit', path: '/admin/audit' },
  { slug: 'invites', path: '/admin/invites' },
  // P0 审核
  { slug: 'reviewTrending', path: '/admin/reviewTrending' },
  { slug: 'reviewDeepLearn', path: '/admin/reviewDeepLearn' },
  // P1 健康度
  { slug: 'evolutionHealth', path: '/admin/evolution-health' },
  { slug: 'prompts', path: '/admin/prompts' },
  { slug: 'quota', path: '/admin/quota' },
  { slug: 'compliance', path: '/admin/compliance' },
  { slug: 'approvals', path: '/admin/approvals' },
  // P2 高级
  { slug: 'abExperiments', path: '/admin/ab-experiments' },
  { slug: 'constants', path: '/admin/constants' },
  { slug: 'knowledge', path: '/admin/knowledge' },
  { slug: 'feature-flags', path: '/admin/feature-flags' },
] as const;

let prisma: PrismaClient;

test.describe('PRD-26 · admin 17 page visual baseline', () => {
  // AC-1: reuse admin-foundation-loop seed + storageState pattern
  test.use({ storageState: STORAGE_STATE });

  test.beforeAll(async ({ browser }) => {
    // Seed super_admin user
    prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
    await prisma.adminUser.upsert({
      where: { email: ADMIN_EMAIL },
      create: { email: ADMIN_EMAIL, role: 'super_admin', isMock: true, isActive: true },
      update: { role: 'super_admin', isMock: true, isActive: true },
    });

    // Login once + save storageState (AC-1: test.beforeAll 一次性 seed + login)
    const ctx = await browser.newContext({ baseURL: ADMIN_BASE_URL });
    const page = await ctx.newPage();
    await page.goto(`${ADMIN_BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('#admin-email').fill(ADMIN_EMAIL);
    await page
      .locator('button[type="submit"]')
      .filter({ hasText: 'mock OAuth 登录' })
      .click();
    await page.waitForURL(/\/admin/, { timeout: 20_000 });
    await ctx.storageState({ path: STORAGE_STATE });
    await ctx.close();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  // AC-2/3: 17 baseline tests — viewport 1440x900 · fullPage true · threshold 0.05
  for (const { slug, path } of ADMIN_PAGES) {
    test(`prd26-admin-${slug}.png baseline · ${path}`, async ({ page }) => {
      // Disable animations for stable screenshots
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

      await page.goto(`${ADMIN_BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      // AdminLayout always wraps content in <main role="main">; use as stable render signal
      // (some pages use h2 or no heading at all — main content area is the reliable indicator)
      await page.locator('main[role="main"]').waitFor({ state: 'visible', timeout: 10_000 });

      await expectVisualMatch(page, {
        baseline: `prd26-admin-${slug}.png`,
        viewport: { width: 1440, height: 900 },
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      });
    });
  }
});
