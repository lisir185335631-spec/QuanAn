/**
 * costLog router — PRD-4 US-014
 * logFeedback: writes feedback event to cost_log (event_type='good'/'bad')
 * AC-16: protectedProcedure — ctx.activeAccountId injected, no input.accountId
 * AC-11: traceId fallback → generateHttpTraceId() if not provided
 * AC-12: DB error → logged; caller receives { ok: false } (non-blocking)
 */

import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { router } from '@/trpc/trpc';
import { generateHttpTraceId } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { logger } from '@/lib/logger';

export const costLogRouter = router({
  /** AC-3: writes feedback event to cost_log with eventType='good'|'bad' */
  logFeedback: protectedProcedure
    .input(
      z.object({
        stepKey: z.string().min(1).max(64),
        agentId: z.string().min(1).max(64),
        type: z.enum(['good', 'bad']),
        traceId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId: ctxTraceId } = ctx;
      // AC-11: traceId fallback chain — ctx → input → generated
      const traceId = ctxTraceId ?? input.traceId ?? generateHttpTraceId();

      try {
        await prisma.costLog.create({
          data: {
            agentId: input.agentId,
            accountId: activeAccountId,
            eventType: input.type,
            callType: 'feedback',
            modelTier: 'none',
            modelUsed: 'none',
            provider: 'client',
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            costUsd: new Decimal('0.000000'),
            durationMs: 0,
            success: true,
            traceId,
            // AC-15: target JSON for PRD-8 EvolutionAgent stepKey indexing
            target: { stepKey: input.stepKey, agentId: input.agentId, traceId },
          },
        });
        return { ok: true };
      } catch (err) {
        // AC-12: DB error must not crash UX — log and return failure
        logger.error({ err, traceId }, 'costLog.logFeedback.db_error');
        return { ok: false };
      }
    }),
});
