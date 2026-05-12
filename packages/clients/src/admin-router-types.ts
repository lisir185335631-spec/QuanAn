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
  users: _t.router({
    list: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            page?: number;
            pageSize?: number;
            search?: string;
            roleFilter?: string;
            planFilter?: string;
            industryFilter?: string;
            sortBy?: 'createdAt' | 'lastLoginAt' | 'email' | 'name';
            sortDir?: 'asc' | 'desc';
          },
      )
      .query(
        (): {
          users: Array<{
            id: number;
            email: string;
            name: string | null;
            role: string;
            plan: string;
            industry: string | null;
            createdAt: Date;
            lastLoginAt: Date | null;
            lastLoginIp: string | null;
            isBanned: boolean;
            bannedAt: Date | null;
          }>;
          count: number;
          page: number;
          pageSize: number;
        } => ({ users: [], count: 0, page: 1, pageSize: 20 }),
      ),
    detail: _t.procedure
      .input((x: unknown) => x as { userId: number })
      .query(
        (): {
          user: {
            id: number;
            email: string;
            name: string | null;
            role: string;
            plan: string;
            industry: string | null;
            createdAt: Date;
            lastLoginAt: Date | null;
            lastLoginIp: string | null;
            isBanned: boolean;
            bannedAt: Date | null;
            ipAccounts: Array<{
              id: number;
              platformType: string;
              platformUsername: string | null;
              isActive: boolean;
              createdAt: Date;
              evolutionProfile: { currentStep: number; feedbackScore: number | null } | null;
            }>;
          } | null;
          ipAccounts: Array<{
            id: number;
            platformType: string;
            platformUsername: string | null;
            isActive: boolean;
            createdAt: Date;
          }>;
          costAggregate: { _sum: { totalTokens: number | null }; _count: { id: number } };
          auditLogs: Array<{
            id: number;
            eventType: string;
            eventCategory: string;
            createdAt: Date;
            payload: Record<string, unknown> | null;
          }>;
          stepData: Array<{
            id: number;
            stepKey: string;
            createdAt: Date;
            feedback: string | null;
          }>;
        } | null => null,
      ),
    changePlan: _t.procedure
      .input(
        (x: unknown) =>
          x as { userId: number; newPlan: string; reason: string },
      )
      .mutation(
        (): { status: 'auto_executed' | 'pending'; approvalRequestId: number } => ({
          status: 'auto_executed',
          approvalRequestId: 0,
        }),
      ),
    banUser: _t.procedure
      .input((x: unknown) => x as { userId: number; reason: string; durationDays?: number })
      .mutation(
        (): { status: 'auto_executed' | 'pending'; approvalRequestId: number } => ({
          status: 'auto_executed',
          approvalRequestId: 0,
        }),
      ),
    resetPassword: _t.procedure
      .input((x: unknown) => x as { userId: number })
      .mutation((): { status: 'ok'; tempPassword: string } => ({ status: 'ok', tempPassword: '' })),
  }),
  ipAccounts: _t.router({}),
  inviteCodes: _t.router({}),
  trending: _t.router({}),
  deepLearn: _t.router({}),
  prompts: _t.router({}),
  quota: _t.router({}),
  nsm: _t.router({
    getOverview: _t.procedure.query(
      (): {
        latest: {
          id: number;
          snapshotDate: Date;
          granularity: string;
          activeAccounts7d: number;
          step9CompleteRate: number;
          feedbackRate: number;
          evolutionUpgradeRate: number;
          d30Retention: number;
          funnelData: number[];
          industryDistribution: Record<string, number>;
          platformDistribution: Record<string, number>;
          userPersonaDistribution: Record<string, number>;
          createdAt: Date;
        };
        previous: {
          id: number;
          snapshotDate: Date;
          granularity: string;
          activeAccounts7d: number;
          step9CompleteRate: number;
          feedbackRate: number;
          evolutionUpgradeRate: number;
          d30Retention: number;
          funnelData: number[];
          industryDistribution: Record<string, number>;
          platformDistribution: Record<string, number>;
          userPersonaDistribution: Record<string, number>;
          createdAt: Date;
        } | null;
        deltas: {
          activeAccounts7d: number;
          step9CompleteRate: number;
          feedbackRate: number;
          evolutionUpgradeRate: number;
          d30Retention: number;
        } | null;
      } | null => null,
    ),
    getFunnel: _t.procedure
      .input((x: unknown) => x as { date?: string; granularity?: 'day' | 'week' | 'month' })
      .query((): number[] => []),
    getDistributions: _t.procedure.query(
      (): {
        industryDistribution: Record<string, number>;
        platformDistribution: Record<string, number>;
        userPersonaDistribution: Record<string, number>;
      } | null => null,
    ),
    getAlerts: _t.procedure.query(
      (): Array<{ metric: string; severity: 'high' | 'medium' | 'low'; deltaPct: number }> => [],
    ),
    triggerSnapshot: _t.procedure.mutation(
      (): { success: boolean; snapshotDate: Date; granularity: string } => ({
        success: true,
        snapshotDate: new Date(),
        granularity: 'day',
      }),
    ),
  }),
  evolution: _t.router({}),
  audit: _t.router({
    listMine: _t.procedure.query(
      (): Array<{
        id: number;
        eventType: string;
        eventCategory: string;
        createdAt: Date;
        payload: Record<string, unknown> | null;
      }> => [],
    ),
  }),
  config: _t.router({}),
  ab: _t.router({}),
});

export type AdminRouter = typeof _shadowAdminRouter;
