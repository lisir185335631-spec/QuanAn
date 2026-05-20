import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist-admin',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // p0-core: nsm + users + accounts + cost + audit + invites
          if (
            id.includes('/pages/nsm/') ||
            id.includes('/pages/users/') ||
            id.includes('/pages/accounts/') ||
            id.includes('/pages/cost/') ||
            id.includes('/pages/audit/') ||
            id.includes('/pages/invites/')
          ) {
            return 'p0-core';
          }
          // p0-review: reviewTrending + reviewDeepLearn
          if (id.includes('/pages/reviewTrending/') || id.includes('/pages/reviewDeepLearn/')) {
            return 'p0-review';
          }
          // p1-health: evolutionHealth + prompts + quota + compliance + approvals
          if (
            id.includes('/pages/evolutionHealth/') ||
            id.includes('/pages/prompts/') ||
            id.includes('/pages/quota/') ||
            id.includes('/pages/compliance/') ||
            id.includes('/pages/approvals/')
          ) {
            return 'p1-health';
          }
          // p2-advanced: abExperiments + constants + featureFlags + admin/placeholder/knowledge
          if (
            id.includes('/pages/abExperiments/') ||
            id.includes('/pages/constants/') ||
            id.includes('/pages/featureFlags/') ||
            id.includes('/pages/admin/')
          ) {
            return 'p2-advanced';
          }
        },
      },
    },
  },
  server: {
    port: 5174,
  },
});
