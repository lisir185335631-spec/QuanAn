/**
 * tRPC client for the main app — US-006
 * Uses httpBatchStreamLink with credentials:include for session cookie support.
 * Shadow router pattern: constructs AppRouter type locally to avoid cross-package rootDir issues.
 * TD: switch to TypeScript project references in P1.
 */

import { initTRPC } from '@trpc/server';
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchStreamLink } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';

// ── Shadow router type — mirrors apps/api/src/trpc/routers/_app.ts ────────────
// Kept in sync manually. Enables full end-to-end type safety without project references.

export type AuthMeOutput =
  | { ok: false; error: 'unauthenticated' }
  | { ok: true; user: { id: number; email: string; name: string } };

const _t = initTRPC.create();

const _shadowRouter = _t.router({
  auth: _t.router({
    me: _t.procedure.query((): AuthMeOutput => {
      // Never called at runtime — shadow exists for type inference only
      return { ok: false, error: 'unauthenticated' };
    }),
  }),
});

export type AppRouter = typeof _shadowRouter;

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
