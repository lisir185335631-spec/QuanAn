/**
 * stepData router — PRD-2 US-003
 * AC-2: 4 procedures (get/getAll/save/progress) · all pass RLS middleware
 * AC-7: stepData.save writes DB + returns updated row (client reconciles LS optimistic write)
 * AC-8: stepData.get returns current account's data (RLS account_id isolation → cross-account=0)
 * US-007: adds saveStream SSE subscription for step5 (TopicAgent · 22KB · 5 category SSE)
 * SHIELD: do NOT add where:{accountId} to reads — RLS (account_id isolation) handles it
 * Note: Zod schemas inlined — @quanan/schemas/entities has the canonical definition for client use
 *
 * 热插拔:save 的 step→agent 分发已抽到 @/specialists/registry(STEP_AGENT_REGISTRY)。
 * 新增一个 step agent 在 registry 加一条目即可,本文件分发逻辑零改动。
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getProgress } from '@/services/ip-progress/IPProgressService';
import { copywritingAgent, type CopywritingOutput } from '@/specialists/CopywritingAgent';
import { findStepAgent, persistStepAgentResult } from '@/specialists/registry';
import { topicAgent, TOPIC_CATEGORIES } from '@/specialists/TopicAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

/** Accepts any string key — allows e2e tests to use arbitrary keys; RLS handles isolation */
const stepKeySchema = z.string().min(1).max(64);

const STEP_DATA_SELECT = {
  stepKey: true,
  inputs: true,
  result: true,
  isFallback: true,
  version: true,
  updatedAt: true,
} satisfies Prisma.StepDataSelect;

export const stepDataRouter = router({
  /** AC-8: returns StepData for the given stepKey in the current account (RLS filters) */
  get: protectedProcedure
    .input(z.object({ stepKey: stepKeySchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      // ✅ No where:{accountId} — RLS (account_id isolation) auto-filters
      const row = await prisma.stepData.findFirst({
        where: { stepKey: input.stepKey },
        select: STEP_DATA_SELECT,
      });
      return row
        ? {
            ...row,
            inputs: row.inputs as Record<string, unknown>,
            result: row.result as Record<string, unknown> | null,
          }
        : null;
    }),

  /** Returns all StepData rows for the current account (RLS filters) */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;
    // ✅ No where:{accountId} — RLS auto-filters
    const rows = await prisma.stepData.findMany({
      select: STEP_DATA_SELECT,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => ({
      ...r,
      inputs: r.inputs as Record<string, unknown>,
      result: r.result as Record<string, unknown> | null,
    }));
  }),

  /**
   * AC-7: upserts StepData for the current account
   * Returns updated row so client hook can reconcile LS optimistic write
   * 分发:命中 STEP_AGENT_REGISTRY 的 stepKey → 跑 agent + 统一持久化 + 可选副作用(如 step7 写 history)。
   */
  save: protectedProcedure
    .input(
      z.object({
        stepKey: stepKeySchema,
        inputs: z.record(z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId, user } = ctx;

      const row = await prisma.stepData.upsert({
        where: {
          // Composite unique — needed for upsert semantics; RLS WITH CHECK enforces accountId
          accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey },
        },
        update: {
          inputs: input.inputs as Prisma.InputJsonValue,
          version: { increment: 1 },
          traceId: traceId ?? null,
        },
        create: {
          accountId: activeAccountId!,
          stepKey: input.stepKey,
          inputs: input.inputs as Prisma.InputJsonValue,
          agentId: 'WebClient',
          traceId: traceId ?? null,
        },
        select: STEP_DATA_SELECT,
      });

      // 热插拔分发:查 STEP_AGENT_REGISTRY,命中则跑对应 agent → 统一写回 → 可选副作用。
      // 新增 step agent 只需在 registry 加一条目,这里零改动(取代原来 8 段 if(stepKey===...) 硬编码链)。
      const entry = findStepAgent(input.stepKey);
      if (entry) {
        const mode = entry.resolveMode?.(input.stepKey, input.inputs);
        const userInput = entry.buildUserInput
          ? entry.buildUserInput(input.inputs, input.stepKey)
          : input.inputs;
        const agentRes = await entry.agent.execute({
          accountId: activeAccountId!,
          userId: user!.id,
          ...(mode !== undefined ? { mode } : {}),
          userInput,
          traceId: traceId ?? undefined,
          stepKey: input.stepKey,
        });
        const updatedRow = await persistStepAgentResult(
          prisma,
          activeAccountId!,
          input.stepKey,
          agentRes,
          entry.agentId,
          STEP_DATA_SELECT,
        );
        await entry.afterPersist?.({
          prisma,
          accountId: activeAccountId!,
          stepKey: input.stepKey,
          agentRes,
          traceId: traceId ?? null,
        });
        return {
          ok: true,
          data: {
            ...updatedRow,
            inputs: updatedRow.inputs as Record<string, unknown>,
            result: updatedRow.result as Record<string, unknown> | null,
          },
        };
      }

      return {
        ok: true,
        data: {
          ...row,
          inputs: row.inputs as Record<string, unknown>,
          result: row.result as Record<string, unknown> | null,
        },
      };
    }),

  /**
   * AC-8 (US-007): SSE subscription for step5 TopicAgent (22KB · 5 category)
   * US-009 AC-4: extends to step7 CopywritingAgent (long markdown · SSE)
   * Yields { type: 'started' } immediately (首 chunk < 3s) then runs agent.execute()
   * and yields { type: 'done', result } on completion.
   * Note: runs within accountIsolationMiddleware transaction — connection held for LLM duration.
   */
  saveStream: protectedProcedure
    .input(
      z.discriminatedUnion('stepKey', [
        z.object({
          stepKey: z.literal('step5'),
          category: z.enum(TOPIC_CATEGORIES),
          inputs: z.record(z.unknown()),
        }),
        z.object({
          stepKey: z.literal('step7'),
          inputs: z.record(z.unknown()),
        }),
      ]),
    )
    .subscription(async function* ({ ctx, input }) {
      const { prisma, activeAccountId, traceId, user } = ctx;

      // yield started immediately → 首 chunk < 3s
      yield { type: 'started' as const, traceId: traceId ?? '' };

      try {
        if (input.stepKey === 'step5') {
          const agentRes = await topicAgent.execute({
            accountId: activeAccountId!,
            userId: user!.id,
            userInput: { category: input.category, ...input.inputs },
            traceId: traceId ?? undefined,
            stepKey: input.stepKey,
          });

          // Persist result to stepData
          await prisma.stepData.upsert({
            where: {
              accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey },
            },
            update: {
              inputs: { category: input.category, ...input.inputs } as Prisma.InputJsonValue,
              result: agentRes.result as Prisma.InputJsonValue,
              isFallback: agentRes.isFallback,
            status: agentRes.isFallback ? 'fallback' : 'completed',
              durationMs: agentRes.durationMs,
              tokensUsed: agentRes.tokensUsed.total,
              modelUsed: agentRes.modelUsed,
              agentId: 'TopicAgent',
              version: { increment: 1 },
              traceId: traceId ?? null,
            },
            create: {
              accountId: activeAccountId!,
              stepKey: input.stepKey,
              inputs: { category: input.category, ...input.inputs } as Prisma.InputJsonValue,
              result: agentRes.result as Prisma.InputJsonValue,
              isFallback: agentRes.isFallback,
            status: agentRes.isFallback ? 'fallback' : 'completed',
              durationMs: agentRes.durationMs,
              tokensUsed: agentRes.tokensUsed.total,
              modelUsed: agentRes.modelUsed,
              agentId: 'TopicAgent',
              traceId: traceId ?? null,
            },
          });

          yield { type: 'done' as const, result: agentRes.result };
        } else {
          // input.stepKey === 'step7': US-009 CopywritingAgent
          const agentRes = await copywritingAgent.execute({
            accountId: activeAccountId!,
            userId: user!.id,
            mode: 'step7',
            userInput: input.inputs,
            traceId: traceId ?? undefined,
            stepKey: input.stepKey,
          });

          // Persist result to stepData (for step completion tracking)
          await prisma.stepData.upsert({
            where: {
              accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey },
            },
            update: {
              inputs: input.inputs as Prisma.InputJsonValue,
              result: agentRes.result as Prisma.InputJsonValue,
              isFallback: agentRes.isFallback,
            status: agentRes.isFallback ? 'fallback' : 'completed',
              durationMs: agentRes.durationMs,
              tokensUsed: agentRes.tokensUsed.total,
              modelUsed: agentRes.modelUsed,
              agentId: 'CopywritingAgent',
              version: { increment: 1 },
              traceId: traceId ?? null,
            },
            create: {
              accountId: activeAccountId!,
              stepKey: input.stepKey,
              inputs: input.inputs as Prisma.InputJsonValue,
              result: agentRes.result as Prisma.InputJsonValue,
              isFallback: agentRes.isFallback,
            status: agentRes.isFallback ? 'fallback' : 'completed',
              durationMs: agentRes.durationMs,
              tokensUsed: agentRes.tokensUsed.total,
              modelUsed: agentRes.modelUsed,
              agentId: 'CopywritingAgent',
              traceId: traceId ?? null,
            },
          });

          // AC-7: write to history table (memory.l2_write=['history'])
          await prisma.history.create({
            data: {
              accountId: activeAccountId!,
              agentId: 'CopywritingAgent',
              sourceType: 'user',
              inputSummary: input.stepKey,
              content: (agentRes.result as CopywritingOutput).markdown,
              traceId: traceId ?? null,
            },
          });

          yield { type: 'done' as const, result: agentRes.result };
        }
      } catch (err) {
        yield {
          type: 'error' as const,
          message: err instanceof Error ? err.message : String(err),
        };
      }
    }),

  /**
   * US-013: Returns true completion progress — only status='completed' stepData rows count.
   * step2 永远不计入(STEP_KEYS_9 不含 step2).
   * protectedProcedure ensures RLS + activeAccountId; explicit accountId is belt-and-suspenders.
   */
  progress: protectedProcedure.query(({ ctx }) =>
    getProgress(ctx.prisma, ctx.activeAccountId!)
  ),

  /** DEV/TEST ONLY — delete stepData rows for the current account. Forbidden in production. */
  deleteForTest: protectedProcedure
    .input(z.object({ stepKeys: z.array(stepKeySchema).optional() }))
    .mutation(async ({ ctx, input }) => {
      if (process.env.NODE_ENV === 'production') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'deleteForTest is disabled in production' });
      }
      const { prisma, activeAccountId } = ctx;
      await prisma.stepData.deleteMany({
        where: {
          accountId: activeAccountId!,
          ...(input.stepKeys?.length ? { stepKey: { in: input.stepKeys } } : {}),
        },
      });
      return { ok: true };
    }),
});
