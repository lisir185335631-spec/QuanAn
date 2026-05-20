/**
 * stt router — PRD-8 US-009
 * AC-5: stt.transcribe mutation · protectedProcedure + rate limit check + Whisper 调用 + cost_log
 * ★ R-001: OPENAI_API_KEY 仅在 worker 层使用 · 不暴露给前端
 * ★ D-038: WhisperSttWorker 独立 worker · 不走 LLMGateway
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { checkSttRateLimit } from '@/lib/rate-limit/stt';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';
import { WhisperSttWorker } from '@/workers/stt/whisper';

const sttWorker = new WhisperSttWorker();

export const sttRouter = router({
  /**
   * AC-5: transcribe · protectedProcedure + rate limit + Whisper + cost_log
   * Input: audioBase64 (base64-encoded audio blob) + mimeType
   */
  transcribe: protectedProcedure
    .input(
      z.object({
        audioBase64: z.string().min(1),
        mimeType: z.string().default('audio/wav'),
        traceId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { activeAccountId, traceId: ctxTraceId } = ctx;

      if (!activeAccountId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'activeAccountId required' });
      }

      // AC-4: STT rate limit check (50/user/day)
      await checkSttRateLimit(activeAccountId);

      // Decode base64 → Buffer
      const audioBuffer = Buffer.from(input.audioBase64, 'base64');
      const traceId = input.traceId ?? ctxTraceId ?? `stt-${Date.now()}`;

      const result = await sttWorker.transcribe({
        audioBuffer,
        mimeType: input.mimeType,
        accountId: activeAccountId,
        traceId,
      });

      return {
        transcript: result.transcript,
        durationSec: result.durationSec,
        costUsd: result.costUsd,
      };
    }),
});
