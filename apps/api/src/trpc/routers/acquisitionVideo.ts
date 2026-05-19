/**
 * acquisitionVideo router — PRD-6 US-005
 * AC-1: acquisitionVideoRouter · generate procedure
 * AC-2: protectedProcedure · videoAgent(mode='acquisition') · writes history agentMode='acquisition'
 * AC-3: explicit accountId double guard (LD-009 · TD-019)
 * AC-4: ctaScript field mapped from VideoAcquisitionOutput.cta (contains CTA keywords)
 * SHIELD REJ-013: protectedProcedure (非 publicProcedure)
 * SHIELD REJ-008: explicit accountId where + RLS via protectedProcedure
 */

import { acquisitionVideoInput } from '@quanan/schemas/specialist-io';
import { TRPCError } from '@trpc/server';

import { videoAgent, type VideoAcquisitionOutput } from '@/specialists/VideoAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

// ── Select ────────────────────────────────────────────────────────────────────

const HISTORY_ACQUISITION_SELECT = {
  id: true,
  content: true,
  contentType: true,
  agentId: true,
  agentMode: true,
  scriptType: true,
  elements: true,
  isFallback: true,
  tokensUsed: true,
  modelUsed: true,
  durationMs: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

export const acquisitionVideoRouter = router({
  /**
   * AC-1,2: generate(protectedProcedure · acquisitionVideoInputSchema · mode='acquisition')
   * AC-3: explicit findFirst({ where: { accountId } }) 双层防护 (LD-009 · TD-019)
   * AC-4: ctaScript mapped from cta field · must contain CTA keywords
   */
  generate: protectedProcedure
    .input(acquisitionVideoInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      const agentRes = await videoAgent.execute({
        accountId: activeAccountId!,
        mode: 'acquisition',
        userInput: input,
        traceId: traceId ?? undefined,
      });

      const acquisitionResult = agentRes.result as VideoAcquisitionOutput;

      // AC-4: map cta → ctaScript for post-validate grep check
      const contentData = {
        script: acquisitionResult.script,
        ctaScript: acquisitionResult.cta,
        conversionPath: acquisitionResult.conversionPath,
        keyMessages: acquisitionResult.keyMessages,
      };

      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'VideoAgent',
          agentMode: 'acquisition',
          sourceType: 'user',
          inputSummary: input.sourceCopy.substring(0, 100),
          content: JSON.stringify(contentData),
          contentType: 'json',
          scriptType: null,
          elements: [],
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed.total,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_ACQUISITION_SELECT,
      });

      // LD-009: explicit double-layer guard (TD-019 教训 · RLS-only 单层防护不够)
      const verified = await prisma.history.findFirst({
        where: { id: row.id, accountId: activeAccountId! },
        select: HISTORY_ACQUISITION_SELECT,
      });
      if (!verified) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'history isolation check failed' });
      }
      return verified;
    }),
});
