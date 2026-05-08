/**
 * costLog router — PRD-3 US-005
 * AC-4: feedback button click → write traceId to audit_log (P0 trace-only; PRD-7 triggers evolution)
 */

import { z } from 'zod';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';

export const costLogRouter = router({
  /** P0 trace-only: writes feedback event to audit_log. PRD-7 will trigger evolution. */
  logFeedback: protectedProcedure
    .input(
      z.object({
        stepKey: z.string().min(1).max(64),
        type: z.enum(['good', 'bad']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, user, activeAccountId, traceId } = ctx;
      await prisma.auditLog.create({
        data: {
          userId: user?.id ?? null,
          accountId: activeAccountId,
          eventType: 'feedback.step',
          eventCategory: 'feedback',
          payload: { stepKey: input.stepKey, type: input.type, traceId: traceId ?? null },
          success: true,
        },
      });
      return { ok: true };
    }),
});
