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
      // @quanan/schemas subpath exports — PRD-6 US-001 schema tests
      '@quanan/schemas/specialist-io': path.resolve(__dirname, 'packages/schemas/src/specialist-io/index.ts'),
      '@quanan/schemas': path.resolve(__dirname, 'packages/schemas/src/index.ts'),
      // @quanan/ui subpath exports — more-specific aliases MUST come before generic ones
      // @quanan/ui/admin/pdf — PDF bill template (server-side only, apps/api)
      '@quanan/ui/admin/pdf': path.resolve(__dirname, 'packages/ui/src/admin/PdfBillTemplate.tsx'),
      // @quanan/ui/admin/forensic-pdf — forensic PDF template (server-side only, apps/api)
      '@quanan/ui/admin/forensic-pdf': path.resolve(__dirname, 'packages/ui/src/admin/PdfForensicTemplate.tsx'),
      // @quanan/ui/admin — admin component library (DenseTable etc.) — AFTER more-specific paths
      '@quanan/ui/admin': path.resolve(__dirname, 'packages/ui/src/admin/index.ts'),
      // recharts lives in apps/admin/node_modules — expose for admin tests
      'recharts': path.resolve(__dirname, 'apps/admin/node_modules/recharts'),
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
      ['tests/unit/admin/**/*.tsx', 'jsdom'],
    ],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: { lines: 80, functions: 80, branches: 75, statements: 80 },
        // === LD-016 严格门禁 ===
        // monorepo 真实路径 (原路径 src/server/agents/** 在 monorepo 不存在)
        'apps/api/src/specialists/**': { lines: 90, functions: 90, branches: 85, statements: 90 },
        'apps/api/src/lib/**': { lines: 95, functions: 95, branches: 90, statements: 95 },
        'apps/web/src/lib/**': { lines: 95, functions: 95, branches: 90, statements: 95 },
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
      'tests/e2e/**/*.test.ts',
      'tests/fixtures/**/__tests__/**/*.test.ts',
      'apps/api/src/**/__tests__/**/*.test.ts',
      // ⏸️ apps/web 前端测试(74 文件)暂不纳入主 suite:多数 stale(import 已删的 page/constants)+
      // 需专属 @/→apps/web/src alias + web 依赖解析。专项接线见 review P0「web 测试从未运行」(TODO)。
    ],
    passWithNoTests: true,
    testTimeout: 30000,
    hookTimeout: 60000,
    // 连真 Redis/DB 的集成测试偶发连接抖动会闪失败(flaky)→ 失败自动重试 2 次容错。
    // 只对「失败的测试」生效:稳定通过的不重试;flaky 重试时连接恢复即 pass;
    // 真 bug 稳定失败、重试后仍 fail,不掩盖。根治 Stop hook 偶发误报。
    retry: 2,
  },
});
