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
      (): { id: number; email: string; role: string; allowedDomains: string[]; sessionId: string } => ({
        id: 0,
        email: '',
        role: '',
        allowedDomains: [],
        sessionId: '',
      }),
    ),
    logPageView: _t.procedure
      .input((x: unknown) => x as { path: string })
      .mutation((): { ok: boolean } => ({ ok: true })),
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
  reviewTrending: _t.router({
    list: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            page?: number;
            pageSize?: number;
            statusFilter?: 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'auto_rejected';
            platformFilter?: string;
            dateRange?: { from?: Date; to?: Date };
            autoVerdictFilter?: 'auto_approved' | 'auto_rejected' | 'needs_review';
          },
      )
      .query(
        (): {
          items: Array<{
            id: number;
            sourcePlatform: string;
            sourceItemId: string;
            sourceUrl: string;
            autoVerdict: string;
            status: string;
            reviewerAdminId: number | null;
            reviewedAt: Date | null;
            rejectReason: string | null;
            trendingItemId: number | null;
            fetchedAt: Date;
          }>;
          count: number;
          page: number;
          pageSize: number;
        } => ({ items: [], count: 0, page: 1, pageSize: 20 }),
      ),
    detail: _t.procedure
      .input((x: unknown) => x as { queueId: number })
      .query(
        (): {
          id: number;
          sourcePlatform: string;
          sourceItemId: string;
          sourceUrl: string;
          rawContent: unknown;
          fetchedAt: Date;
          autoScanResult: unknown;
          autoVerdict: string;
          status: string;
          reviewerAdminId: number | null;
          reviewedAt: Date | null;
          rejectReason: string | null;
          trendingItemId: number | null;
        } => ({
          id: 0,
          sourcePlatform: '',
          sourceItemId: '',
          sourceUrl: '',
          rawContent: {},
          fetchedAt: new Date(),
          autoScanResult: {},
          autoVerdict: '',
          status: '',
          reviewerAdminId: null,
          reviewedAt: null,
          rejectReason: null,
          trendingItemId: null,
        }),
      ),
    approve: _t.procedure
      .input((x: unknown) => x as { queueId: number; vendor?: string })
      .mutation((): { queueId: number; trendingItemId: number } => ({ queueId: 0, trendingItemId: 0 })),
    reject: _t.procedure
      .input((x: unknown) => x as { queueId: number; rejectReason: string })
      .mutation((): { queueId: number; status: 'rejected' } => ({ queueId: 0, status: 'rejected' })),
    batchAction: _t.procedure
      .input((x: unknown) => x as { queueIds: number[]; action: 'approve' | 'reject'; reason?: string })
      .mutation(
        (): {
          results: Array<{ queueId: number; success: boolean; error?: string }>;
          total: number;
          succeeded: number;
        } => ({ results: [], total: 0, succeeded: 0 }),
      ),
    configRules: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            ruleType: 'banned_word' | 'sampling_rate' | 'industry_quota';
            ruleKey: string;
            ruleValue: Record<string, unknown>;
            enabled?: boolean;
          },
      )
      .mutation((): { id: number; ruleType: string; ruleKey: string; enabled: boolean } => ({
        id: 0,
        ruleType: '',
        ruleKey: '',
        enabled: true,
      })),
  }),
  reviewDeepLearn: _t.router({
    list: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            page?: number;
            pageSize?: number;
            statusFilter?: 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'auto_rejected';
            userIdFilter?: number;
            autoVerdictFilter?: 'auto_approved' | 'auto_rejected' | 'needs_review';
            dateRange?: { from?: Date; to?: Date };
          },
      )
      .query(
        (): {
          items: Array<{
            id: number;
            userId: number;
            accountId: number;
            fileName: string;
            fileMime: string;
            fileSize: number;
            autoVerdict: string;
            status: string;
            reviewerAdminId: number | null;
            reviewedAt: Date | null;
            rejectReason: string | null;
            archiveId: number | null;
            uploadedAt: Date;
          }>;
          count: number;
          page: number;
          pageSize: number;
        } => ({ items: [], count: 0, page: 1, pageSize: 20 }),
      ),
    detail: _t.procedure
      .input((x: unknown) => x as { queueId: number })
      .query(
        (): {
          id: number;
          userId: number;
          accountId: number;
          fileName: string;
          fileMime: string;
          fileSize: number;
          fileUrl: string;
          uploadedAt: Date;
          autoScanResult: unknown;
          autoVerdict: string;
          status: string;
          reviewerAdminId: number | null;
          reviewedAt: Date | null;
          rejectReason: string | null;
          archiveId: number | null;
          textPreview: string;
          userViolationCount: number;
          userViolations: Array<{
            violationType: string;
            count: number;
            lastViolationAt: Date;
            suspendedAt: Date | null;
          }>;
        } => ({
          id: 0, userId: 0, accountId: 0, fileName: '', fileMime: '',
          fileSize: 0, fileUrl: '', uploadedAt: new Date(), autoScanResult: {},
          autoVerdict: '', status: '', reviewerAdminId: null, reviewedAt: null,
          rejectReason: null, archiveId: null, textPreview: '', userViolationCount: 0,
          userViolations: [],
        }),
      ),
    approve: _t.procedure
      .input((x: unknown) => x as { queueId: number })
      .mutation((): { queueId: number; archiveId: number } => ({ queueId: 0, archiveId: 0 })),
    reject: _t.procedure
      .input((x: unknown) => x as { queueId: number; rejectReason: string })
      .mutation(
        (): { queueId: number; status: 'rejected'; violationCount: number } => ({
          queueId: 0,
          status: 'rejected',
          violationCount: 0,
        }),
      ),
    banUploader: _t.procedure
      .input((x: unknown) => x as { userId: number; reason: string })
      .mutation(
        (): { status: 'auto_executed' | 'pending'; approvalRequestId: number } => ({
          status: 'pending',
          approvalRequestId: 0,
        }),
      ),
    userViolations: _t.procedure
      .input((x: unknown) => x as { userId?: number })
      .query(
        (): {
          violations: Array<{
            id: number;
            userId: number;
            violationType: string;
            count: number;
            lastViolationAt: Date;
            lastReviewItemId: number | null;
            warningCount: number;
            suspendedAt: Date | null;
            suspendedByAdminId: number | null;
            suspendedReason: string | null;
          }>;
          total: number;
        } => ({ violations: [], total: 0 }),
      ),
  }),
  prompts: _t.router({
    getActiveVersion: _t.procedure
      .input((x: unknown) => x as { specialistId: string; mode?: string })
      .query(
        (): {
          version: {
            id: number;
            specialistId: string;
            mode: string;
            version: number;
            content: string;
            contentHash: string;
            status: string;
            judgeScore: string | null;
            createdByAdminId: number;
            createdAt: Date;
            approvedByAdminId: number | null;
            approvedAt: Date | null;
          } | null;
          canaryConfig: {
            id: number;
            specialistId: string;
            mode: string;
            currentVersionId: number;
            nextVersionId: number | null;
            canaryPct: number;
            strategy: string;
            updatedByAdminId: number;
            updatedAt: Date;
          } | null;
        } => ({ version: null, canaryConfig: null }),
      ),
    listVersions: _t.procedure
      .input((x: unknown) => x as { specialistId: string; mode?: string; limit?: number })
      .query(
        (): {
          versions: Array<{
            id: number;
            specialistId: string;
            mode: string;
            version: number;
            content: string;
            contentHash: string;
            status: string;
            judgeScore: string | null;
            createdByAdminId: number;
            createdAt: Date;
            approvedByAdminId: number | null;
            approvedAt: Date | null;
          }>;
        } => ({ versions: [] }),
      ),
    saveDraft: _t.procedure
      .input((x: unknown) => x as { specialistId: string; mode?: string; content: string })
      .mutation(
        (): {
          version: {
            id: number;
            specialistId: string;
            mode: string;
            version: number;
            content: string;
            contentHash: string;
            status: string;
            judgeScore: string | null;
            createdByAdminId: number;
            createdAt: Date;
            approvedByAdminId: number | null;
            approvedAt: Date | null;
          };
        } => ({
          version: {
            id: 0,
            specialistId: '',
            mode: 'default',
            version: 0,
            content: '',
            contentHash: '',
            status: 'draft',
            judgeScore: null,
            createdByAdminId: 0,
            createdAt: new Date(),
            approvedByAdminId: null,
            approvedAt: null,
          },
        }),
      ),
    submitForReview: _t.procedure
      .input((x: unknown) => x as { versionId: number })
      .mutation((): { approvalRequestId: number } => ({ approvalRequestId: 0 })),
    rollbackVersion: _t.procedure
      .input((x: unknown) => x as { specialistId: string; mode?: string })
      .mutation((): { approvalRequestId: number } => ({ approvalRequestId: 0 })),
    updateCanary: _t.procedure
      .input((x: unknown) => x as { specialistId: string; mode?: string; canaryPct: number })
      .mutation(
        (): { canaryPct: number | null; approvalRequestId: number | null } => ({
          canaryPct: null,
          approvalRequestId: null,
        }),
      ),
    rollback: _t.procedure
      .input((x: unknown) => x as { specialistId: string; mode?: string; reason: string })
      .mutation((): { approvalRequestId: number } => ({ approvalRequestId: 0 })),
    runLlmJudge: _t.procedure
      .input((x: unknown) => x as { versionId: number; isMock?: boolean })
      .mutation(
        (): { score: number; isMock: boolean; runAt: Date } => ({
          score: 0,
          isMock: true,
          runAt: new Date(),
        }),
      ),
  }),
  quota: _t.router({
    getQuotaOverview: _t.procedure.query(
      (): { free: number; pro: number; enterprise: number; activeWhitelist: number; total: number } => ({
        free: 0, pro: 0, enterprise: 0, activeWhitelist: 0, total: 0,
      }),
    ),
    getUsageStats: _t.procedure
      .input((x: unknown) => x as { anomalyThreshold?: number })
      .query(
        (): {
          plans: Array<{ plan: string; count: number; avgUsagePct: number }>;
          anomalousCount: number;
        } => ({ plans: [], anomalousCount: 0 }),
      ),
    getHourlyTrend: _t.procedure.query(
      (): Array<{ hour: string; plan: string; callCount: number }> => [],
    ),
    listAnomalousUsers: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            cursor?: number;
            limit?: number;
            plan?: 'free' | 'pro' | 'enterprise';
            usageThreshold?: number;
            status?: 'all' | 'whitelisted' | 'normal';
          },
      )
      .query(
        (): {
          items: Array<{
            id: number;
            userId: number;
            email: string;
            plan: string;
            dailyUsed: number;
            dailyQuota: number;
            usagePct: number;
            isOnWhitelist: boolean;
            whitelistExpiresAt: Date | null;
            lastCallAt: Date | null;
            createdAt: Date | null;
          }>;
          nextCursor: number | undefined;
        } => ({ items: [], nextCursor: undefined }),
      ),
    getUserHourlyTimeline: _t.procedure
      .input((x: unknown) => x as { userId: number })
      .query((): Array<{ hour: number; callCount: number }> => []),
    listUserQuotas: _t.procedure
      .input(
        (x: unknown) =>
          x as { cursor?: number; limit?: number; plan?: string; search?: string },
      )
      .query((): { items: unknown[]; nextCursor: number | undefined } => ({
        items: [],
        nextCursor: undefined,
      })),
    getUserDetail: _t.procedure
      .input((x: unknown) => x as { userId: number; timelineDays?: number })
      .query(
        (): {
          quota: {
            id: number; userId: number; plan: string;
            dailyQuota: number; dailyUsed: number; monthlyQuota: number; monthlyUsed: number;
            isOnWhitelist: boolean; whitelistExpiresAt: Date | null; updatedAt: Date;
            adjustments: unknown[];
          };
          timeline: Array<{ date: string; callCount: number; costUsd: number }>;
        } => ({
          quota: {
            id: 0, userId: 0, plan: 'free', dailyQuota: 0, dailyUsed: 0,
            monthlyQuota: 0, monthlyUsed: 0, isOnWhitelist: false,
            whitelistExpiresAt: null, updatedAt: new Date(), adjustments: [],
          },
          timeline: [],
        }),
      ),
    adjustQuota: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            userId: number;
            adjustmentType: 'increase_daily' | 'increase_monthly' | 'whitelist_add';
            delta: number;
            reason: string;
          },
      )
      .mutation(
        (): { adjustmentLogId?: number; approvalRequestId?: number; needsApproval: boolean } => ({
          needsApproval: false,
        }),
      ),
    listAdjustmentLog: _t.procedure
      .input(
        (x: unknown) =>
          x as { userId?: number; adminId?: number; cursor?: number; limit?: number },
      )
      .query((): { items: unknown[]; nextCursor: number | undefined } => ({
        items: [],
        nextCursor: undefined,
      })),
    getActiveAdjustments: _t.procedure
      .input((x: unknown) => x as { userId?: number })
      .query(
        (): Array<{
          id: number; userId: number; adminId: number; field: string;
          delta: number | null; reason: string; expiresAt: Date; isExpired: boolean;
          expiredAt: Date | null; createdAt: Date;
        }> => [],
      ),
    getExpiredAdjustments: _t.procedure
      .input((x: unknown) => x as { userId?: number })
      .query(
        (): Array<{
          id: number; userId: number; adminId: number; field: string;
          delta: number | null; reason: string; expiresAt: Date; isExpired: boolean;
          expiredAt: Date | null; createdAt: Date;
        }> => [],
      ),
  }),
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
  evolution: _t.router({
    getLDistribution: _t.procedure
      .input((x: unknown) => x as { industryFilter?: string } | undefined)
      .query(
        (): { L1: number; L2: number; L3: number; L4: number; L5: number } => ({
          L1: 0, L2: 0, L3: 0, L4: 0, L5: 0,
        }),
      ),
    getFlywheelHealth: _t.procedure.query(
      (): { stalledCount: number; conflictCount: number; healthyCount: number; status: 'green' | 'yellow' | 'red' } => ({
        stalledCount: 0, conflictCount: 0, healthyCount: 0, status: 'green',
      }),
    ),
    listAnomalies: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            cursor?: number;
            limit?: number;
            anomalyType?: 'conflicting_insights' | 'frequent_style_flip' | 'avoidlist_overflow' | 'flywheel_stalled' | 'negative_feedback_dominant';
            resolved?: boolean;
          },
      )
      .query(
        (): {
          items: Array<{
            id: number;
            accountId: number;
            anomalyType: string;
            severity: string;
            evidence: unknown;
            detectedAt: Date;
            resolvedAt: Date | null;
            resolution: string | null;
            resolvedByAdminId: number | null;
          }>;
          nextCursor: number | undefined;
        } => ({ items: [], nextCursor: undefined }),
      ),
    getAccountTimeline: _t.procedure
      .input((x: unknown) => x as { accountId: number })
      .query(
        (): {
          profile: {
            level: string;
            satisfactionRate: number | null;
            feedbackCountTotal: number;
            lastEvolvedAt: Date | null;
            autoEvolutionEnabled: boolean;
          } | null;
          insights: Array<{
            id: number;
            triggerType: string;
            direction: string;
            levelBefore: string | null;
            levelAfter: string | null;
            isFallback: boolean;
            createdAt: Date;
          }>;
          anomalyFlags: Array<{
            id: number;
            anomalyType: string;
            severity: string;
            evidence: unknown;
            detectedAt: Date;
            resolvedAt: Date | null;
            resolution: string | null;
          }>;
        } => ({ profile: null, insights: [], anomalyFlags: [] }),
      ),
    forceRebuildEvolution: _t.procedure
      .input((x: unknown) => x as { accountId: number; reason: string })
      .mutation((): { approvalRequestId: number } => ({ approvalRequestId: 0 })),
    markAnomalyResolved: _t.procedure
      .input((x: unknown) => x as { flagId: number; resolution: 'admin_action' | 'false_positive' })
      .mutation(
        (): { id: number; resolvedAt: Date | null; resolution: string | null } => ({
          id: 0, resolvedAt: null, resolution: null,
        }),
      ),
    getAnomalyStats: _t.procedure.query(
      (): { byType: Record<string, number>; bySeverity: Record<string, number>; last24h: number; last7d: number } => ({
        byType: {}, bySeverity: {}, last24h: 0, last7d: 0,
      }),
    ),
  }),
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
  compliance: _t.router({
    getKpiStats: _t.procedure.query(
      (): {
        todayDisclaimerCount: number;
        disclaimerByIndustry: Array<{ industry: string; count: number }>;
        bannedWordCount: number;
        bannedWordTrend: Array<{ date: string; count: number }>;
        piiHitRate: number;
        piiCount: number;
        totalParsed: number;
        piiTrend: Array<{ date: string; piiCount: number; totalCount: number; rate: number }>;
        industryTop5: Array<{ industry: string; count: number }>;
      } => ({
        todayDisclaimerCount: 0,
        disclaimerByIndustry: [],
        bannedWordCount: 0,
        bannedWordTrend: [],
        piiHitRate: 0,
        piiCount: 0,
        totalParsed: 0,
        piiTrend: [],
        industryTop5: [],
      }),
    ),
    getIndustryBreakdown: _t.procedure
      .input((x: unknown) => x as { startDate?: Date; endDate?: Date } | undefined)
      .query(
        (): {
          all: Array<{ industry: string; count: number }>;
          pieData: Array<{ industry: string; count: number }>;
        } => ({ all: [], pieData: [] }),
      ),
    getTrend: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            groupBy?: 'day' | 'week' | 'month';
            industries?: string[];
            startDate?: Date;
            endDate?: Date;
          },
      )
      .query(
        (): Array<{ date: string; industry: string | null; count: number }> => [],
      ),
    listEvents: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            cursor?: number;
            limit?: number;
            grouping?: 'none' | 'eventType' | 'industry';
            industryFilter?: string;
            eventTypeFilter?: 'pii_redacted' | 'banned_word_hit' | 'industry_disclaimer_triggered';
            startDate?: Date;
            endDate?: Date;
          },
      )
      .query(
        (): {
          items: Array<{
            id: number;
            eventCategory: string;
            eventType: string;
            userId: string | null;
            targetUserId: number | null;
            industry: string | null;
            createdAt: Date;
            payloadSummary: string;
            success: boolean;
          }>;
          nextCursor: number | undefined;
          grouped: Record<string, unknown[]> | undefined;
        } => ({ items: [], nextCursor: undefined, grouped: undefined }),
      ),
  }),
  approvals: _t.router({
    getKpiStats: _t.procedure.query(
      (): {
        pendingCount: number;
        avgDecisionTimeHours: number | null;
        rejectionRate: number;
        emergencySlaRate: number;
      } => ({ pendingCount: 0, avgDecisionTimeHours: null, rejectionRate: 0, emergencySlaRate: 100 }),
    ),
    listPending: _t.procedure
      .input(
        (x: unknown) =>
          x as { cursor?: number; limit?: number },
      )
      .query(
        (): {
          items: Array<{
            id: number;
            requesterAdminId: number;
            requesterEmail: string | null;
            actionType: string;
            actionPayload: unknown;
            riskLevel: string;
            requireDualApproval: boolean;
            emergencyMode: boolean;
            emergencyIncidentId: string | null;
            postReviewRequired: boolean;
            postReviewedAt: Date | null;
            postReviewResult: string | null;
            postReviewerAdminId: number | null;
            status: string;
            displayStatus: string;
            approverAdminId: number | null;
            firstApproverEmail: string | null;
            secondApproverEmail: string | null;
            decisionReason: string | null;
            secondApproverAdminId: number | null;
            secondApprovedAt: Date | null;
            secondDecisionReason: string | null;
            requesterReason: string;
            createdAt: Date;
            expiresAt: Date;
            decidedAt: Date | null;
          }>;
          nextCursor: number | undefined;
        } => ({ items: [], nextCursor: undefined }),
      ),
    listDecided: _t.procedure
      .input(
        (x: unknown) =>
          x as { cursor?: number; limit?: number },
      )
      .query(
        (): {
          items: Array<{
            id: number;
            requesterAdminId: number;
            requesterEmail: string | null;
            actionType: string;
            actionPayload: unknown;
            riskLevel: string;
            requireDualApproval: boolean;
            emergencyMode: boolean;
            emergencyIncidentId: string | null;
            postReviewRequired: boolean;
            postReviewedAt: Date | null;
            postReviewResult: string | null;
            postReviewerAdminId: number | null;
            status: string;
            displayStatus: string;
            approverAdminId: number | null;
            firstApproverEmail: string | null;
            secondApproverEmail: string | null;
            decisionReason: string | null;
            secondApproverAdminId: number | null;
            secondApprovedAt: Date | null;
            secondDecisionReason: string | null;
            requesterReason: string;
            createdAt: Date;
            expiresAt: Date;
            decidedAt: Date | null;
          }>;
          nextCursor: number | undefined;
        } => ({ items: [], nextCursor: undefined }),
      ),
    listPostReview: _t.procedure.query(
      (): Array<{
        id: number;
        requesterAdminId: number;
        requesterEmail: string | null;
        actionType: string;
        actionPayload: unknown;
        riskLevel: string;
        requireDualApproval: boolean;
        emergencyMode: boolean;
        emergencyIncidentId: string | null;
        postReviewRequired: boolean;
        postReviewedAt: Date | null;
        postReviewResult: string | null;
        postReviewerAdminId: number | null;
        status: string;
        displayStatus: string;
        approverAdminId: number | null;
        firstApproverEmail: string | null;
        secondApproverEmail: string | null;
        decisionReason: string | null;
        secondApproverAdminId: number | null;
        secondApprovedAt: Date | null;
        secondDecisionReason: string | null;
        requesterReason: string;
        createdAt: Date;
        expiresAt: Date;
        decidedAt: Date | null;
      }> => [],
    ),
    getHistoricalDecisions: _t.procedure
      .input(
        (x: unknown) =>
          x as { actionType: string; excludeId?: number },
      )
      .query(
        (): Array<{
          id: number;
          status: string;
          decisionReason: string | null;
          decidedAt: Date | null;
          approverAdminId: number | null;
          riskLevel: string;
          approverEmail: string | null;
        }> => [],
      ),
    approveRequest: _t.procedure
      .input(
        (x: unknown) =>
          x as { requestId: number; decisionReason: string },
      )
      .mutation((): { ok: boolean; displayStatus: string } => ({ ok: true, displayStatus: 'approved' })),
    rejectRequest: _t.procedure
      .input(
        (x: unknown) =>
          x as { requestId: number; decisionReason: string },
      )
      .mutation((): { ok: boolean } => ({ ok: true })),
    emergencyApprove: _t.procedure
      .input(
        (x: unknown) =>
          x as { requestId: number; incidentId: string; decisionReason: string },
      )
      .mutation((): { ok: boolean; id: number } => ({ ok: true, id: 0 })),
    postReviewApprove: _t.procedure
      .input(
        (x: unknown) =>
          x as { requestId: number; result: 'confirmed' | 'overturned' | 'partial'; reviewNote?: string },
      )
      .mutation((): { ok: boolean } => ({ ok: true })),
  }),
  abExperiments: _t.router({
    getKpiStats: _t.procedure.query(
      (): { runningCount: number; recentStarted: number; avgSampleSize: number; autoStopRate: number } => ({
        runningCount: 0,
        recentStarted: 0,
        avgSampleSize: 0,
        autoStopRate: 0,
      }),
    ),
    list: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            cursor?: number;
            status?: 'draft' | 'running' | 'stopped' | 'completed';
            createdByAdminId?: number;
            startDateFrom?: Date;
            startDateTo?: Date;
          },
      )
      .query(
        (): {
          items: Array<{
            id: number;
            experimentKey: string;
            name: string;
            status: string;
            variantCount: number;
            sampleSize: number;
            startedAt: Date | null;
            stoppedAt: Date | null;
            createdAt: Date;
            trafficAllocation: Record<string, number> | null;
          }>;
          nextCursor: number | undefined;
        } => ({ items: [], nextCursor: undefined }),
      ),
    getDetail: _t.procedure
      .input((x: unknown) => x as { experimentId: number })
      .query(
        (): {
          id: number;
          experimentKey: string;
          name: string;
          description: string | null;
          status: string;
          variantConfig: unknown;
          trafficAllocation: unknown;
          startedAt: Date | null;
          stoppedAt: Date | null;
          resultSummary: unknown;
          createdAt: Date;
          sampleSize: number;
          timeline: Array<{ day: Date; count: number }>;
        } => ({
          id: 0,
          experimentKey: '',
          name: '',
          description: null,
          status: 'draft',
          variantConfig: {},
          trafficAllocation: {},
          startedAt: null,
          stoppedAt: null,
          resultSummary: null,
          createdAt: new Date(),
          sampleSize: 0,
          timeline: [],
        }),
      ),
    create: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            experimentKey: string;
            name: string;
            description?: string;
            variantConfig: Record<string, unknown>;
            trafficAllocation: { control: number; variant_a: number; variant_b: number };
          },
      )
      .mutation(
        (): { id: number; experimentKey: string } => ({ id: 0, experimentKey: '' }),
      ),
    start: _t.procedure
      .input((x: unknown) => x as { experimentId: number; reason?: string })
      .mutation(
        (): { approvalRequestId: number; needsApproval: boolean } => ({
          approvalRequestId: 0,
          needsApproval: true,
        }),
      ),
    stop: _t.procedure
      .input((x: unknown) => x as { experimentId: number; stopReason: string })
      .mutation((): { ok: boolean } => ({ ok: true })),
    getMultiMetric: _t.procedure
      .input((x: unknown) => x as { experimentId: number })
      .query(
        (): {
          results: Array<{
            metric: string;
            testType: 'chi_square' | 'welch_t';
            pValue: number | null;
            isSignificant: boolean;
            effect: number | null;
            sampleSize: number;
            confidence: number;
            recommendation: 'continue' | 'stop_winner' | 'stop_loser' | 'inconclusive';
          }>;
        } => ({ results: [] }),
      ),
    getDetailByKey: _t.procedure
      .input((x: unknown) => x as { experimentKey: string })
      .query(
        (): {
          id: number;
          experimentKey: string;
          name: string;
          description: string | null;
          status: string;
          variantConfig: unknown;
          trafficAllocation: unknown;
          startedAt: Date | null;
          stoppedAt: Date | null;
          resultSummary: unknown;
          createdAt: Date;
          sampleSize: number;
        } => ({
          id: 0, experimentKey: '', name: '', description: null, status: 'draft',
          variantConfig: {}, trafficAllocation: {}, startedAt: null, stoppedAt: null,
          resultSummary: null, createdAt: new Date(), sampleSize: 0,
        }),
      ),
    getVariantMetrics: _t.procedure
      .input((x: unknown) => x as { experimentId: number })
      .query(
        (): {
          variants: Record<string, {
            sampleSize: number;
            conversion: { rate: number; ciLow: number; ciHigh: number };
            retention: Array<{ day: number; rate: number }>;
            avgCost: number;
          }>;
        } => ({ variants: {} }),
      ),
    getCumulativeTimeline: _t.procedure
      .input((x: unknown) => x as { experimentId: number })
      .query(
        (): {
          timeline: Array<{ day: string; control: number; variant_a: number; variant_b: number }>;
        } => ({ timeline: [] }),
      ),
    promoteWinner: _t.procedure
      .input((x: unknown) => x as {
        experimentId: number;
        winnerVariant: 'control' | 'variant_a' | 'variant_b';
        reason?: string;
      })
      .mutation(
        (): { approvalRequestId: number; needsApproval: boolean } => ({
          approvalRequestId: 0,
          needsApproval: true,
        }),
      ),
  }),
  constants: _t.router({
    listKeys: _t.procedure
      .input((x: unknown) => x as { constantType: 'case' | 'formula' | 'element' })
      .query((): { keys: Array<{ key: string; label: string }> } => ({ keys: [] })),
    getActiveVersion: _t.procedure
      .input((x: unknown) => x as { constantType: 'case' | 'formula' | 'element'; constantKey: string })
      .query(
        (): {
          version: {
            id: number;
            version: number;
            constantType: string;
            constantKey: string;
            content: string;
            contentHash: string;
            status: string;
            judgeScore: string | null;
            createdByAdminId: number;
            createdAt: Date;
            approvedByAdminId: number | null;
            approvedAt: Date | null;
          } | null;
          canaryConfig: {
            id: number;
            constantType: string;
            constantKey: string;
            currentVersionId: number;
            nextVersionId: number | null;
            canaryPct: number;
            strategy: string;
            updatedByAdminId: number;
            updatedAt: Date;
          } | null;
        } => ({ version: null, canaryConfig: null }),
      ),
    listVersions: _t.procedure
      .input(
        (x: unknown) =>
          x as { constantType: 'case' | 'formula' | 'element'; constantKey: string; limit?: number },
      )
      .query(
        (): {
          versions: Array<{
            id: number;
            version: number;
            constantType: string;
            constantKey: string;
            content: string;
            contentHash: string;
            status: string;
            judgeScore: string | null;
            createdByAdminId: number;
            createdAt: Date;
            approvedByAdminId: number | null;
            approvedAt: Date | null;
          }>;
        } => ({ versions: [] }),
      ),
    saveDraft: _t.procedure
      .input(
        (x: unknown) =>
          x as { constantType: 'case' | 'formula' | 'element'; constantKey: string; content: string },
      )
      .mutation(
        (): {
          version: {
            id: number;
            version: number;
            constantType: string;
            constantKey: string;
            content: string;
            contentHash: string;
            status: string;
            judgeScore: string | null;
            createdByAdminId: number;
            createdAt: Date;
            approvedByAdminId: number | null;
            approvedAt: Date | null;
          };
        } => ({
          version: {
            id: 0,
            version: 1,
            constantType: 'case',
            constantKey: '',
            content: '',
            contentHash: '',
            status: 'draft',
            judgeScore: null,
            createdByAdminId: 0,
            createdAt: new Date(),
            approvedByAdminId: null,
            approvedAt: null,
          },
        }),
      ),
    submitForReview: _t.procedure
      .input((x: unknown) => x as { versionId: number })
      .mutation((): { approvalRequestId: number } => ({ approvalRequestId: 0 })),
    rollbackVersion: _t.procedure
      .input(
        (x: unknown) =>
          x as { constantType: 'case' | 'formula' | 'element'; constantKey: string },
      )
      .mutation((): { approvalRequestId: number } => ({ approvalRequestId: 0 })),
    updateCanary: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            constantType: 'case' | 'formula' | 'element';
            constantKey: string;
            nextVersionId: number;
            canaryPct: number;
          },
      )
      .mutation((): { canaryPct: number } => ({ canaryPct: 0 })),
    runLlmJudge: _t.procedure
      .input((x: unknown) => x as { versionId: number; isMock?: boolean })
      .mutation(
        (): { score: number; isMock: boolean; runAt: Date } => ({
          score: 0,
          isMock: true,
          runAt: new Date(),
        }),
      ),
  }),
  featureFlags: _t.router({
    getKpiStats: _t.procedure.query(
      (): { totalFlags: number; enabledFlags: number; recentChanges: number; emergencyActivations: number } => ({
        totalFlags: 0,
        enabledFlags: 0,
        recentChanges: 0,
        emergencyActivations: 0,
      }),
    ),
    listEmergencySwitches: _t.procedure.query(
      (): Array<{
        id: number;
        configKey: string;
        configValue: unknown;
        description: string | null;
        isEmergency: boolean;
        updatedByAdminId: number;
        updatedByEmail: string | null;
        updatedAt: Date;
      }> => [],
    ),
    listFeatureFlags: _t.procedure.query(
      (): Array<{
        id: number;
        flagKey: string;
        description: string | null;
        flagType: string;
        defaultValue: unknown;
        rolloutConfig: unknown;
        enabled: boolean;
        updatedByAdminId: number;
        updatedByEmail: string | null;
        updatedAt: Date;
      }> => [],
    ),
    listSystemConfig: _t.procedure.query(
      (): Array<{
        id: number;
        configKey: string;
        configValue: unknown;
        description: string | null;
        isEmergency: boolean;
        updatedByAdminId: number;
        updatedByEmail: string | null;
        updatedAt: Date;
      }> => [],
    ),
    toggle: _t.procedure
      .input(
        (x: unknown) =>
          x as { flagKey: string; enabled: boolean; rolloutConfig?: unknown },
      )
      .mutation((): { approvalRequestId: number } => ({ approvalRequestId: 0 })),
    updateSystemConfig: _t.procedure
      .input(
        (x: unknown) => x as { configKey: string; configValue: unknown },
      )
      .mutation((): { approvalRequestId: number } => ({ approvalRequestId: 0 })),
    listPostReview: _t.procedure.query(
      (): Array<{
        id: number;
        actionType: string;
        actionPayload: unknown;
        decidedAt: Date | null;
        postReviewRequired: boolean;
        postReviewedAt: Date | null;
        approverAdminId: number | null;
        firstApproverEmail: string | null;
        requesterAdminId: number;
        requesterEmail: string | null;
      }> => [],
    ),
    emergencyToggleSystemConfig: _t.procedure
      .input(
        (x: unknown) =>
          x as {
            configKey: 'stop_trending_scraper' | 'stop_evolution_agent' | 'enable_fallback_prompt';
            incidentId: string;
            reason: string;
          },
      )
      .mutation((): { approvalRequestId: number } => ({ approvalRequestId: 0 })),
  }),
});

export type AdminRouter = typeof _shadowAdminRouter;
