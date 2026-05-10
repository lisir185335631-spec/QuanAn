import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // API path alias — used when unit tests import from apps/api/src/**
      '@': path.resolve(__dirname, 'apps/api/src'),
      // zod lives in apps/api/node_modules (not root) — expose to root vitest
      'zod': path.resolve(__dirname, 'apps/api/node_modules/zod'),
      // openai lives in apps/api/node_modules — expose so vi.mock('openai') intercepts worker imports (PRD-6 US-009)
      'openai': path.resolve(__dirname, 'apps/api/node_modules/openai'),
      // ioredis + bullmq live in apps/api/node_modules — aliases so vi.mock resolves consistently (PRD-6 US-010)
      'ioredis': path.resolve(__dirname, 'apps/api/node_modules/ioredis'),
      'bullmq': path.resolve(__dirname, 'apps/api/node_modules/bullmq'),
      // @quanqn/schemas subpath exports — PRD-6 US-001 schema tests
      '@quanqn/schemas/specialist-io': path.resolve(__dirname, 'packages/schemas/src/specialist-io/index.ts'),
      '@quanqn/schemas': path.resolve(__dirname, 'packages/schemas/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: { lines: 80, functions: 80, branches: 75, statements: 80 },
        // === LD-016 严格门禁 ===
        'src/server/agents/**': { lines: 90, functions: 90, branches: 85, statements: 90 },
        'src/lib/**': { lines: 95, functions: 95, branches: 90, statements: 95 },
      },
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/lib/constants/**',
        'tests/**',
        'scripts/**',
        '**/index.ts',
      ],
    },
    include: ['tests/unit/**/*.{test.ts,test.tsx}', 'tests/integration/**/*.test.ts'],
    passWithNoTests: true,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
