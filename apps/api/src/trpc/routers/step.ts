/**
 * Step data router — PRD-2 US-002
 * AC-1: saveStepData upserts StepData with traceId; used by useStepData hook (DB-side of LS↔DB dual-write)
 */

import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';

export const stepRouter = router({
  saveStepData: protectedProcedure
    .input(
      z.object({
        stepKey: z.string().max(16),
        inputs: z.record(z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      await prisma.stepData.upsert({
        where: {
          accountId_stepKey: {
            accountId: activeAccountId!,
            stepKey: input.stepKey,
          },
        },
        update: {
          inputs: input.inputs as Prisma.InputJsonValue,
          traceId: traceId ?? null,
        },
        create: {
          accountId: activeAccountId!,
          stepKey: input.stepKey,
          inputs: input.inputs as Prisma.InputJsonValue,
          agentId: 'web-client',
          traceId: traceId ?? null,
        },
      });

      return { ok: true };
    }),
});
