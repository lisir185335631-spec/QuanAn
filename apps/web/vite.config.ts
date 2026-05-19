import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@quanan/schemas': path.resolve(__dirname, '../../packages/schemas/src'),
      '@quanan/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@quanan/clients': path.resolve(__dirname, '../../packages/clients/src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api/trpc': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          trpc: ['@trpc/client', '@trpc/react-query', '@tanstack/react-query'],
          ui: ['lucide-react', 'tailwind-merge', 'clsx'],
        },
      },
    },
  },
});
