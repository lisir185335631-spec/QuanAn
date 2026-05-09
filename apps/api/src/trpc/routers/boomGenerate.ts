/**
 * boomGenerate router — PRD-5 US-005
 * AC-1: generate · protectedProcedure · 调 copywritingAgent.execute({ mode: 'boom', userInput })
 * AC-2: history.create · content=candidates.join('\n\n---\n\n')(D-032) · full fields
 * AC-5: elements 空 → "elements 至少 1 项" · elements > 8 → "elements 最多 8 项"
 * AC-7: cost_log 由 BaseSpecialist 自动写入(eventType="specialist_call" · target.agentMode="boom")
 * AC-8: industry 未提供 → 从 DB 读 activeAccount.industry
 */

import { z } from 'zod';

import { copywritingAgent, type BoomOutput } from '@/specialists/CopywritingAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

// ── Input schema ──────────────────────────────────────────────────────────────

const HOT_ELEMENT_ENUM = [
  'greed', 'fear', 'curiosity', 'contrast',
  'resonance', 'empathy', 'social_proof', 'authority', 'leverage', 'worst',
  'reveal', 'controversy', 'challenge', 'transformation', 'anger', 'surprise',
  'trend', 'list', 'scarcity', 'small_big', 'low_cost_high', 'low_cost_unknown',
] as const;

const generateBoomInput = z.object({
  elements: z
    .array(z.enum(HOT_ELEMENT_ENUM))
    .min(1, 'elements 至少 1 项')
    .max(8, 'elements 最多 8 项'),
  industry: z.string().max(64).optional(),
  theme: z.string().max(200).optional(),
});

// ── Select ────────────────────────────────────────────────────────────────────

const HISTORY_BOOM_SELECT = {
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

export const boomGenerateRouter = router({
  /**
   * AC-1: generate(protectedProcedure · input generateBoomInput · 调 copywritingAgent.execute(boom))
   * AC-2: history.create · D-032 content format · full fields
   */
  generate: protectedProcedure
    .input(generateBoomInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      // AC-8: industry 未提供 → 读 activeAccount.industry
      let effectiveIndustry = input.industry;
      if (!effectiveIndustry) {
        const account = await prisma.ipAccount.findUnique({
          where: { id: activeAccountId! },
          select: { industry: true },
        });
        effectiveIndustry = account?.industry ?? undefined;
      }

      const agentRes = await copywritingAgent.execute({
        accountId: activeAccountId!,
        mode: 'boom',
        userInput: { ...input, industry: effectiveIndustry },
        traceId: traceId ?? undefined,
      });

      const boomResult = agentRes.result as BoomOutput;
      // D-032: 5 篇 candidates 用 '\n\n---\n\n' 分隔合并为单行 content
      const content = boomResult.candidates.join('\n\n---\n\n');
      const inputSummary = (input.theme ?? input.industry ?? 'boom').substring(0, 100);

      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'CopywritingAgent',
          agentMode: 'boom',
          sourceType: 'user',
          inputSummary,
          content,
          contentType: 'markdown',
          scriptType: null,
          elements: input.elements,
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed.total,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_BOOM_SELECT,
      });
      return row;
    }),
});
