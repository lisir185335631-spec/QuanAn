/**
 * aiVideo router — PRD-6 US-007
 * AC-1: aiVideoRouter · generateStoryboard mutation + jobStatus query
 * AC-2: protectedProcedure → checkImageGenRateLimit → videoAgent(storyboard) → history.create → queue
 * AC-6: jobStatus · explicit where: { accountId, id } 双层防护 (LD-009 · TD-019)
 * SHIELD REJ-013: protectedProcedure (非 publicProcedure)
 * SHIELD REJ-009: prisma.$executeRaw 禁止 · 走 history.update (REJ-009)
 * SHIELD REJ-008: explicit accountId where · 双层防护
 */

import { aiVideoInput } from '@quanan/schemas/specialist-io';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { checkImageGenRateLimit, getImageGenDailyUsage } from '@/lib/rate-limit/image-gen';
import { videoAgent, type StoryboardOutput } from '@/specialists/VideoAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';
import { imageGenQueue } from '@/workers/image-gen/queue';

// ── Internal scene type stored in history.content ─────────────────────────────

interface StoredScene {
  index: number;
  description: string;
  imagePromptEn: string;
  duration: string;
  sceneImageUrl: string | null;
  jobId: string | null;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

interface StoredStoryboardContent {
  title?: string;
  totalDuration?: string;
  scenes: StoredScene[];
}

export const aiVideoRouter = router({
  /**
   * AC-2: generateStoryboard · storyboard mode · async queue flow
   * AC-4: checkImageGenRateLimit → TOO_MANY_REQUESTS on 11th call
   * AC-5: history.scenes jsonb · { index, description, imagePromptEn, duration, sceneImageUrl: null, jobId, status: 'pending' }
   */
  generateStoryboard: protectedProcedure
    .input(aiVideoInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId, user } = ctx;

      // AC-4: rate limit check (TOO_MANY_REQUESTS when count > IMAGE_GEN_DAILY_LIMIT_PER_USER)
      await checkImageGenRateLimit(activeAccountId!);

      // AC-2: call VideoAgent storyboard mode
      const agentRes = await videoAgent.execute({
        accountId: activeAccountId!,
        userId: user!.id,
        mode: 'storyboard',
        userInput: input,
        traceId: traceId ?? undefined,
      });

      const storyboardResult = agentRes.result as StoryboardOutput;
      const { scenes, title, totalDuration } = storyboardResult;

      // AC-2: create history with pending scenes (no jobId yet)
      const pendingScenes: StoredScene[] = scenes.map((s) => ({
        index: s.index,
        description: s.description,
        imagePromptEn: s.imagePromptEn,
        duration: s.duration,
        sceneImageUrl: null,
        jobId: null,
        status: 'pending' as const,
      }));

      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'VideoAgent',
          agentMode: 'storyboard',
          sourceType: 'user',
          inputSummary: input.sourceCopy.substring(0, 100),
          content: JSON.stringify({ title, totalDuration, scenes: pendingScenes } satisfies StoredStoryboardContent),
          contentType: 'json',
          scriptType: null,
          elements: [],
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed.total,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: { id: true },
      });

      // LD-009: double-layer guard (TD-019 · RLS-only 单层防护不够)
      const verified = await prisma.history.findFirst({
        where: { id: row.id, accountId: activeAccountId! },
        select: { id: true },
      });
      if (!verified) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'history isolation check failed' });
      }

      // AC-2: enqueue each scene, collect jobIds
      const jobIds: string[] = [];
      const updatedScenes: StoredScene[] = [...pendingScenes];

      for (const scene of scenes) {
        const job = await imageGenQueue.add('image-gen-job', {
          sceneIndex: scene.index,
          imagePromptEn: scene.imagePromptEn,
          accountId: activeAccountId!,
          traceId: traceId ?? `gen-${Date.now()}`,
          historyId: row.id,
          imageStyle: input.imageStyle,
        });
        const jobId = job.id ?? `job-${scene.index}`;
        jobIds.push(jobId);
        // AC-5: embed jobId in stored scene
        const idx = scene.index - 1;
        updatedScenes[idx] = { ...updatedScenes[idx]!, jobId };
      }

      // AC-5: update history content with jobIds embedded in scenes
      await prisma.history.update({
        where: { id: row.id },
        data: {
          content: JSON.stringify({ title, totalDuration, scenes: updatedScenes } satisfies StoredStoryboardContent),
        },
      });

      // AC-3: return { historyId, jobIds, scenesPlaceholder }
      return {
        historyId: row.id,
        jobIds,
        scenesPlaceholder: scenes.map((s) => ({
          index: s.index,
          description: s.description,
          imagePromptEn: s.imagePromptEn,
          sceneImageUrl: null,
          status: 'pending' as const,
        })),
      };
    }),

  /**
   * US-011 AC-4: dailyUsage · read-only count + limit (no INCR)
   * protectedProcedure: accountId from ctx (SHIELD REJ-013)
   */
  dailyUsage: protectedProcedure
    .query(async ({ ctx }) => {
      return getImageGenDailyUsage(ctx.activeAccountId!);
    }),

  /**
   * AC-6: jobStatus · query history.scenes status counts
   * double guard: where: { accountId, id } · RLS 自动隔离
   */
  jobStatus: protectedProcedure
    .input(z.object({ historyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;

      // AC-6: explicit double-layer guard (REJ-008 · LD-009)
      const history = await prisma.history.findFirst({
        where: { id: input.historyId, accountId: activeAccountId! },
        select: { id: true, content: true },
      });

      if (!history) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'history not found or access denied' });
      }

      const parsed = JSON.parse(history.content) as StoredStoryboardContent;
      const scenes = parsed.scenes ?? [];

      const total = scenes.length;
      const completed = scenes.filter((s) => s.status === 'completed').length;
      const pending = scenes.filter((s) => s.status === 'pending').length;
      const failed = scenes.filter((s) => s.status === 'failed').length;

      return {
        total,
        completed,
        pending,
        failed,
        scenes: scenes.map((s) => ({
          index: s.index,
          status: s.status,
          ...(s.sceneImageUrl !== null && s.sceneImageUrl !== undefined && { sceneImageUrl: s.sceneImageUrl }),
          ...(s.error !== null && s.error !== undefined && { error: s.error }),
        })),
      };
    }),
});
