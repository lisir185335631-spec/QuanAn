/**
 * tts router — PRD-8 US-010
 * AC-6: tts.synthesize mutation · protectedProcedure + rate limit check + TTS call + Asset 写入
 * ★ R-001: OPENAI_API_KEY 仅在 worker 层使用 · 不暴露给前端
 * ★ D-038: OpenAITtsWorker 独立 worker · 不走 LLMGateway
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { checkTtsRateLimit } from '@/lib/rate-limit/tts';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';
import { OpenAITtsWorker } from '@/workers/tts/openai-tts';

const ttsWorker = new OpenAITtsWorker();

export const ttsRouter = router({
  /**
   * AC-6: synthesize · protectedProcedure + rate limit + TTS-1 + Asset + cost_log
   * Input: text (string, max 4000 chars) + optional voice
   */
  synthesize: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        voice: z.string().optional(),
        traceId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { activeAccountId, traceId: ctxTraceId } = ctx;

      if (!activeAccountId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'activeAccountId required' });
      }

      // AC-5: TTS rate limit check (100/user/day)
      await checkTtsRateLimit(activeAccountId);

      const traceId = input.traceId ?? ctxTraceId ?? `tts-${Date.now()}`;

      const result = await ttsWorker.synthesize({
        text: input.text,
        voice: input.voice,
        accountId: activeAccountId,
        traceId,
      });

      return {
        publicUrl: result.publicUrl,
        sizeBytes: result.sizeBytes,
        costUsd: result.costUsd,
      };
    }),
});
