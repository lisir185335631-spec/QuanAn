/**
 * Shared AppRouter type for tRPC client packages — US-006
 * Lives here so apps/web can import it via 'import type' and keep @trpc/server
 * out of the browser bundle. Mirrors apps/api/src/trpc/routers/_app.ts.
 * TD: replace with TypeScript project references in P1.
 */

import { initTRPC } from '@trpc/server';

export type AuthMeOutput =
  | { ok: false; error: 'unauthenticated' }
  | { ok: true; user: { id: number; email: string; name: string } };

const _t = initTRPC.create();

// Shadow router — never invoked; exists solely for type inference.
const _shadowRouter = _t.router({
  auth: _t.router({
    me: _t.procedure.query((): AuthMeOutput => {
      return { ok: false, error: 'unauthenticated' };
    }),
  }),
});

export type AppRouter = typeof _shadowRouter;
