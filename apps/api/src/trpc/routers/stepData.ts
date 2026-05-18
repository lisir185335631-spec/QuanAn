/**
 * stepData router — PRD-2 US-003
 * AC-2: 4 procedures (get/getAll/save/progress) · all pass RLS middleware
 * AC-7: stepData.save writes DB + returns updated row (client reconciles LS optimistic write)
 * AC-8: stepData.get returns current account's data (RLS account_id isolation → cross-account=0)
 * US-007: adds saveStream SSE subscription for step5 (TopicAgent · 22KB · 5 category SSE)
 * SHIELD: do NOT add where:{accountId} to reads — RLS (account_id isolation) handles it
 * Note: Zod schemas inlined — @quanqn/schemas/entities has the canonical definition for client use
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getProgress } from '@/services/ip-progress/IPProgressService';
import { brandingAgent } from '@/specialists/BrandingAgent';
import { copywritingAgent, type CopywritingOutput } from '@/specialists/CopywritingAgent';
import { livestreamAgent } from '@/specialists/LivestreamAgent';
import { monetizationAgent } from '@/specialists/MonetizationAgent';
import { positioningAgent } from '@/specialists/PositioningAgent';
import { topicAgent, TOPIC_CATEGORIES } from '@/specialists/TopicAgent';
import { videoAgent } from '@/specialists/VideoAgent';
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
      return row ?? null;
    }),

  /** Returns all StepData rows for the current account (RLS filters) */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;
    // ✅ No where:{accountId} — RLS auto-filters
    return prisma.stepData.findMany({
      select: STEP_DATA_SELECT,
      orderBy: { updatedAt: 'desc' },
    });
  }),

  /**
   * AC-7: upserts StepData for the current account
   * Returns updated row so client hook can reconcile LS optimistic write
   * AC-5(US-004): step1 → positioningAgent(industry mode), step4 → positioningAgent(execution mode)
   */
  save: protectedProcedure
    .input(
      z.object({
        stepKey: stepKeySchema,
        inputs: z.record(z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

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

      // AC-5(US-004): call PositioningAgent for step1 and step4
      if (input.stepKey === 'step1' || input.stepKey === 'step4') {
        const mode = input.stepKey === 'step1' ? 'industry' : 'execution';
        const agentRes = await positioningAgent.execute({
          accountId: activeAccountId!,
          mode,
          userInput: input.inputs,
          traceId: traceId ?? undefined,
          stepKey: input.stepKey,
        });
        // Persist agent result back to the same row
        const updatedRow = await prisma.stepData.update({
          where: {
            accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey },
          },
          data: {
            result: agentRes.result as Prisma.InputJsonValue,
            isFallback: agentRes.isFallback,
            status: agentRes.isFallback ? 'fallback' : 'completed',
            durationMs: agentRes.durationMs,
            tokensUsed: agentRes.tokensUsed.total,
            modelUsed: agentRes.modelUsed,
            agentId: 'PositioningAgent',
          },
          select: STEP_DATA_SELECT,
        });
        return { ok: true, data: updatedRow };
      }

      // AC-4(US-005): call BrandingAgent for step3(packaging) and step3b(persona)
      if (input.stepKey === 'step3' || input.stepKey === 'step3b') {
        const mode = input.stepKey === 'step3' ? 'packaging' : 'persona';
        const agentRes = await brandingAgent.execute({
          accountId: activeAccountId!,
          mode,
          userInput: input.inputs,
          traceId: traceId ?? undefined,
          stepKey: input.stepKey,
        });
        const updatedRow = await prisma.stepData.update({
          where: {
            accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey },
          },
          data: {
            result: agentRes.result as Prisma.InputJsonValue,
            isFallback: agentRes.isFallback,
            status: agentRes.isFallback ? 'fallback' : 'completed',
            durationMs: agentRes.durationMs,
            tokensUsed: agentRes.tokensUsed.total,
            modelUsed: agentRes.modelUsed,
            agentId: 'BrandingAgent',
          },
          select: STEP_DATA_SELECT,
        });
        return { ok: true, data: updatedRow };
      }

      // AC-3(US-006): call MonetizationAgent for step4b
      if (input.stepKey === 'step4b') {
        const agentRes = await monetizationAgent.execute({
          accountId: activeAccountId!,
          userInput: input.inputs,
          traceId: traceId ?? undefined,
          stepKey: input.stepKey,
        });
        const updatedRow = await prisma.stepData.update({
          where: {
            accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey },
          },
          data: {
            result: agentRes.result as Prisma.InputJsonValue,
            isFallback: agentRes.isFallback,
            status: agentRes.isFallback ? 'fallback' : 'completed',
            durationMs: agentRes.durationMs,
            tokensUsed: agentRes.tokensUsed.total,
            modelUsed: agentRes.modelUsed,
            agentId: 'MonetizationAgent',
          },
          select: STEP_DATA_SELECT,
        });
        return { ok: true, data: updatedRow };
      }

      // AC-4(US-008): call VideoAgent for step6 (shooting mode)
      if (input.stepKey === 'step6') {
        const agentRes = await videoAgent.execute({
          accountId: activeAccountId!,
          mode: 'shooting',
          userInput: input.inputs,
          traceId: traceId ?? undefined,
          stepKey: input.stepKey,
        });
        const updatedRow = await prisma.stepData.update({
          where: {
            accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey },
          },
          data: {
            result: agentRes.result as Prisma.InputJsonValue,
            isFallback: agentRes.isFallback,
            status: agentRes.isFallback ? 'fallback' : 'completed',
            durationMs: agentRes.durationMs,
            tokensUsed: agentRes.tokensUsed.total,
            modelUsed: agentRes.modelUsed,
            agentId: 'VideoAgent',
          },
          select: STEP_DATA_SELECT,
        });
        return { ok: true, data: updatedRow };
      }

      // US-017: call TopicAgent for step5 via save (sync · 允许 e2e 走 UI form 路径)
      if (input.stepKey === 'step5') {
        const inputs = input.inputs;
        const category = ((inputs['lastCategory'] as string) || 'traffic') as typeof TOPIC_CATEGORIES[number];
        const agentRes = await topicAgent.execute({
          accountId: activeAccountId!,
          userInput: { category, ...inputs },
          traceId: traceId ?? undefined,
          stepKey: input.stepKey,
        });
        const updatedRow = await prisma.stepData.update({
          where: { accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey } },
          data: {
            result: agentRes.result as Prisma.InputJsonValue,
            isFallback: agentRes.isFallback,
            status: agentRes.isFallback ? 'fallback' : 'completed',
            durationMs: agentRes.durationMs,
            tokensUsed: agentRes.tokensUsed.total,
            modelUsed: agentRes.modelUsed,
            agentId: 'TopicAgent',
          },
          select: STEP_DATA_SELECT,
        });
        return { ok: true, data: updatedRow };
      }

      // US-017: call CopywritingAgent for step7 via save (sync · 允许 e2e 走 UI form 路径)
      if (input.stepKey === 'step7') {
        const agentRes = await copywritingAgent.execute({
          accountId: activeAccountId!,
          mode: 'step7',
          userInput: input.inputs,
          traceId: traceId ?? undefined,
          stepKey: input.stepKey,
        });
        const updatedRow = await prisma.stepData.update({
          where: { accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey } },
          data: {
            result: agentRes.result as Prisma.InputJsonValue,
            isFallback: agentRes.isFallback,
            status: agentRes.isFallback ? 'fallback' : 'completed',
            durationMs: agentRes.durationMs,
            tokensUsed: agentRes.tokensUsed.total,
            modelUsed: agentRes.modelUsed,
            agentId: 'CopywritingAgent',
          },
          select: STEP_DATA_SELECT,
        });
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
        return { ok: true, data: updatedRow };
      }

      // AC-3(US-010): call LivestreamAgent for step8 · sub_function discriminator (US-007)
      if (input.stepKey === 'step8') {
        const sub_function = String(input.inputs['sub_function'] ?? 'generate_plan');
        const agentRes = await livestreamAgent.execute({
          accountId: activeAccountId!,
          // Runtime inputSchema.parse validates experience enum; cast here for TS only
          userInput: input.inputs as Parameters<typeof livestreamAgent.execute>[0]['userInput'],
          traceId: traceId ?? undefined,
          stepKey: input.stepKey,
        });

        // Transform result based on sub_function discriminator
        let transformedResult: Record<string, unknown>;
        if (sub_function === 'optimize_script') {
          // optimize_script: lastResult → optimized_text, lastOptimizedResult → optimization_notes
          transformedResult = {
            sub_function: 'optimize_script',
            optimized_text: agentRes.result.lastResult,
            optimization_notes: agentRes.result.lastOptimizedResult,
          };
        } else {
          // generate_plan: split lastResult into 6 labeled sections
          const sections = agentRes.result.lastResult.split(/\n{2,}/).filter((s) => s.trim());
          const getSection = (i: number): string =>
            sections[i] ?? sections[0] ?? agentRes.result.lastResult;
          transformedResult = {
            sub_function: 'generate_plan',
            opening: getSection(0),
            interaction: getSection(1),
            deal: getSection(2),
            closing: getSection(3),
            traffic: getSection(4),
            engagement:
              sections.length > 5 ? getSection(5) : agentRes.result.lastOptimizedResult,
          };
        }

        const updatedRow = await prisma.stepData.update({
          where: {
            accountId_stepKey: { accountId: activeAccountId!, stepKey: input.stepKey },
          },
          data: {
            result: transformedResult as Prisma.InputJsonValue,
            isFallback: agentRes.isFallback,
            status: agentRes.isFallback ? 'fallback' : 'completed',
            durationMs: agentRes.durationMs,
            tokensUsed: agentRes.tokensUsed.total,
            modelUsed: agentRes.modelUsed,
            agentId: 'LivestreamAgent',
          },
          select: STEP_DATA_SELECT,
        });
        return { ok: true, data: updatedRow };
      }

      return { ok: true, data: row };
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
      const { prisma, activeAccountId, traceId } = ctx;

      // yield started immediately → 首 chunk < 3s
      yield { type: 'started' as const, traceId: traceId ?? '' };

      try {
        if (input.stepKey === 'step5') {
          const agentRes = await topicAgent.execute({
            accountId: activeAccountId!,
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
