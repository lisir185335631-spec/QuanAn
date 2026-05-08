/**
 * stepData router — PRD-2 US-003
 * AC-2: 4 procedures (get/getAll/save/progress) · all pass RLS middleware
 * AC-7: stepData.save writes DB + returns updated row (client reconciles LS optimistic write)
 * AC-8: stepData.get returns current account's data (RLS account_id isolation → cross-account=0)
 * SHIELD: do NOT add where:{accountId} to reads — RLS (account_id isolation) handles it
 * Note: Zod schemas inlined — @quanqn/schemas/entities has the canonical definition for client use
 */

import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { positioningAgent } from '@/specialists/PositioningAgent';

const STEP_KEYS = [
  'step1',
  'step3',
  'step3b',
  'step4',
  'step4b',
  'step5',
  'step6',
  'step7',
  'step8',
] as const;

/** Accepts any string key — allows e2e tests to use arbitrary keys; RLS handles isolation */
const stepKeySchema = z.string().min(1).max(64);

const STEP_DATA_SELECT = {
  stepKey: true,
  inputs: true,
  result: true,
  version: true,
  updatedAt: true,
} satisfies Prisma.StepDataSelect;

export const stepDataRouter = router({
  /** AC-8: returns StepData for the given stepKey in the current account (RLS filters) */
  get: protectedProcedure
    .input(z.object({ stepKey: stepKeySchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      // ✅ No where:{accountId} — RLS (account_id isolation) auto-filters
      const row = await prisma.stepData.findFirst({
        where: { stepKey: input.stepKey },
        select: STEP_DATA_SELECT,
      });
      return row ?? null;
    }),

  /** Returns all StepData rows for the current account (RLS filters) */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;
    // ✅ No where:{accountId} — RLS auto-filters
    return prisma.stepData.findMany({
      select: STEP_DATA_SELECT,
      orderBy: { updatedAt: 'desc' },
    });
  }),

  /**
   * AC-7: upserts StepData for the current account
   * Returns updated row so client hook can reconcile LS optimistic write
   * AC-5(US-004): step1 → positioningAgent(industry mode), step4 → positioningAgent(execution mode)
   */
  save: protectedProcedure
    .input(
      z.object({
        stepKey: stepKeySchema,
        inputs: z.record(z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      const row = await prisma.stepData.upsert({
        where: {
          // Composite unique — needed for upsert semantics; RLS WITH CHECK enforces accountId
          accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey },
        },
        update: {
          inputs: input.inputs as Prisma.InputJsonValue,
          version: { increment: 1 },
          traceId: traceId ?? null,
        },
        create: {
          accountId: activeAccountId!,
          stepKey: input.stepKey,
          inputs: input.inputs as Prisma.InputJsonValue,
          agentId: 'web-client',
          traceId: traceId ?? null,
        },
        select: STEP_DATA_SELECT,
      });

      // AC-5(US-004): call PositioningAgent for step1 and step4
      if (input.stepKey === 'step1' || input.stepKey === 'step4') {
        const mode = input.stepKey === 'step1' ? 'industry' : 'execution';
        const agentRes = await positioningAgent.execute({
          accountId: activeAccountId!,
          mode,
          userInput: input.inputs,
          traceId: traceId ?? undefined,
          stepKey: input.stepKey,
        });
        // Persist agent result back to the same row
        const updatedRow = await prisma.stepData.update({
          where: {
            accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey },
          },
          data: {
            result: agentRes.result as Prisma.InputJsonValue,
            isFallback: agentRes.isFallback,
            durationMs: agentRes.durationMs,
            tokensUsed: agentRes.tokensUsed.total,
            modelUsed: agentRes.modelUsed,
            agentId: 'PositioningAgent',
          },
          select: STEP_DATA_SELECT,
        });
        return { ok: true, data: updatedRow };
      }

      return { ok: true, data: row };
    }),

  /** Returns completion progress: how many of the 9 steps have data for the current account */
  progress: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;
    // ✅ No where:{accountId} — RLS auto-filters
    const rows = await prisma.stepData.findMany({
      select: { stepKey: true },
    });
    const completedKeys = new Set(rows.map((r) => r.stepKey));
    const total = STEP_KEYS.length;
    const completed = STEP_KEYS.filter((k) => completedKeys.has(k)).length;
    return { completed, total, completedKeys: [...completedKeys] };
  }),
});
