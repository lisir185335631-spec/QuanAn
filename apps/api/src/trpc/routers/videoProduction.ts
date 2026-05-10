/**
 * videoProduction router — PRD-6 US-003
 * AC-1: videoProductionRouter · generate procedure (real VideoAgent production mode)
 * AC-2: protectedProcedure · videoProductionInput · 调 videoAgent(mode='production')
 * AC-3: history.create + findFirst({ where: { id, accountId } }) 显式双层防护 (LD-009 · TD-019)
 * SHIELD REJ-013: protectedProcedure (非 publicProcedure)
 * SHIELD REJ-017: cost_log 由 BaseSpecialist 自动写(含 traceId · accountId)
 * SHIELD REJ-008: explicit accountId where + RLS via protectedProcedure
 * Note: generateStoryboard 保留为 stub — PRD-6 US-007 真接
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { checkImageGenRateLimit } from '@/lib/rate-limit/image-gen';
import { videoAgent, type ProductionOutput } from '@/specialists/VideoAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';
import { imageGenQueue } from '@/workers/image-gen/queue';

import type { ImageGenJobPayload } from '@/workers/image-gen/index';
import type { Prisma } from '@prisma/client';

// ── Input schema (inline equiv of @quanqn/schemas/specialist-io videoProductionInput) ──

const videoProductionInputSchema = z.object({
  sourceCopy: z.string().min(10, 'sourceCopy 至少 10 个字符').max(3000, '原始文案不能超过3000字符'),
  videoType: z.enum(['short_form', 'long_form']).optional(),
  duration: z.enum(['15s', '30s', '60s', '180s']).optional(),
  additionalContext: z.string().optional(),
});

// ── Stub schemas (legacy mocks · PRD-2 US-004) ───────────────────────────────

const generateStoryboardInput = z.object({
  stepKey: z.string().min(1).max(64),
  sceneCount: z.number().int().min(1).max(30).default(5),
  style: z.string().max(64).optional(),
});

const generateSceneImageInput = z.object({
  storyboardHistoryId: z.number().int().positive(),
  sceneIndex: z.number().int().min(0),
  imagePromptEn: z.string().min(1).max(1000),
  imageStyle: z.enum(['vivid', 'natural']).optional().default('vivid'),
});

// ── Select ────────────────────────────────────────────────────────────────────

const HISTORY_VIDEO_PRODUCTION_SELECT = {
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

const STUB_HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

export const videoProductionRouter = router({
  /**
   * AC-1,2: generate(protectedProcedure · videoProductionInputSchema · mode='production')
   * AC-3: explicit findFirst({ where: { accountId } }) 双层防护
   * AC-4: cost_log 由 BaseSpecialist 自动写(callType='specialist_call')
   */
  generate: protectedProcedure
    .input(videoProductionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      const agentRes = await videoAgent.execute({
        accountId: activeAccountId!,
        mode: 'production',
        userInput: input,
        traceId: traceId ?? undefined,
      });

      const productionResult = agentRes.result as ProductionOutput;

      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'VideoAgent',
          agentMode: 'production',
          sourceType: 'user',
          inputSummary: input.sourceCopy.substring(0, 100),
          content: JSON.stringify(productionResult),
          contentType: 'json',
          scriptType: null,
          elements: [],
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed.total,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_VIDEO_PRODUCTION_SELECT,
      });

      // LD-009: explicit double-layer guard (TD-019 教训 · RLS-only 单层防护不够)
      const verified = await prisma.history.findFirst({
        where: { id: row.id, accountId: activeAccountId! },
        select: HISTORY_VIDEO_PRODUCTION_SELECT,
      });
      if (!verified) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'history isolation check failed' });
      }
      return verified;
    }),

  /** Generate video storyboard stub (PRD-6 US-004 真接) */
  generateStoryboard: protectedProcedure
    .input(generateStoryboardInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'VideoAgent',
          sourceType: 'user',
          inputSummary: '[mock storyboard]',
          content: '[mock]',
          traceId: traceId ?? null,
        },
        select: STUB_HISTORY_SELECT,
      });
      return row;
    }),

  /** Generate scene image — enqueues BullMQ job (AC-9: Redis error → 5xx) */
  generateSceneImage: protectedProcedure
    .input(generateSceneImageInput)
    .mutation(async ({ ctx, input }) => {
      const { activeAccountId, traceId } = ctx;

      // AC-5: rate limit check (sliding window, throws TOO_MANY_REQUESTS if exceeded)
      await checkImageGenRateLimit(activeAccountId!);

      const payload: ImageGenJobPayload = {
        sceneIndex: input.sceneIndex,
        imagePromptEn: input.imagePromptEn,
        accountId: activeAccountId!,
        traceId: traceId ?? `gen-${Date.now()}`,
        historyId: input.storyboardHistoryId,
        imageStyle: input.imageStyle,
      };

      // AC-9: Queue.add() throws when Redis is unreachable → return 5xx
      try {
        const job = await imageGenQueue.add('scene-image', payload);
        return { jobId: job.id, historyId: input.storyboardHistoryId, sceneIndex: input.sceneIndex };
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '生成失败 · 请稍后再试',
        });
      }
    }),
});
