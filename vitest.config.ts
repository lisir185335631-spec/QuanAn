import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
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
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
