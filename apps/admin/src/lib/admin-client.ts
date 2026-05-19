// PRD-10 US-002 · admin tRPC client
// AC-8: createTRPCReact<AdminRouter>() · httpBatchLink /trpc/admin

import { QueryClient } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

import type { AdminRouter } from '@quanan/clients/admin-router-types';

export const adminTrpc = createTRPCReact<AdminRouter>();

export const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export const adminTrpcClient = adminTrpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/trpc/admin`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        });
      },
    }),
  ],
});
