/**
 * QuanQn · US-016 · vitest.judge.config.ts
 * AC-3: 独立 config · 排除常规 unit · CI 单独跑
 * AC-13: timeout_ms=15000 per judge (7 cases × max10s + overhead)
 */

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/api/src'),
      zod: path.resolve(__dirname, 'apps/api/node_modules/zod'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // AC-3: only judge tests — exclude regular unit/integration/e2e
    include: ['tests/judge/**/*.judge.ts'],
    exclude: [
      'tests/unit/**',
      'tests/integration/**',
      'tests/e2e/**',
      '**/node_modules/**',
    ],
    passWithNoTests: true,
    // AC-13: single judge < 10s, add buffer for test overhead
    testTimeout: 15_000,
    hookTimeout: 30_000,
    // AC-8: sequential to surface which specific case fails
    sequence: { concurrent: false },
  },
});
