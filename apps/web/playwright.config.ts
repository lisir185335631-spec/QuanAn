import { defineConfig, devices } from '@playwright/test';

const REAL_LLM = !!process.env.E2E_REAL_LLM;

/**
 * apps/web local playwright config — PRD-17/18/20 E2E
 * Scoped to apps/web/e2e/ only. Root playwright.config.ts covers tests/e2e/.
 * E2E_REAL_LLM=1 → extended timeout + retries for real LLM calls
 */
export default defineConfig({
  testDir: './e2e',
  timeout: REAL_LLM ? 90_000 : 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: REAL_LLM ? 2 : 0,
  workers: 1,
  reporter: [['list']],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
