import { defineConfig, type Plugin } from 'vitest/config';
import path from 'node:path';
import react from '@vitejs/plugin-react';

const adminSrc = path.resolve(__dirname, 'apps/admin/src');

/** Re-route `@/` to apps/admin/src when the importer lives there. */
const adminAliasPlugin: Plugin = {
  name: 'admin-at-alias',
  enforce: 'pre',
  resolveId(id, importer) {
    if (id.startsWith('@/') && importer?.includes('apps/admin/src')) {
      return path.resolve(adminSrc, id.slice(2));
    }
  },
};

export default defineConfig({
  plugins: [react(), adminAliasPlugin],
  resolve: {
    alias: {
      // API path alias — used when unit tests import from apps/api/src/**
      '@': path.resolve(__dirname, 'apps/api/src'),
      // admin app alias — used by tests/unit/admin/*.tsx
      '@admin': adminSrc,
      // React lives in apps/admin/node_modules — expose for admin tests
      'react': path.resolve(__dirname, 'apps/admin/node_modules/react'),
      'react-dom': path.resolve(__dirname, 'apps/admin/node_modules/react-dom'),
      'react-dom/client': path.resolve(__dirname, 'apps/admin/node_modules/react-dom/client.js'),
      'react-router-dom': path.resolve(__dirname, 'apps/admin/node_modules/react-router-dom'),
      // zod lives in apps/api/node_modules (not root) — expose to root vitest
      'zod': path.resolve(__dirname, 'apps/api/node_modules/zod'),
      // openai lives in apps/api/node_modules — expose so vi.mock('openai') intercepts worker imports (PRD-6 US-009)
      'openai': path.resolve(__dirname, 'apps/api/node_modules/openai'),
      // ioredis + bullmq live in apps/api/node_modules — aliases so vi.mock resolves consistently (PRD-6 US-010)
      'ioredis': path.resolve(__dirname, 'apps/api/node_modules/ioredis'),
      'bullmq': path.resolve(__dirname, 'apps/api/node_modules/bullmq'),
      // @trpc/server lives in apps/api/node_modules — expose so vi.hoisted test files can import TRPCError (PRD-6 US-007)
      '@trpc/server': path.resolve(__dirname, 'apps/api/node_modules/@trpc/server'),
      // ipaddr.js lives in apps/api/node_modules — needed for ipWhitelist middleware tests
      'ipaddr.js': path.resolve(__dirname, 'apps/api/node_modules/ipaddr.js'),
      // @quanqn/schemas subpath exports — PRD-6 US-001 schema tests
      '@quanqn/schemas/specialist-io': path.resolve(__dirname, 'packages/schemas/src/specialist-io/index.ts'),
      '@quanqn/schemas': path.resolve(__dirname, 'packages/schemas/src/index.ts'),
      // @quanqn/ui/admin/pdf — PDF bill template (server-side only, apps/api)
      '@quanqn/ui/admin/pdf': path.resolve(__dirname, 'packages/ui/src/admin/PdfBillTemplate.tsx'),
      // @quanqn/ui/admin/forensic-pdf — forensic PDF template (server-side only, apps/api)
      '@quanqn/ui/admin/forensic-pdf': path.resolve(__dirname, 'packages/ui/src/admin/PdfForensicTemplate.tsx'),
      // @react-pdf/renderer lives in packages/ui/node_modules (installed there first)
      '@react-pdf/renderer': path.resolve(__dirname, 'packages/ui/node_modules/@react-pdf/renderer'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // pool=forks + singleFork=true: prevent DB concurrency conflicts in integration tests
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    environmentMatchGlobs: [
      // admin component tests need jsdom
      ['tests/unit/admin/*.tsx', 'jsdom'],
    ],
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
    include: [
      'tests/unit/**/*.{test.ts,test.tsx}',
      'tests/integration/**/*.test.ts',
      'apps/api/src/**/__tests__/**/*.test.ts',
    ],
    passWithNoTests: true,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
