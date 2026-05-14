// PRD-13 US-007/008 · adminRouter.prompts — 8 procedures
// US-007: saveDraft · submitForReview · listVersions · getActiveVersion · rollbackVersion
// US-008: updateCanary · rollback · runLlmJudge
// SHIELD: _publishPromptVersionInTx single-point (LD-A-6) · no direct status='active' write here
import { createHash } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { requestApproval } from '@/services/admin/approval/approvalGateService';
import { evaluatePromptVersion } from '@/services/admin/prompt-version/llm-judge.service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';
import { prisma } from '@/lib/prisma';

function guardMutation(ctx: { activeAdminUser?: { role?: string; id: number } | null }): void {
  if (ctx.activeAdminUser?.role === 'readonly_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'privilege_escalation' });
  }
}

function guardSuperAdmin(ctx: { activeAdminUser?: { role?: string; id: number } | null }): void {
  if (ctx.activeAdminUser?.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'super_admin only' });
  }
}

export const promptsRouter = adminTrpcRouter({
  // ── getActiveVersion ────────────────────────────────────────────────────
  // Returns current active version + canary config for a specialist/mode

  getActiveVersion: adminProcedure
    .input(z.object({ specialistId: z.string(), mode: z.string().default('default') }))
    .query(async ({ input }) => {
      const version = await prisma.promptVersion.findFirst({
        where: { specialistId: input.specialistId, mode: input.mode, status: 'active' },
        orderBy: { version: 'desc' },
      });

      const canaryConfig = await prisma.promptCanaryConfig.findUnique({
        where: { specialistId_mode: { specialistId: input.specialistId, mode: input.mode } },
      });

      return { version, canaryConfig };
    }),

  // ── listVersions ────────────────────────────────────────────────────────
  // History timeline — all versions for specialist/mode sorted by version desc

  listVersions: adminProcedure
    .input(
      z.object({
        specialistId: z.string(),
        mode: z.string().default('default'),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      const [versions, canaryConfig] = await Promise.all([
        prisma.promptVersion.findMany({
          where: { specialistId: input.specialistId, mode: input.mode },
          orderBy: { version: 'desc' },
          take: input.limit,
        }),
        prisma.promptCanaryConfig.findUnique({
          where: { specialistId_mode: { specialistId: input.specialistId, mode: input.mode } },
        }),
      ]);

      const versionsWithCanary = versions.map((v) => {
        const canaryHistory: { canaryPct: number; updatedAt: Date }[] = [];
        if (
          canaryConfig &&
          (v.id === canaryConfig.currentVersionId || v.id === canaryConfig.nextVersionId)
        ) {
          canaryHistory.push({ canaryPct: canaryConfig.canaryPct, updatedAt: canaryConfig.updatedAt });
        }
        return { ...v, canaryHistory };
      });

      return { versions: versionsWithCanary };
    }),

  // ── saveDraft ────────────────────────────────────────────────────────────
  // Create a new PromptVersion(status='draft') — AC-8

  saveDraft: adminProcedure
    .input(
      z.object({
        specialistId: z.string(),
        mode: z.string().default('default'),
        content: z.string().min(1).max(100_000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      guardMutation(ctx);

      const adminId = ctx.activeAdminUser!.id;

      const latest = await prisma.promptVersion.findFirst({
        where: { specialistId: input.specialistId, mode: input.mode },
        orderBy: { version: 'desc' },
      });

      const nextVersion = (latest?.version ?? 0) + 1;
      const contentHash = createHash('sha256').update(input.content).digest('hex').slice(0, 64);

      const created = await prisma.promptVersion.create({
        data: {
          specialistId: input.specialistId,
          mode: input.mode,
          version: nextVersion,
          content: input.content,
          contentHash,
          status: 'draft',
          createdByAdminId: adminId,
        },
      });

      return { version: created };
    }),

  // ── submitForReview ──────────────────────────────────────────────────────
  // draft → pending_review + LLM Judge stub + requestApproval(dual=true) — AC-8/12

  submitForReview: adminProcedure
    .input(z.object({ versionId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      guardMutation(ctx);

      const adminId = ctx.activeAdminUser!.id;

      const version = await prisma.promptVersion.findUniqueOrThrow({ where: { id: input.versionId } });

      if (version.status !== 'draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Version ${input.versionId} status is '${version.status}', expected 'draft'`,
        });
      }

      await prisma.promptVersion.update({
        where: { id: input.versionId },
        data: { status: 'pending_review' },
      });

      // Trigger LLM Judge stub (isMock=true default per D-077)
      void evaluatePromptVersion(input.versionId, true).catch(() => void 0);

      // Request dual approval
      const approval = await requestApproval({
        actionType: 'publish_prompt',
        requesterAdminId: adminId,
        requesterRole: 'admin',
        actionPayload: {
          versionId: input.versionId,
          specialistId: version.specialistId,
          mode: version.mode,
          version: version.version,
        },
        riskLevel: 'high',
        requireDualApproval: true,
      });

      return { approvalRequestId: approval.id };
    }),

  // ── rollbackVersion ──────────────────────────────────────────────────────
  // super_admin only · request rollback approval — AC-9 (历史时间线 "回滚此版本")

  rollbackVersion: adminProcedure
    .input(z.object({ specialistId: z.string(), mode: z.string().default('default') }))
    .mutation(async ({ input, ctx }) => {
      guardSuperAdmin(ctx);

      const adminId = ctx.activeAdminUser!.id;

      const approval = await requestApproval({
        actionType: 'rollback_prompt',
        requesterAdminId: adminId,
        requesterRole: 'super_admin',
        actionPayload: { specialistId: input.specialistId, mode: input.mode },
        riskLevel: 'high',
        requireDualApproval: true,
      });

      return { approvalRequestId: approval.id };
    }),

  // ── updateCanary ─────────────────────────────────────────────────────────
  // US-008 AC-2/3/4: 5-step canary pct update
  // 0/1/10/50% → direct DB update; 100% → dual-approval publish_prompt

  updateCanary: adminProcedure
    .input(
      z.object({
        specialistId: z.string(),
        mode: z.string().default('default'),
        canaryPct: z.number().int().refine((v) => [0, 1, 10, 50, 100].includes(v), {
          message: 'canaryPct must be one of 0, 1, 10, 50, 100',
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      guardSuperAdmin(ctx);
      const adminId = ctx.activeAdminUser!.id;

      if (input.canaryPct === 100) {
        // 100% full rollout → dual approval required (AC-2)
        const approval = await requestApproval({
          actionType: 'publish_prompt',
          requesterAdminId: adminId,
          requesterRole: 'super_admin',
          actionPayload: {
            specialistId: input.specialistId,
            mode: input.mode,
            canaryPct: 100,
            action: 'full_rollout',
          },
          riskLevel: 'high',
          requireDualApproval: true,
        });
        return { canaryPct: null, approvalRequestId: approval.id };
      }

      // 0-50% direct upsert (AC-3/4) — updateMany silently no-ops when no row exists
      const activeVersion = await prisma.promptVersion.findFirst({
        where: { specialistId: input.specialistId, mode: input.mode, status: 'active' },
        orderBy: { version: 'desc' },
      });
      if (!activeVersion) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active version found for this specialist — publish a version first' });
      }
      await prisma.promptCanaryConfig.upsert({
        where: { specialistId_mode: { specialistId: input.specialistId, mode: input.mode } },
        update: { canaryPct: input.canaryPct, updatedByAdminId: adminId },
        create: { specialistId: input.specialistId, mode: input.mode, canaryPct: input.canaryPct, currentVersionId: activeVersion.id, updatedByAdminId: adminId },
      });

      return { canaryPct: input.canaryPct, approvalRequestId: null };
    }),

  // ── rollback ─────────────────────────────────────────────────────────────
  // US-008 AC-7: super_admin canary rollback with reason ≥ 20 chars · dual approval

  rollback: adminProcedure
    .input(
      z.object({
        specialistId: z.string(),
        mode: z.string().default('default'),
        reason: z.string().min(20, '回滚原因至少 20 字'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      guardSuperAdmin(ctx);
      const adminId = ctx.activeAdminUser!.id;

      const approval = await requestApproval({
        actionType: 'rollback_prompt',
        requesterAdminId: adminId,
        requesterRole: 'super_admin',
        actionPayload: {
          specialistId: input.specialistId,
          mode: input.mode,
          reason: input.reason,
          source: 'canary_ui',
        },
        riskLevel: 'high',
        requireDualApproval: true,
      });

      return { approvalRequestId: approval.id };
    }),

  // ── runLlmJudge ──────────────────────────────────────────────────────────
  // US-008 AC-8: super_admin rerun LLM Judge · isMock=true default (D-077)

  runLlmJudge: adminProcedure
    .input(
      z.object({
        versionId: z.number().int(),
        isMock: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      guardSuperAdmin(ctx);

      const result = await evaluatePromptVersion(input.versionId, input.isMock);

      return { score: result.score, isMock: result.isMock, runAt: new Date() };
    }),
});
