/**
 * step3 router — PRD-29 US-010b
 * generatePackage: calls BrandingAgent(packaging) + upserts stepData(step3)
 */

import { z } from 'zod';

import { brandingAgent } from '@/specialists/BrandingAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

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
});

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

      const row = await prisma.stepData.upsert({
        where: {
          accountId_stepKey: { accountId: activeAccountId!, stepKey: 'step3' },
        },
        update: {
          inputs: input as unknown as Prisma.InputJsonValue,
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
          accountId: activeAccountId!,
          stepKey: 'step3',
          inputs: input as unknown as Prisma.InputJsonValue,
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

      return { ok: true, data: row };
    }),
});
