import { chromium } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const ADMIN_EMAIL = 'e2e-prd26-screenshot@quanan.com';
const DB_URL = process.env.DATABASE_URL ?? 'postgresql://return@localhost:5432/quanqn';
const ADMIN_BASE_URL = 'http://localhost:5174';
const OUT_DIR = '/Users/return/Desktop/QuanAn/scripts/ralph/verify-artifacts/US-002';

const PAGES = [
  { slug: 'nsm', path: '/admin/nsm' },
  { slug: 'users', path: '/admin/users' },
  { slug: 'accounts', path: '/admin/accounts' },
  { slug: 'cost', path: '/admin/cost' },
  { slug: 'audit', path: '/admin/audit' },
  { slug: 'invites', path: '/admin/invites' },
  { slug: 'reviewTrending', path: '/admin/reviewTrending' },
  { slug: 'reviewDeepLearn', path: '/admin/reviewDeepLearn' },
  { slug: 'evolutionHealth', path: '/admin/evolution-health' },
  { slug: 'prompts', path: '/admin/prompts' },
  { slug: 'quota', path: '/admin/quota' },
  { slug: 'compliance', path: '/admin/compliance' },
  { slug: 'approvals', path: '/admin/approvals' },
  { slug: 'abExperiments', path: '/admin/ab-experiments' },
  { slug: 'constants', path: '/admin/constants' },
  { slug: 'knowledge', path: '/admin/knowledge' },
  { slug: 'feature-flags', path: '/admin/feature-flags' },
];

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
  await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, role: 'super_admin', isMock: true, isActive: true },
    update: { role: 'super_admin', isMock: true, isActive: true },
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${ADMIN_BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.locator('#admin-email').fill(ADMIN_EMAIL);
  await page.locator('button[type="submit"]').filter({ hasText: 'mock OAuth 登录' }).click();
  await page.waitForURL(/\/admin/, { timeout: 20_000 });
  console.log('Logged in');

  for (const { slug, path: pagePath } of PAGES) {
    await page.goto(`${ADMIN_BASE_URL}${pagePath}`);
    await page.waitForLoadState('networkidle');
    await page.locator('main[role="main"]').waitFor({ state: 'visible', timeout: 10_000 });
    const outPath = path.join(OUT_DIR, `admin-pages-${slug}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`  ✓ ${slug}`);
  }

  await browser.close();
  await prisma.$disconnect();
  console.log(`Done – 17 screenshots in ${OUT_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
