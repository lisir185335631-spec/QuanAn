// PRD-10 US-002 · AdminRouter type mirror for apps/admin tRPC client
// Shadow router pattern (same as router-types.ts) — keeps @trpc/server out of browser bundle.

import { initTRPC } from '@trpc/server';

const _t = initTRPC.create();

const _shadowAdminRouter = _t.router({
  health: _t.procedure.query(
    (): { ok: boolean; service: string; version: string } => ({
      ok: true,
      service: 'admin',
      version: '0.1.0',
    }),
  ),
  auth: _t.router({
    login: _t.procedure
      .input((x: unknown) => x as { email: string })
      .mutation(
        (): { sessionId: string; user: { id: number; email: string; role: string } } => ({
          sessionId: '',
          user: { id: 0, email: '', role: '' },
        }),
      ),
    logout: _t.procedure.mutation((): { ok: boolean } => ({ ok: true })),
    me: _t.procedure.query(
      (): { id: number; email: string; role: string; sessionId: string } => ({
        id: 0,
        email: '',
        role: '',
        sessionId: '',
      }),
    ),
  }),
  users: _t.router({}),
  ipAccounts: _t.router({}),
  inviteCodes: _t.router({}),
  trending: _t.router({}),
  deepLearn: _t.router({}),
  prompts: _t.router({}),
  quota: _t.router({}),
  nsm: _t.router({}),
  evolution: _t.router({}),
  audit: _t.router({}),
  config: _t.router({}),
  ab: _t.router({}),
});

export type AdminRouter = typeof _shadowAdminRouter;
