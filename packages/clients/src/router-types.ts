/**
 * Shared AppRouter type for tRPC client packages — US-006
 * Lives here so apps/web can import it via 'import type' and keep @trpc/server
 * out of the browser bundle. Mirrors apps/api/src/trpc/routers/_app.ts.
 * PRD-3 US-001: removed step/account alias shadow routes (TD-012).
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

export type IpAccountOutput = {
  id: number;
  name: string;
  industry: string;
  platform: string;
  stage: string;
  isActive: boolean;
  followersRange: string;
} | null;

export type StepDataOutput = {
  stepKey: string;
  inputs: Record<string, unknown>;
  result: Record<string, unknown> | null;
  version: number;
  updatedAt: string;
} | null;

export type StepProgressOutput = {
  completed: number;
  total: number;
  completedKeys: string[];
};

export type IpAccountSwitchOutput = { ok: boolean; activeAccountId: number };
export type IpAccountListOutput = NonNullable<IpAccountOutput>[];
export type StepDataListOutput = NonNullable<StepDataOutput>[];

const _t = initTRPC.create();

// Shadow router — never invoked; exists solely for type inference.
const _shadowRouter = _t.router({
  auth: _t.router({
    me: _t.procedure.query((): AuthMeOutput => {
      return { ok: false, error: 'unauthenticated' };
    }),
  }),
  evolution: _t.router({
    getProfile: _t.procedure.query((): EvolutionProfileOutput => null),
  }),
  ipAccounts: _t.router({
    list: _t.procedure.query((): IpAccountListOutput => []),
    active: _t.procedure.query((): ActiveAccountOutput => null),
    create: _t.procedure
      .input((x: unknown) => x as { name: string; industry: string; platform: string; stage: string })
      .mutation((): NonNullable<IpAccountOutput> => ({
        id: 0,
        name: '',
        industry: '',
        platform: '',
        stage: '',
        isActive: true,
        followersRange: '0-1000',
      })),
    update: _t.procedure
      .input((x: unknown) => x as Partial<{ name: string; industry: string; platform: string; stage: string }>)
      .mutation((): NonNullable<IpAccountOutput> => ({
        id: 0,
        name: '',
        industry: '',
        platform: '',
        stage: '',
        isActive: true,
        followersRange: '0-1000',
      })),
    delete: _t.procedure
      .input((x: unknown) => x as { accountId: number })
      .mutation((): { ok: boolean } => ({ ok: true })),
    switchActive: _t.procedure
      .input((x: unknown) => x as SwitchActiveInput)
      .mutation((): IpAccountSwitchOutput => ({ ok: true, activeAccountId: 0 })),
  }),
  stepData: _t.router({
    get: _t.procedure
      .input((x: unknown) => x as { stepKey: string })
      .query((): StepDataOutput => null),
    getAll: _t.procedure.query((): NonNullable<StepDataOutput>[] => []),
    save: _t.procedure
      .input((x: unknown) => x as SaveStepDataInput)
      .mutation((): { ok: boolean; data: NonNullable<StepDataOutput> } => ({
        ok: true,
        data: { stepKey: '', inputs: {}, result: null, version: 0, updatedAt: '' },
      })),
    progress: _t.procedure.query((): StepProgressOutput => ({
      completed: 0,
      total: 9,
      completedKeys: [],
    })),
  }),
});

export type AppRouter = typeof _shadowRouter;
