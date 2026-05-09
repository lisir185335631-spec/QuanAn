/**
 * analysis router — PRD-5 US-007
 * AC-1: analyze · protectedProcedure · input analysisStructuralInput · 调 analysisAgent(mode='structural')
 * AC-2: history.create · agentId='AnalysisAgent' · agentMode='structural' · contentType='json' · full fields
 * AC-7: copy < 10 字 → zod BAD_REQUEST · copy > 3000 → zod BAD_REQUEST
 * AC-9: cost_log 由 BaseSpecialist 自动写入(eventType="specialist_call")
 * SHIELD REJ-013: protectedProcedure(非 publicProcedure)
 * SHIELD REJ-007: outputSchema 按 mode getter(AnalysisAgent 已实现)
 */

import { z } from 'zod';

import { analysisAgent, type AnalysisStructuralOutput } from '@/specialists/AnalysisAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

// ── Input schema (inline equiv of analysisStructuralInput from AnalysisAgent) ─

const analysisStructuralInput = z.object({
  copy: z
    .string()
    .min(10, 'copy 至少 10 字')
    .max(3000, 'copy 最多 3000 字'),
});

// ── Select ────────────────────────────────────────────────────────────────────

const HISTORY_ANALYSIS_SELECT = {
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

export const analysisRouter = router({
  /**
   * AC-1: analyze(protectedProcedure · input analysisStructuralInput)
   * AC-2: history.create · content=JSON.stringify(result) · contentType='json' · full fields
   */
  analyze: protectedProcedure
    .input(analysisStructuralInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      const agentRes = await analysisAgent.execute({
        accountId: activeAccountId!,
        mode: 'structural',
        userInput: { copy: input.copy },
        traceId: traceId ?? undefined,
      });

      const structuralResult = agentRes.result as AnalysisStructuralOutput;

      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'AnalysisAgent',
          agentMode: 'structural',
          sourceType: 'user',
          inputSummary: input.copy.substring(0, 100),
          content: JSON.stringify(structuralResult),
          contentType: 'json',
          scriptType: null,
          elements: [],
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed.total,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_ANALYSIS_SELECT,
      });
      return row;
    }),
});
