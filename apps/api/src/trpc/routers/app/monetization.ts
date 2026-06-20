/**
 * monetization router — PRD-27 US-001 (D-259)
 * AC-1: generate mutation 改 mock → 真调 monetizationAgent.execute('monetization-tool')
 * AC-5: cost_log 由 BaseSpecialist 自动处理(eventType: specialist_call)
 */

import { z } from 'zod';

import { monetizationAgent } from '@/specialists/MonetizationAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

const generateMonetizationInput = z.object({
  industryContext: z.string().max(500).optional(),
  audienceProfile: z.string().max(500).optional(),
  ipPositioning: z.string().max(500).optional(),
  productDescription: z.string().max(1000).optional(),
});

const HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  agentMode: true,
  traceId: true,
  isFallback: true,
  tokensUsed: true,
  modelUsed: true,
  durationMs: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

export const monetizationRouter = router({
  /** Generate monetization model via MonetizationAgent (monetization-tool mode · AC-1) */
  generate: protectedProcedure
    .input(generateMonetizationInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId, user } = ctx;

      const agentRes = await monetizationAgent.execute({
        accountId: activeAccountId!,
        userId: user!.id,
        mode: 'monetization-tool',
        userInput: input,
        traceId: traceId ?? undefined,
        stepKey: 'tool-monetization',
      });

      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'MonetizationAgent',
          agentMode: 'monetization-tool',
          sourceType: 'user',
          inputSummary: input.productDescription?.substring(0, 100) ?? '[monetization-tool]',
          content: JSON.stringify(agentRes.result),
          contentType: 'json',
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed.total,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });

      return row;
    }),

  /** Generate rich Step4b monetization plan via monetization-plan mode */
  generatePlan: protectedProcedure
    .input(z.object({
      industry: z.string().max(200).optional(),
      productService: z.string().max(2000).optional(),
      targetAudience: z.string().max(500).optional(),
      ipPositioning: z.string().max(500).optional(),
      currentIncome: z.string().max(200).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId, user } = ctx;

      const agentRes = await monetizationAgent.execute({
        accountId: activeAccountId!,
        userId: user!.id,
        mode: 'monetization-plan',
        userInput: input,
        traceId: traceId ?? undefined,
        stepKey: 'step4b-plan',
      });

      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'MonetizationAgent',
          agentMode: 'monetization-plan',
          sourceType: 'user',
          inputSummary: input.productService?.substring(0, 100) ?? '[monetization-plan]',
          content: JSON.stringify(agentRes.result),
          contentType: 'json',
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed.total,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });

      return row;
    }),
});
