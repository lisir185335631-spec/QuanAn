/**
 * tRPC client for the main app — US-006
 * US-007: injects X-Trace-Id header on every fetch for end-to-end trace propagation.
 * PRD-19 US-005: splitLink routes subscriptions to httpSubscriptionLink (SSE).
 * AppRouter type lives in @quanqn/clients/router-types so apps/web can import it
 * via 'import type' — Vite/esbuild erases type-only imports, keeping @trpc/server
 * out of the browser bundle.
 * TD: switch to TypeScript project references in P1.
 */

import { QueryClient } from '@tanstack/react-query';
import { httpBatchStreamLink, httpSubscriptionLink, splitLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

import type { AppRouter, AuthMeOutput } from '@quanqn/clients/router-types';

export type { AuthMeOutput };
export type { AppRouter };

// ── Trace ID generator ────────────────────────────────────────────────────────
// Generates a 16-char random hex string per request (AC-6, US-007).
function genTraceId(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint8Array(8);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2, 18).padEnd(16, '0');
}

// ── tRPC client ───────────────────────────────────────────────────────────────

export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

const TRPC_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/trpc`;

export const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: httpSubscriptionLink({
        url: TRPC_URL,
      }),
      false: httpBatchStreamLink({
        url: TRPC_URL,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
              ...(options?.headers as Record<string, string> | undefined),
              'x-trace-id': genTraceId(),
            },
          });
        },
      }),
    }),
  ],
});
