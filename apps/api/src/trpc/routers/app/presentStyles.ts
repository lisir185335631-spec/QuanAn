/**
 * presentStyles router — PRD-27 US-003 (D-259 + D-260)
 * AC-5: recommend mutation 删 stub · 改 await presentationAgent.execute({mode:'recommend',...})
 *       返 history row with JSON.stringify(agentRes.result)
 */

import { z } from 'zod';

import { presentationAgent } from '@/specialists/PresentationAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

const recommendInput = z.object({
  text: z.string().min(10).max(2000),
  platform: z.string().min(1).max(50),
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

export const presentStylesRouter = router({
  /** Recommend presentation styles via PresentationAgent (AC-5 · D-259 + D-260) */
  recommend: protectedProcedure
    .input(recommendInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      const agentRes = await presentationAgent.execute({
        accountId: activeAccountId!,
        mode: 'recommend',
        userInput: { text: input.text, platform: input.platform },
        traceId: traceId ?? undefined,
        stepKey: 'tool-present-styles',
      });

      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'PresentationAgent',
          agentMode: 'recommend',
          sourceType: 'user',
          inputSummary: input.text.substring(0, 100),
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
