// PRD-14 US-009 · adminRouter.constants — 8 procedures
// listKeys · getActiveVersion · listVersions · saveDraft · submitForReview · rollbackVersion · updateCanary · runLlmJudge
// SHIELD: evaluateConstantVersion isMock=true (D-077 · real eval via CI)
// SHIELD: rollbackVersion super_admin only + dual approval (LD-A10)
import { createHash } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { KNOWLEDGE_CASES } from '@/lib/constants/cases';
import { COPY_FORMULAS } from '@/lib/constants/formulas';
import { HOT_ELEMENTS } from '@/lib/constants/hotElements';
import { prisma } from '@/lib/prisma';
import { requestApproval } from '@/services/admin/approval/approvalGateService';
import { rollbackConstant, updateConstantCanaryConfig } from '@/services/admin/constant-version/constant-version.service';
import { evaluateConstantVersion } from '@/services/admin/constant-version/llm-judge-constant.service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

const CONSTANT_TYPE = z.enum(['case', 'formula', 'element']);
type ConstantType = z.infer<typeof CONSTANT_TYPE>;

// D-090: valid canary percentages
const VALID_CANARY_PCT = [0, 1, 10, 50, 100] as const;

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

function getKeysForType(type: ConstantType): Array<{ key: string; label: string }> {
  if (type === 'case') {
    return KNOWLEDGE_CASES.map((c) => ({ key: c.key, label: c.title }));
  }
  if (type === 'formula') {
    return COPY_FORMULAS.map((f) => ({ key: f.key, label: f.title }));
  }
  return HOT_ELEMENTS.map((e) => ({ key: e.key, label: e.label }));
}

export const constantsRouter = adminTrpcRouter({
  // ── listKeys ────────────────────────────────────────────────────────────────
  // Return available constantKeys for a given constantType (for dropdown)

  listKeys: adminProcedure
    .input(z.object({ constantType: CONSTANT_TYPE }))
    .query(({ input }) => {
      return { keys: getKeysForType(input.constantType) };
    }),

  // ── getActiveVersion ────────────────────────────────────────────────────────
  // Returns current active ConstantVersion + canary config

  getActiveVersion: adminProcedure
    .input(z.object({ constantType: CONSTANT_TYPE, constantKey: z.string().min(1) }))
    .query(async ({ input }) => {
      const version = await prisma.constantVersion.findFirst({
        where: { constantType: input.constantType, constantKey: input.constantKey, status: 'active' },
        orderBy: { version: 'desc' },
      });

      const canaryConfig = await prisma.constantCanaryConfig.findUnique({
        where: {
          constantType_constantKey: {
            constantType: input.constantType,
            constantKey: input.constantKey,
          },
        },
      });

      return {
        // Decimal(3,2) → string,与线上序列化一致(避免 client 收到 opaque Decimal)
        version: version ? { ...version, judgeScore: version.judgeScore?.toString() ?? null } : null,
        canaryConfig,
      };
    }),

  // ── listVersions ─────────────────────────────────────────────────────────────
  // History timeline — all versions sorted by version desc

  listVersions: adminProcedure
    .input(
      z.object({
        constantType: CONSTANT_TYPE,
        constantKey: z.string().min(1),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ input }) => {
      const versions = await prisma.constantVersion.findMany({
        where: { constantType: input.constantType, constantKey: input.constantKey },
        orderBy: { version: 'desc' },
        take: input.limit,
      });
      return { versions: versions.map((v) => ({ ...v, judgeScore: v.judgeScore?.toString() ?? null })) };
    }),

  // ── saveDraft ────────────────────────────────────────────────────────────────
  // Create a new ConstantVersion(status='draft')

  saveDraft: adminProcedure
    .input(
      z.object({
        constantType: CONSTANT_TYPE,
        constantKey: z.string().min(1),
        content: z.string().min(1).max(500_000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      guardMutation(ctx);

      const adminId = ctx.activeAdminUser!.id;

      const latest = await prisma.constantVersion.findFirst({
        where: { constantType: input.constantType, constantKey: input.constantKey },
        orderBy: { version: 'desc' },
      });

      const nextVersion = (latest?.version ?? 0) + 1;
      const contentHash = createHash('sha256').update(input.content).digest('hex').slice(0, 64);

      const created = await prisma.constantVersion.create({
        data: {
          constantType: input.constantType,
          constantKey: input.constantKey,
          version: nextVersion,
          content: input.content,
          contentHash,
          status: 'draft',
          createdByAdminId: adminId,
        },
      });

      return { version: created };
    }),

  // ── submitForReview ──────────────────────────────────────────────────────────
  // draft → pending_review + LLM Judge stub + requestApproval(dual=true)

  submitForReview: adminProcedure
    .input(z.object({ versionId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      guardMutation(ctx);

      const adminId = ctx.activeAdminUser!.id;

      const version = await prisma.constantVersion.findUniqueOrThrow({ where: { id: input.versionId } });

      if (version.status !== 'draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Version ${input.versionId} status is '${version.status}', expected 'draft'`,
        });
      }

      await prisma.constantVersion.update({
        where: { id: input.versionId },
        data: { status: 'pending_review' },
      });

      // Trigger LLM Judge stub (isMock=true per D-077)
      void evaluateConstantVersion(input.versionId, true).catch(() => void 0);

      // Request dual approval (LD-A10: only _publishConstantVersionInTx sets 'active')
      const approval = await requestApproval({
        actionType: 'publish_constant_version',
        requesterAdminId: adminId,
        requesterRole: 'admin',
        actionPayload: {
          versionId: input.versionId,
          constantType: version.constantType,
          constantKey: version.constantKey,
          version: version.version,
        },
        riskLevel: 'high',
        requireDualApproval: true,
      });

      return { approvalRequestId: approval.id };
    }),

  // ── rollbackVersion ──────────────────────────────────────────────────────────
  // super_admin only · request rollback approval

  rollbackVersion: adminProcedure
    .input(z.object({ constantType: CONSTANT_TYPE, constantKey: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      guardSuperAdmin(ctx);

      const adminId = ctx.activeAdminUser!.id;
      const approvalRequestId = await rollbackConstant(input.constantType, input.constantKey, adminId);

      return { approvalRequestId };
    }),

  // ── updateCanary ─────────────────────────────────────────────────────────────
  // 5-step canary: 0/1/10/50% → direct upsert; 100% → dual-approval publish

  updateCanary: adminProcedure
    .input(
      z.object({
        constantType: CONSTANT_TYPE,
        constantKey: z.string().min(1),
        nextVersionId: z.number().int(),
        canaryPct: z.number().int().refine((v) => (VALID_CANARY_PCT as readonly number[]).includes(v), {
          message: 'canaryPct must be one of 0, 1, 10, 50, 100',
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      guardSuperAdmin(ctx);

      const adminId = ctx.activeAdminUser!.id;
      await updateConstantCanaryConfig(
        input.constantType,
        input.constantKey,
        input.nextVersionId,
        input.canaryPct,
        adminId,
      );

      return { canaryPct: input.canaryPct };
    }),

  // ── runLlmJudge ──────────────────────────────────────────────────────────────
  // super_admin only · rerun LLM Judge for a version (isMock=true default D-077)

  runLlmJudge: adminProcedure
    .input(
      z.object({
        versionId: z.number().int(),
        isMock: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      guardSuperAdmin(ctx);

      const result = await evaluateConstantVersion(input.versionId, input.isMock);

      return { score: result.score, isMock: result.isMock, runAt: new Date() };
    }),
});
