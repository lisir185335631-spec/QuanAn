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
  ipAccounts: _t.router({
    list: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            page?: number;
            pageSize?: number;
            search?: string;
            industryFilter?: string;
            platformFilter?: string;
            levelFilter?: string;
            stageFilter?: string;
            anomalyOnly?: boolean;
            sortBy?: 'createdAt' | 'updatedAt' | 'name';
            sortDir?: 'asc' | 'desc';
          },
      )
      .query(
        (): {
          accounts: Array<{
            id: number;
            name: string;
            industry: string;
            platform: string;
            stage: string;
            frozenAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            user: { id: number; email: string; name: string | null } | null;
            evolutionProfile: { level: string; feedbackCountTotal: number; satisfactionRate: number | null } | null;
            _count: { anomalyFlags: number };
          }>;
          count: number;
          page: number;
          pageSize: number;
        } => ({ accounts: [], count: 0, page: 1, pageSize: 20 }),
      ),
    detail: _t.procedure
      .input((x: unknown) => x as { accountId: number })
      .query(
        (): {
          account: {
            id: number;
            name: string;
            industry: string;
            platform: string;
            stage: string;
            frozenAt: Date | null;
            user: { id: number; email: string; name: string | null } | null;
          } | null;
          stepData: Array<{ id: number; stepKey: string; createdAt: Date; feedback: string | null }>;
          evolutionProfile: {
            level: string;
            currentDirection: string;
            feedbackCountGood: number;
            feedbackCountBad: number;
            feedbackCountTotal: number;
            satisfactionRate: number | null;
            deepLearningCount: number;
            lastEvolvedAt: Date | null;
          } | null;
          insights: Array<{ id: number; triggerType: string; direction: string; createdAt: Date }>;
          histories: Array<{ id: number; createdAt: Date }>;
          adminNotes: Array<{ id: number; adminId: number; note: string; visibleToOtherAdmin: boolean; createdAt: Date }>;
          anomalyFlags: Array<{
            id: number;
            accountId: number;
            anomalyType: string;
            severity: string;
            evidence: Record<string, unknown>;
            detectedAt: Date;
            resolvedAt: Date | null;
            resolution: string | null;
          }>;
        } | null => null,
      ),
    flag: _t.procedure
      .input(
        (x: unknown) =>
          x as { accountId: number; anomalyType: string; severity: 'low' | 'medium' | 'high'; evidence: Record<string, unknown> },
      )
      .mutation((): { flagId: number } => ({ flagId: 0 })),
    unflag: _t.procedure
      .input(
        (x: unknown) =>
          x as { flagId: number; resolution: 'false_positive' | 'admin_action' | 'auto_resolved' },
      )
      .mutation((): { status: 'ok' } => ({ status: 'ok' })),
    addNote: _t.procedure
      .input(
        (x: unknown) =>
          x as { accountId: number; note: string; visibleToOtherAdmin?: boolean },
      )
      .mutation((): { noteId: number } => ({ noteId: 0 })),
    forceFreeze: _t.procedure
      .input((x: unknown) => x as { accountId: number; freezeReason: string })
      .mutation(
        (): { status: 'auto_executed' | 'pending'; approvalRequestId: number } => ({
          status: 'auto_executed',
          approvalRequestId: 0,
        }),
      ),
  }),
  inviteCodes: _t.router({
    list: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            page?: number;
            pageSize?: number;
            search?: string;
            statusFilter?: 'active' | 'inactive' | 'used' | 'expired';
            campaignFilter?: string;
          },
      )
      .query(
        (): {
          codes: Array<{
            id: number;
            code: string;
            isActive: boolean;
            maxUses: number;
            usedCount: number;
            expiresAt: Date | null;
            campaign: string | null;
            notes: string | null;
            createdAt: Date;
            usedAt: Date | null;
            usedById: number | null;
          }>;
          count: number;
          page: number;
          pageSize: number;
        } => ({ codes: [], count: 0, page: 1, pageSize: 20 }),
      ),
    create: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            code?: string;
            campaign?: string;
            expiresAt?: Date;
            quotaLimit?: number;
          },
      )
      .mutation(
        (): {
          id: number;
          code: string;
          isActive: boolean;
          maxUses: number;
          usedCount: number;
          expiresAt: Date | null;
          campaign: string | null;
          createdAt: Date;
        } => ({
          id: 0,
          code: '',
          isActive: true,
          maxUses: 1,
          usedCount: 0,
          expiresAt: null,
          campaign: null,
          createdAt: new Date(),
        }),
      ),
    batchImport: _t.procedure
      .input((x: unknown) => x as { csvData: string })
      .mutation(
        (): { imported: number; errors: Array<{ row: number; code: string; reason: string }> } => ({
          imported: 0,
          errors: [],
        }),
      ),
    invalidate: _t.procedure
      .input((x: unknown) => x as { code: string; reason: string })
      .mutation(
        (): { status: 'auto_executed' | 'pending'; approvalRequestId: number } => ({
          status: 'auto_executed',
          approvalRequestId: 0,
        }),
      ),
    detail: _t.procedure
      .input((x: unknown) => x as { code: string })
      .query(
        (): {
          invite: {
            id: number;
            code: string;
            isActive: boolean;
            maxUses: number;
            usedCount: number;
            expiresAt: Date | null;
            campaign: string | null;
            notes: string | null;
            createdAt: Date;
            usedAt: Date | null;
            usedById: number | null;
            createdBy: { id: number; email: string } | null;
            usedBy: { id: number; email: string; isActivated: boolean; createdAt: Date } | null;
          };
          activationHistory: Array<{
            id: number;
            userId: number | null;
            eventType: string;
            createdAt: Date;
            ipAddress: string | null;
            userAgent: string | null;
          }>;
          step9Progress: Array<{ stepKey: string; status: string; updatedAt: Date }>;
        } | null => null,
      ),
    campaignFunnel: _t.procedure
      .input((x: unknown) => x as { campaignKey: string })
      .query((): Array<{ stage: string; count: number }> => []),
  }),
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
  cost: _t.router({
    aggregate: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            startDate: Date;
            endDate: Date;
            dimension: 'user' | 'specialist' | 'model' | 'provider';
            groupBy: 'day' | 'week' | 'month';
          },
      )
      .query(
        (): {
          aggregations: Array<{
            timeBucket: Date;
            dimensionValue: string | null;
            totalCost: string;
            callCount: number;
          }>;
          totalCost: string;
        } => ({ aggregations: [], totalCost: '0' }),
      ),
    top10: _t.procedure.query(
      (): {
        userTop10: Array<{ userId: number; totalCost: string; callCount: number }>;
        accountTop10: Array<{ accountId: number; totalCost: string; callCount: number }>;
      } => ({ userTop10: [], accountTop10: [] }),
    ),
    specialistBreakdown: _t.procedure.query(
      (): Array<{
        specialistId: string | null;
        totalCost: string;
        callCount: number;
        avgCostPerCall: string;
      }> => [],
    ),
    alerts: _t.procedure.query(
      (): Array<{
        userId: number;
        email: string;
        dailySpent: string;
        threshold: string;
        severity: 'high' | 'medium' | 'low';
      }> => [],
    ),
    exportCsv: _t.procedure
      .input((x: unknown) => x as { startDate: Date; endDate: Date })
      .query((): { csv: string; rowCount: number } => ({ csv: '', rowCount: 0 })),
    exportMonthlyPdf: _t.procedure
      .input((x: unknown) => x as { month: string })
      .mutation(
        (): { filename: string; contentType: string; size: number; data: string } => ({
          filename: '',
          contentType: 'application/pdf',
          size: 0,
          data: '',
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
    byTraceId: _t.procedure
      .input((x: unknown) => x as { traceId: string })
      .query(
        (): {
          timeline: Array<{
            source: string;
            id: number;
            traceId: string;
            eventType: string;
            eventCategory: string;
            createdAt: Date;
            payload: Record<string, unknown> | null;
          }>;
          summary: { eventCount: number; spanMs: number };
        } => ({ timeline: [], summary: { eventCount: 0, spanMs: 0 } }),
      ),
    byUserId: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            userId: number;
            page?: number;
            pageSize?: number;
            eventCategory?: string;
            startDate?: Date;
            endDate?: Date;
          },
      )
      .query(
        (): {
          timeline: Array<{
            id: number;
            eventType: string;
            eventCategory: string;
            createdAt: Date;
            payload: Record<string, unknown> | null;
            traceId: string | null;
            success: boolean;
          }>;
          grouped: Record<string, unknown[]>;
          total: number;
          page: number;
          pageSize: number;
        } => ({ timeline: [], grouped: {}, total: 0, page: 1, pageSize: 50 }),
      ),
    byAdminId: _t.procedure
      .input((x: unknown) => x as { adminUserId: number })
      .query(
        (): Array<{
          id: number;
          eventType: string;
          eventCategory: string;
          createdAt: Date;
          payload: Record<string, unknown> | null;
          traceId: string | null;
          success: boolean;
          actorRole: string;
          actorMode: string | null;
          isHighRisk: boolean;
        }> => [],
      ),
    search: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            keyword: string;
            eventCategory?: string;
            startDate?: Date;
            endDate?: Date;
            target?: string;
          },
      )
      .query(
        (): Array<{
          id: number;
          eventType: string;
          eventCategory: string;
          createdAt: Date;
          traceId: string | null;
          actorAdminId: number | null;
          actorRole: string | null;
          targetUserId: number | null;
          targetEntity: string | null;
          success: boolean;
        }> => [],
      ),
    exportPdf: _t.procedure
      .input(
        (x: unknown) =>
          x as { traceId: string; caseNumber?: string; reason: string },
      )
      .mutation(
        (): { base64: string; traceId: string; caseNumber?: string; pdfHash: string; eventCount: number } => ({
          base64: '',
          traceId: '',
          caseNumber: undefined,
          pdfHash: '',
          eventCount: 0,
        }),
      ),
  }),
  config: _t.router({}),
  ab: _t.router({}),
});

export type AdminRouter = typeof _shadowAdminRouter;
