/**
 * voiceChat router — PRD-8 US-011
 * AC-4: voiceChat.start subscription · 流式 type='delta'/'tool_call'/'tool_result'/'done' chunks
 * ★ R-001: LLM API keys 仅在 worker 层 · 不暴露前端
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { dispatchTool } from '@/lib/voice-chat/tools-dispatcher';
import { voiceChatAgent, type VoiceChatToolName } from '@/specialists/VoiceChatAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { PrismaClient } from '@prisma/client';

export const voiceChatRouter = router({
  /**
   * AC-4: streaming subscription · yields delta/tool_call/tool_result/done chunks
   * Input: userMessage + optional sessionId
   * Uses ctx.prisma (RLS-scoped) for tool dispatching (AC-2)
   */
  start: protectedProcedure
    .input(
      z.object({
        userMessage: z.string().min(1).max(2000),
        sessionId: z.string().uuid().optional(),
        traceId: z.string().optional(),
      }),
    )
    .subscription(async function* ({ ctx, input }) {
      const { activeAccountId, traceId: ctxTraceId, prisma } = ctx;

      if (!activeAccountId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'activeAccountId required' });
      }

      const traceId = input.traceId ?? ctxTraceId ?? `vc-${Date.now()}`;

      // AC-2: tool dispatcher uses ctx.prisma (RLS-scoped transaction client)
      const dispatch = (name: string, args: Record<string, unknown>) =>
        dispatchTool(name as VoiceChatToolName, args, activeAccountId, prisma as unknown as PrismaClient);

      yield* voiceChatAgent.executeStream(
        {
          accountId: activeAccountId,
          userInput: { userMessage: input.userMessage, sessionId: input.sessionId },
          traceId,
        },
        dispatch,
      );
    }),

  /** Clear voice chat session buffer */
  clearSession: protectedProcedure.mutation(async ({ ctx }) => {
    const { activeAccountId } = ctx;
    if (!activeAccountId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'activeAccountId required' });
    }
    await voiceChatAgent.clearSession(activeAccountId);
    return { ok: true };
  }),
});
