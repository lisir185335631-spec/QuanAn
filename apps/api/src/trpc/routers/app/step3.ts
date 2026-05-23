/**
 * step3 router — PRD-29 US-010b / PRD-29.6 US-003
 * generatePackage: calls BrandingAgent(packaging) + upserts stepData(step3)
 * optimizeSection: re-runs BrandingAgent with optimize prompt + current result as context
 */

import { z } from 'zod';

import { brandingAgent } from '@/specialists/BrandingAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma, PrismaClient } from '@prisma/client';

const STEP_DATA_SELECT = {
  stepKey: true,
  inputs: true,
  result: true,
  isFallback: true,
  version: true,
  updatedAt: true,
} satisfies Prisma.StepDataSelect;

const generatePackageInput = z.object({
  personalInfo: z.string().min(1).max(2000),
  platform: z.string().min(1).max(64),
  audience: z.string().max(500).optional(),
  accountStatus: z.string().max(500).optional(),
  force: z.boolean().optional(),
});

const optimizeSectionInput = z.object({
  currentResult: z.record(z.unknown()),
});

async function upsertStepData(
  prisma: PrismaClient,
  activeAccountId: number,
  traceId: string | null | undefined,
  inputs: Prisma.InputJsonValue,
  agentRes: {
    result: unknown;
    isFallback: boolean;
    durationMs: number;
    tokensUsed: { total: number };
    modelUsed: string;
  },
) {
  return prisma.stepData.upsert({
    where: {
      accountId_stepKey: { accountId: activeAccountId, stepKey: 'step3' },
    },
    update: {
      inputs,
      result: agentRes.result as Prisma.InputJsonValue,
      isFallback: agentRes.isFallback,
      status: agentRes.isFallback ? 'fallback' : 'completed',
      durationMs: agentRes.durationMs,
      tokensUsed: agentRes.tokensUsed.total,
      modelUsed: agentRes.modelUsed,
      agentId: 'BrandingAgent',
      version: { increment: 1 },
      traceId: traceId ?? null,
    },
    create: {
      accountId: activeAccountId,
      stepKey: 'step3',
      inputs,
      result: agentRes.result as Prisma.InputJsonValue,
      isFallback: agentRes.isFallback,
      status: agentRes.isFallback ? 'fallback' : 'completed',
      durationMs: agentRes.durationMs,
      tokensUsed: agentRes.tokensUsed.total,
      modelUsed: agentRes.modelUsed,
      agentId: 'BrandingAgent',
      traceId: traceId ?? null,
    },
    select: STEP_DATA_SELECT,
  });
}

export const step3Router = router({
  generatePackage: protectedProcedure
    .input(generatePackageInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      const agentRes = await brandingAgent.execute({
        accountId: activeAccountId!,
        mode: 'packaging',
        userInput: input,
        traceId: traceId ?? undefined,
        stepKey: 'step3',
      });

      const row = await upsertStepData(
        prisma,
        activeAccountId!,
        traceId,
        input as unknown as Prisma.InputJsonValue,
        agentRes,
      );

      return { ok: true, data: row };
    }),

  optimizeSection: protectedProcedure
    .input(optimizeSectionInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      const contextSummary = JSON.stringify(input.currentResult).slice(0, 1500);
      const optimizeUserInput = {
        personalInfo: `[智能优化模式] 请基于以下现有方案进行全面优化，提升昵称吸引力、视觉描述精准度和简介转化率：${contextSummary}`,
        platform: '全平台优化',
        audience: '优化现有定位，提升差异化竞争力',
        accountStatus: '现有方案优化升级',
      };

      const agentRes = await brandingAgent.execute({
        accountId: activeAccountId!,
        mode: 'packaging',
        userInput: optimizeUserInput,
        traceId: traceId ?? undefined,
        stepKey: 'step3',
      });

      const row = await upsertStepData(
        prisma,
        activeAccountId!,
        traceId,
        optimizeUserInput as unknown as Prisma.InputJsonValue,
        agentRes,
      );

      return { ok: true, data: row, isFallback: agentRes.isFallback };
    }),
});
