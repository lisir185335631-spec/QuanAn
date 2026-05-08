/**
 * Shared AppRouter type for tRPC client packages — US-006
 * Lives here so apps/web can import it via 'import type' and keep @trpc/server
 * out of the browser bundle. Mirrors apps/api/src/trpc/routers/_app.ts.
 * PRD-2 US-002: adds step, evolution, account shadow routes.
 * TD: replace with TypeScript project references in P1.
 */

import { initTRPC } from '@trpc/server';

export type AuthMeOutput =
  | { ok: false; error: 'unauthenticated' }
  | { ok: true; user: { id: number; email: string; name: string } };

export type ActiveAccountOutput = {
  id: number;
  name: string;
  platform: string;
  stage: string;
  industry: string;
  followersRange: string;
} | null;

export type EvolutionProfileOutput = {
  id: number;
  level: string;
  feedbackCountGood: number;
  feedbackCountBad: number;
  feedbackCountTotal: number;
  satisfactionRate: number | null;
  currentDirection: string;
  autoEvolutionEnabled: boolean;
  deepLearningCount: number;
  lastEvolvedAt: string | null;
  lastUpgradedAt: string | null;
  updatedAt: string;
} | null;

export type SaveStepDataInput = { stepKey: string; inputs: Record<string, unknown> };
export type SwitchActiveInput = { accountId: number };

const _t = initTRPC.create();

// Shadow router — never invoked; exists solely for type inference.
const _shadowRouter = _t.router({
  auth: _t.router({
    me: _t.procedure.query((): AuthMeOutput => {
      return { ok: false, error: 'unauthenticated' };
    }),
  }),
  step: _t.router({
    saveStepData: _t.procedure
      .input((x: unknown) => x as SaveStepDataInput)
      .mutation((): { ok: boolean } => ({ ok: true })),
  }),
  evolution: _t.router({
    getProfile: _t.procedure.query((): EvolutionProfileOutput => null),
  }),
  account: _t.router({
    getActive: _t.procedure.query((): ActiveAccountOutput => null),
    switchActive: _t.procedure
      .input((x: unknown) => x as SwitchActiveInput)
      .mutation((): { ok: boolean } => ({ ok: true })),
  }),
});

export type AppRouter = typeof _shadowRouter;
