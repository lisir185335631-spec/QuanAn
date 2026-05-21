import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@quanan/schemas': path.resolve(__dirname, '../../packages/schemas/src'),
      '@quanan/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@quanan/clients': path.resolve(__dirname, '../../packages/clients/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    passWithNoTests: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
