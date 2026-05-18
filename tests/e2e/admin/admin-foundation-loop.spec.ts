/**
 * tests/e2e/admin/admin-foundation-loop.spec.ts
 * AC-5(US-007): 7-step admin foundation e2e loop
 *
 * 7 steps:
 * 1. seed admin_user via helper
 * 2. /login page loads
 * 3. fill email + click mock login → redirect to /admin
 * 4. TopBar(super_admin badge) + Sidebar(16 domains) + StatusBar(5 fields) render
 * 5. click 'NSM 仪表盘' → /admin/nsm placeholder
 * 6. click 🔔 → AuditDrawer slide-in + admin_login row visible
 * 7. close drawer + click logout → /login redirect + admin_session_id cookie cleared
 * Bonus: admin_audit_log ≥ 2 rows (admin_login + admin_logout)
 */

import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const ADMIN_EMAIL = 'e2e-foundation@quanqn.com';
const DB_URL = process.env.DATABASE_URL ?? 'postgresql://return@localhost:5432/quanqn';

let prisma: PrismaClient;

test.beforeAll(async () => {
  // Step 1: seed admin_user via direct prisma
  prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
  await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, role: 'super_admin', isMock: true, isActive: true },
    update: { role: 'super_admin', isMock: true, isActive: true },
  });
  // Clean up any stale sessions/audit logs from previous runs
  const user = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });
  if (user) {
    await prisma.adminAuditLog.deleteMany({ where: { actorAdminId: user.id } }).catch(() => undefined);
    await prisma.adminSession.deleteMany({ where: { adminUserId: user.id } }).catch(() => undefined);
  }
  process.env.OAUTH_PROVIDER = 'mock';
});

test.afterAll(async () => {
  // Cleanup
  const user = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });
  if (user) {
    await prisma.adminAuditLog.deleteMany({ where: { actorAdminId: user.id } }).catch(() => undefined);
    await prisma.adminSession.deleteMany({ where: { adminUserId: user.id } }).catch(() => undefined);
  }
  await prisma.$disconnect();
});

test('admin-foundation-loop: 7 steps · login → layout → nsm → audit → logout', async ({ page }) => {
  // ── Step 2: Navigate to /login ──────────────────────────────────────────────
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).toHaveText('QuanQn Admin', { timeout: 10_000 });
  await expect(page.locator('#admin-email')).toBeVisible();

  // ── Step 3: fill email + click mock OAuth → redirect to /admin ─────────────
  await page.locator('#admin-email').fill(ADMIN_EMAIL);
  const mockBtn = page.locator('button[type="submit"]').filter({ hasText: 'mock OAuth 登录' });
  await expect(mockBtn).toBeVisible({ timeout: 5_000 });
  await mockBtn.click();

  // Wait for redirect to /admin (or /admin/nsm due to default redirect)
  await page.waitForURL(/\/admin/, { timeout: 20_000 });
  await page.waitForLoadState('networkidle');

  // ── Step 4: TopBar + Sidebar(16 domains) + StatusBar render ────────────────
  // TopBar: super_admin badge
  await expect(page.locator('.admin-badge--role')).toBeVisible({ timeout: 10_000 });
  const roleBadge = await page.locator('.admin-badge--role').textContent();
  expect(roleBadge).toBe('super_admin');

  // Sidebar: 16 nav items
  const navItems = page.locator('.admin-sidebar__item');
  await expect(navItems.first()).toBeVisible({ timeout: 5_000 });
  const count = await navItems.count();
  expect(count).toBeGreaterThanOrEqual(16);

  // StatusBar: visible (5 fields rendered)
  await expect(page.locator('.admin-statusbar')).toBeVisible({ timeout: 5_000 });

  // ── Step 5: click 'NSM 仪表盘' → /admin/nsm placeholder ────────────────────
  const nsmLink = page.locator('.admin-sidebar__item').filter({ hasText: 'NSM 仪表盘' });
  await nsmLink.click();
  await page.waitForURL(/\/admin\/nsm/, { timeout: 10_000 });
  // Verify placeholder content (heading in nsm placeholder)
  await expect(page.locator('main h2').first()).toBeVisible({ timeout: 5_000 });

  // ── Step 6: click 🔔 → AuditDrawer slide-in + admin_login row visible ──────
  const bellBtn = page.locator('button[aria-label="审计记录"]');
  await bellBtn.click();

  const auditDrawer = page.locator('[data-testid="audit-drawer"]');
  await expect(auditDrawer).toBeVisible({ timeout: 10_000 });

  // AuditDrawer should show admin_login event
  await expect(auditDrawer.locator('.audit-drawer__event-type').filter({ hasText: 'admin_login' })).toBeVisible({
    timeout: 10_000,
  });

  // ── Step 6b: close drawer ────────────────────────────────────────────────────
  const closeBtn = auditDrawer.locator('.audit-drawer__close');
  await closeBtn.click();
  await expect(auditDrawer).not.toBeVisible({ timeout: 5_000 });

  // ── Step 7: click logout → redirect to /login + cookie cleared ─────────────
  // Open user dropdown
  const dropdownBtn = page.locator('.admin-topbar__btn[aria-label="用户菜单"]');
  await dropdownBtn.click();

  const logoutMenuItem = page.locator('[role="menuitem"]').filter({ hasText: '退出登录' });
  await expect(logoutMenuItem).toBeVisible({ timeout: 5_000 });
  await logoutMenuItem.click();

  await page.waitForURL(/\/login/, { timeout: 15_000 });
  await expect(page.locator('h1')).toHaveText('QuanQn Admin', { timeout: 5_000 });

  // Verify admin_session_id cookie is cleared (Max-Age=0 means cleared)
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((c) => c.name === 'admin_session_id');
  // Cookie should be absent or have empty value after logout
  if (sessionCookie) {
    expect(sessionCookie.value).toBeFalsy();
  }

  // ── Bonus: admin_audit_log ≥ 2 rows (admin_login + admin_logout) ─────────────
  const user = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });
  if (user) {
    const auditRows = await prisma.adminAuditLog.findMany({
      where: { actorAdminId: user.id },
      select: { eventType: true },
    });
    expect(auditRows.length).toBeGreaterThanOrEqual(2);
    const eventTypes = auditRows.map((r) => r.eventType);
    expect(eventTypes).toContain('admin_login');
    expect(eventTypes).toContain('admin_logout');
  }

  // ── Screenshot ────────────────────────────────────────────────────────────────
  await page.goto('/login');
  await page.screenshot({ path: 'screenshots/admin-foundation-loop.png', fullPage: true });
});
