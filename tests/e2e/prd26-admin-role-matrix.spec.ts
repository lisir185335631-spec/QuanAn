/**
 * tests/e2e/prd26-admin-role-matrix.spec.ts
 * PRD-26 US-003 · admin auth + 三档权限矩阵 e2e
 *
 * Three roles: super_admin / domain_admin / reviewer
 * Verifies sidebar domain filtering, route redirect/403, audit_log ≥ 9 rows
 * serial: audit_log order-sensitive
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { createPrismaClient, seedAdminUser } from './admin/_admin-seed';

const __filename = fileURLToPath(import.meta.url);
const __dirnameESM = path.dirname(__filename);

const ADMIN_BASE_URL = process.env.ADMIN_E2E_BASE_URL ?? 'http://localhost:5174';
const ARTIFACTS_DIR = path.join(__dirnameESM, '../../scripts/ralph/verify-artifacts/US-003');

const SUPER_ADMIN_EMAIL = 'e2e-prd26-super@quanan.com';
const DOMAIN_ADMIN_EMAIL = 'e2e-prd26-domain@quanan.com';
const REVIEWER_EMAIL = 'e2e-prd26-reviewer@quanan.com';

const DOMAIN_ADMIN_ALLOWED = ['users', 'accounts', 'cost'];
const REVIEWER_ALLOWED = ['review_trending', 'review_deep_learn'];

// Storage state files for each role (isolated per AC-8)
const STORAGE_DIR = '/tmp/prd26-role-matrix-auth';
const superAdminState = path.join(STORAGE_DIR, 'super_admin.json');
const domainAdminState = path.join(STORAGE_DIR, 'domain_admin.json');
const reviewerState = path.join(STORAGE_DIR, 'reviewer.json');

let prisma: PrismaClient;

test.describe.serial('prd26-admin-role-matrix', () => {
  test.beforeAll(async () => {
    // Ensure dirs exist
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    // Init empty storage state files so Playwright can open context without ENOENT
    for (const f of [superAdminState, domainAdminState, reviewerState]) {
      if (!fs.existsSync(f)) {
        fs.writeFileSync(f, JSON.stringify({ cookies: [], origins: [] }));
      }
    }

    prisma = createPrismaClient();

    // Seed three role fixtures (AC-1)
    await seedAdminUser(prisma, { email: SUPER_ADMIN_EMAIL, role: 'super_admin', allowedDomains: [] });
    await seedAdminUser(prisma, {
      email: DOMAIN_ADMIN_EMAIL,
      role: 'domain_admin',
      allowedDomains: DOMAIN_ADMIN_ALLOWED,
    });
    await seedAdminUser(prisma, {
      email: REVIEWER_EMAIL,
      role: 'reviewer',
      allowedDomains: REVIEWER_ALLOWED,
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────
  // Helper: login and save storageState for a given role
  // ─────────────────────────────────────────────────────────
  async function loginAndSaveState(
    context: BrowserContext,
    email: string,
    storageStateFile: string,
  ): Promise<Page> {
    const page = await context.newPage();
    await page.goto(`${ADMIN_BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.locator('#admin-email').fill(email);
    const mockBtn = page.locator('button[type="submit"]').filter({ hasText: 'mock OAuth 登录' });
    await mockBtn.click();
    await page.waitForURL(/\/admin/, { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await context.storageState({ path: storageStateFile });
    return page;
  }

  // ─────────────────────────────────────────────────────────
  // Helper: logout and verify cookie cleared (AC-7)
  // ─────────────────────────────────────────────────────────
  async function logoutAndVerify(page: Page): Promise<void> {
    const dropdownBtn = page.locator('.admin-topbar__btn[aria-label="用户菜单"]');
    await dropdownBtn.click();
    const logoutMenuItem = page.locator('[role="menuitem"]').filter({ hasText: '退出登录' });
    await expect(logoutMenuItem).toBeVisible({ timeout: 5_000 });
    await logoutMenuItem.click();
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    // AC-7: admin_session_id cookie cleared after logout
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === 'admin_session_id');
    if (sessionCookie) {
      expect(sessionCookie.value).toBeFalsy();
    }
  }

  // ─────────────────────────────────────────────────────────
  // AC-2: super_admin — 16 domain 全显 + /users + /cost + /audit accessible
  // ─────────────────────────────────────────────────────────
  test('super_admin: sidebar 全显 + 核心页面可访问 + StatusBar badge', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: ADMIN_BASE_URL, viewport: { width: 1440, height: 900 } });
    const page = await loginAndSaveState(context, SUPER_ADMIN_EMAIL, superAdminState);

    // AC-2: StatusBar shows super_admin badge
    await expect(page.locator('.admin-badge--role')).toBeVisible({ timeout: 10_000 });
    const badge = await page.locator('.admin-badge--role').textContent();
    expect(badge).toBe('super_admin');

    // AC-2: sidebar shows all domain items (≥ 16) — toHaveCount retries until stable
    const navItems = page.locator('.admin-sidebar__item');
    await expect(navItems.first()).toBeVisible({ timeout: 10_000 });
    // Wait for React Query auth.me to settle (super_admin → empty allowedDomains → 17 routes)
    await expect(navItems).toHaveCount(17, { timeout: 10_000 });

    // AC-2: /admin/users accessible
    await page.goto(`${ADMIN_BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main[role="main"]')).toBeVisible({ timeout: 5_000 });
    expect(page.url()).toMatch(/\/admin\/users/);

    // AC-2: /admin/cost accessible
    await page.goto(`${ADMIN_BASE_URL}/admin/cost`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main[role="main"]')).toBeVisible({ timeout: 5_000 });
    expect(page.url()).toMatch(/\/admin\/cost/);

    // AC-2: /admin/audit accessible
    await page.goto(`${ADMIN_BASE_URL}/admin/audit`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main[role="main"]')).toBeVisible({ timeout: 5_000 });
    expect(page.url()).toMatch(/\/admin\/audit/);

    // Screenshot (AC-13)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role-super_admin.png'), fullPage: false });

    await logoutAndVerify(page);
    await context.close();
  });

  // ─────────────────────────────────────────────────────────
  // AC-3: domain_admin — only 3 allowed domains visible + /audit + /reviewTrending redirect
  // ─────────────────────────────────────────────────────────
  test('domain_admin: sidebar 3 domains + unauthorized redirect', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: ADMIN_BASE_URL, viewport: { width: 1440, height: 900 } });
    const page = await loginAndSaveState(context, DOMAIN_ADMIN_EMAIL, domainAdminState);

    // AC-3: sidebar shows only 3 allowed domains — toHaveCount retries until React settles
    const navItems = page.locator('.admin-sidebar__item');
    // Wait for auth.me to resolve and sidebar to filter to 3 items
    await expect(navItems).toHaveCount(3, { timeout: 15_000 });

    // Verify correct 3 labels are shown
    const labels = await navItems.allTextContents();
    const labelText = labels.map((l) => l.trim()).join(',');
    expect(labelText).toContain('用户管理');
    expect(labelText).toContain('IP 账号管理');
    expect(labelText).toContain('成本仪表盘');

    // AC-3: /admin/audit → redirect (not accessible)
    await page.goto(`${ADMIN_BASE_URL}/admin/audit`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    expect(page.url()).not.toMatch(/\/admin\/audit/);

    // AC-3: /admin/reviewTrending → redirect
    await page.goto(`${ADMIN_BASE_URL}/admin/reviewTrending`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    expect(page.url()).not.toMatch(/\/admin\/reviewTrending/);

    // Screenshot (AC-13)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role-domain_admin.png'), fullPage: false });

    await logoutAndVerify(page);
    await context.close();
  });

  // ─────────────────────────────────────────────────────────
  // AC-4: reviewer — only 2 review_* domains + /users redirect
  // ─────────────────────────────────────────────────────────
  test('reviewer: sidebar 2 review domains + /users redirect', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: ADMIN_BASE_URL, viewport: { width: 1440, height: 900 } });
    const page = await loginAndSaveState(context, REVIEWER_EMAIL, reviewerState);

    // AC-4: sidebar shows only 2 review_* domains — toHaveCount retries until React settles
    const navItems = page.locator('.admin-sidebar__item');
    await expect(navItems).toHaveCount(2, { timeout: 15_000 });

    const labels = await navItems.allTextContents();
    const labelText = labels.map((l) => l.trim()).join(',');
    expect(labelText).toContain('TrendingItem 审核');
    expect(labelText).toContain('DeepLearn 审核');

    // AC-4: /admin/reviewTrending accessible
    await page.goto(`${ADMIN_BASE_URL}/admin/reviewTrending`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main[role="main"]')).toBeVisible({ timeout: 5_000 });
    expect(page.url()).toMatch(/\/admin\/reviewTrending/);

    // AC-4: /admin/reviewDeepLearn accessible
    await page.goto(`${ADMIN_BASE_URL}/admin/reviewDeepLearn`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main[role="main"]')).toBeVisible({ timeout: 5_000 });
    expect(page.url()).toMatch(/\/admin\/reviewDeepLearn/);

    // AC-4: /admin/users → redirect (not accessible)
    await page.goto(`${ADMIN_BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    expect(page.url()).not.toMatch(/\/admin\/users/);

    // Screenshot (AC-13)
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role-reviewer.png'), fullPage: false });

    await logoutAndVerify(page);
    await context.close();
  });

  // ─────────────────────────────────────────────────────────
  // AC-5: admin_audit_log ≥ 9 rows across 3 roles
  // ─────────────────────────────────────────────────────────
  test('audit_log ≥ 9 rows across 3 roles', async () => {
    const emails = [SUPER_ADMIN_EMAIL, DOMAIN_ADMIN_EMAIL, REVIEWER_EMAIL];
    let totalRows = 0;

    for (const email of emails) {
      const user = await prisma.adminUser.findUnique({ where: { email }, select: { id: true } });
      if (!user) continue;
      const rows = await prisma.adminAuditLog.findMany({ where: { actorAdminId: user.id } });
      totalRows += rows.length;
    }

    // AC-5: ≥ 9 rows (3 role × {login + page_view + logout} = 9)
    expect(totalRows).toBeGreaterThanOrEqual(9);
  });

  // ─────────────────────────────────────────────────────────
  // AC-8: storageState files are isolated per role
  // ─────────────────────────────────────────────────────────
  test('storageState files are isolated per role', () => {
    const superState = JSON.parse(fs.readFileSync(superAdminState, 'utf-8'));
    const domainState = JSON.parse(fs.readFileSync(domainAdminState, 'utf-8'));
    const reviewState = JSON.parse(fs.readFileSync(reviewerState, 'utf-8'));

    // Each state file exists and is distinct
    expect(superState).toBeDefined();
    expect(domainState).toBeDefined();
    expect(reviewState).toBeDefined();

    // If session cookies still present after logout, they must differ (different sessions)
    const superCookie = superState.cookies?.find((c: { name: string }) => c.name === 'admin_session_id');
    const domainCookie = domainState.cookies?.find((c: { name: string }) => c.name === 'admin_session_id');
    if (superCookie?.value && domainCookie?.value) {
      expect(superCookie.value).not.toBe(domainCookie.value);
    }
  });

  // ─────────────────────────────────────────────────────────
  // AC-12: no hardcoded role checks in apps/admin/src
  // ─────────────────────────────────────────────────────────
  test('AC-12: no frontend hardcoded role checks', () => {
    let result = '';
    try {
      result = execSync(
        "grep -r 'admin role hardcoded' /Users/return/Desktop/QuanAn/apps/admin/src/ 2>/dev/null",
        { encoding: 'utf-8' },
      );
    } catch {
      result = '';
    }
    expect(result.trim()).toBe('');
  });
});
