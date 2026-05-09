/**
 * videoAnalysis router — PRD-5 US-009
 * AC-1: analyze · protectedProcedure · input analyzeVideoInput · 调 analysisAgent.execute({ mode: 'viral', userInput })
 * AC-2: history.create · agentId='AnalysisAgent' · agentMode='viral' · contentType='json' · full fields
 * AC-3: rewrite procedure 已删(D-028 · viral mode 已含 rewriteVersion · 减表面积)
 * SHIELD REJ-013: protectedProcedure(非 publicProcedure)
 * SHIELD REJ-007: outputSchema getter 按 mode · AnalysisAgent 已实现
 */

import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { analysisAgent, type AnalysisViralOutput } from '@/specialists/AnalysisAgent';

// ── Input schema (viral mode: lastCopy + optional lastTitle) ──────────────────

const analyzeVideoInput = z.object({
  lastTitle: z.string().max(200).optional(),
  lastCopy: z
    .string()
    .min(10, 'lastCopy 至少 10 字')
    .max(3000, 'lastCopy 最多 3000 字'),
});

// ── Select ────────────────────────────────────────────────────────────────────

const HISTORY_VIDEO_SELECT = {
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

export const videoAnalysisRouter = router({
  /**
   * AC-1: analyze(protectedProcedure · input analyzeVideoInput · 调 analysisAgent viral)
   * AC-2: history.create with full fields · elements=analysis.elements 数组
   * AC-3: rewrite procedure 已删(D-028)
   */
  analyze: protectedProcedure
    .input(analyzeVideoInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      const agentRes = await analysisAgent.execute({
        accountId: activeAccountId!,
        mode: 'viral',
        userInput: { lastCopy: input.lastCopy, lastTitle: input.lastTitle },
        traceId: traceId ?? undefined,
      });

      const viralResult = agentRes.result as AnalysisViralOutput;

      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'AnalysisAgent',
          agentMode: 'viral',
          sourceType: 'user',
          inputSummary: input.lastTitle ?? input.lastCopy.substring(0, 100),
          content: JSON.stringify(viralResult),
          contentType: 'json',
          scriptType: null,
          elements: viralResult.analysis.elements,
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed.total,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_VIDEO_SELECT,
      });
      return row;
    }),
});
