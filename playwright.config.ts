import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 600_000, // AC-17 (US-017): 10 min · 真 LLM 调用慢
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // workers=1: prevents shared-user activeAccountId race conditions across concurrent projects
  workers: 1,
  reporter: [['html'], ['github']],

  snapshotDir: '/tmp/aiipznt-clone-research/screenshots',
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 14 Pro'] } },
    // AC-8(US-007): admin SPA project · baseURL=5174 · workers=1 + fullyParallel=false
    // Follows anti-pattern REJ-D061: admin shared user must run serially
    {
      name: 'admin',
      testMatch: '**/tests/e2e/admin/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5174',
      },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
