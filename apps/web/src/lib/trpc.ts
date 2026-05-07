/**
 * tRPC client for the main app — US-006
 * Uses httpBatchStreamLink with credentials:include for session cookie support.
 * AppRouter type lives in @quanqn/clients/router-types so apps/web can import it
 * via 'import type' — Vite/esbuild erases type-only imports, keeping @trpc/server
 * out of the browser bundle.
 * TD: switch to TypeScript project references in P1.
 */

import { QueryClient } from '@tanstack/react-query';
import { httpBatchStreamLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

import type { AppRouter, AuthMeOutput } from '@quanqn/clients/router-types';

export type { AuthMeOutput };
export type { AppRouter };

// ── tRPC client ───────────────────────────────────────────────────────────────

export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export const trpcClient = trpc.createClient({
  links: [
    httpBatchStreamLink({
      url: `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/trpc`,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: 'include' });
      },
    }),
  ],
});
