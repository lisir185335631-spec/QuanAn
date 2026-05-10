/**
 * copywriting router — PRD-2 US-004 · PRD-4 US-009 · PRD-5 US-003 · PRD-6 US-012
 * AC-1: 4 procedures (generate/optimize/list/delete) + freeGenerate(PRD-5) + acquisitionGenerate(PRD-6)
 * US-009 AC-5: generate → 改调 copywritingAgent(mode='step7')· 写真实 markdown 到 history
 *              optimize / list / delete 保留现有 mock(留 PRD-5)
 * US-009 AC-7: generate 写 history 表(memory.l2_write=['history'])
 * US-003 AC-1: freeGenerate protectedProcedure · 调 copywritingAgent(mode='free')
 * US-003 AC-2: history.create 写完整字段(agentMode/contentType/scriptType/elements/isFallback/tokensUsed/modelUsed/durationMs)
 * US-012 AC-1: acquisitionGenerate protectedProcedure · 调 copywritingAgent(mode='acquisition')
 * US-012 AC-4: post-validate CTA grep('关注|私信|点击|获取|领取') · 缺失则 retry 1 次
 * Note: Zod schemas inlined — @quanqn/schemas/specialist-io has canonical definition for client use
 */

import { z } from 'zod';

import { copywritingAgent, type CopywritingOutput, type CopywritingFreeOutput, type CopywritingAcquisitionOutput } from '@/specialists/CopywritingAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

// ── PRD-5 US-003: freeGenerate input schema (inline equiv of @quanqn/schemas/specialist-io copywritingFreeGenerateInput) ──

const SCRIPT_TYPE_ENUM = [
  'tutorial', 'review', 'case_study', 'pov', 'monologue',
  'debate', 'list_pop', 'before_after', 'street_interview', 'qa_short',
  'reaction', 'mixcut', 'screen_record', 'animation', 'vlog',
  'plot', 'voice_only', 'comparison', 'storytelling', 'duo_chat',
] as const;

const HOT_ELEMENT_ENUM = [
  'greed', 'fear', 'curiosity', 'contrast',
  'resonance', 'empathy', 'social_proof', 'authority', 'leverage', 'worst',
  'reveal', 'controversy', 'challenge', 'transformation', 'anger', 'surprise',
  'trend', 'list', 'scarcity', 'small_big', 'low_cost_high', 'low_cost_unknown',
] as const;

const copywritingFreeGenerateInput = z.object({
  scriptType: z.enum(SCRIPT_TYPE_ENUM),
  elements: z.array(z.enum(HOT_ELEMENT_ENUM)).min(1).max(8),
  topic: z.string().min(1).max(500),
});

// US-012: acquisitionGenerate input schema (inline equiv of @quanqn/schemas/specialist-io acquisitionCopywritingInputSchema)
const acquisitionCopywritingInputSchema = z.object({
  scriptType: z.enum(SCRIPT_TYPE_ENUM),
  elements: z.array(z.enum(HOT_ELEMENT_ENUM)).min(1).max(8),
  conversionGoal: z.string().min(1, '转化目标必填'),
  topic: z.string().min(1).max(500),
});

// US-012: CTA post-validate keywords
const CTA_PATTERN = /关注|私信|点击|获取|领取/;
function markdownHasCTA(markdown: string): boolean {
  return CTA_PATTERN.test(markdown);
}

const generateCopywritingInput = z.object({
  stepKey: z.string().min(1).max(64),
  tone: z.string().max(32).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  context: z.record(z.unknown()).optional(),
});

const optimizeCopywritingInput = z.object({
  historyId: z.number().int().positive(),
  instruction: z.string().min(1).max(500),
});

const listCopywritingInput = z.object({
  stepKey: z.string().min(1).max(64).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const deleteCopywritingInput = z.object({
  historyId: z.number().int().positive(),
});

const HISTORY_SELECT = {
  id: true,
  content: true,
  agentId: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

// Extended select for freeGenerate — includes all fields written by US-003
const HISTORY_FREE_SELECT = {
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

export const copywritingRouter = router({
  /**
   * US-009 AC-5: generate → 改调 copywritingAgent(step7 mode)
   * AC-7: 写 history 表(memory.l2_write=['history'])
   */
  generate: protectedProcedure
    .input(generateCopywritingInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      // US-009: call CopywritingAgent (step7 mode) with user context
      const agentRes = await copywritingAgent.execute({
        accountId: activeAccountId!,
        mode: 'step7',
        userInput: input.context ?? {},
        traceId: traceId ?? undefined,
        stepKey: input.stepKey,
      });

      // AC-7: write History row with real markdown result (step7 mode always returns CopywritingOutput)
      const markdown = (agentRes.result as CopywritingOutput).markdown;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'CopywritingAgent',
          sourceType: 'user',
          inputSummary: input.stepKey,
          content: markdown,
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),

  /** Optimize existing copywriting (P1 mock · PRD-5) */
  optimize: protectedProcedure
    .input(optimizeCopywritingInput)
    .mutation(async ({ ctx, input: _input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'CopywritingAgent',
          sourceType: 'user',
          inputSummary: '[mock optimize]',
          content: '[mock]',
          traceId: traceId ?? null,
        },
        select: HISTORY_SELECT,
      });
      return row;
    }),

  /** List copywriting history for current account (RLS auto-filters by account) */
  list: protectedProcedure
    .input(listCopywritingInput)
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      return prisma.history.findMany({
        where: { agentId: 'CopywritingAgent' },
        select: HISTORY_SELECT,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  /** Delete a copywriting history entry */
  delete: protectedProcedure
    .input(deleteCopywritingInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      await prisma.history.delete({ where: { id: input.historyId } });
      return { ok: true };
    }),

  /**
   * PRD-5 US-003 AC-1: freeGenerate — /generate 工具页后端
   * D-026 选项 B: 不动既有 generate procedure · 新增独立 freeGenerate
   * AC-2: history.create 写完整字段(agentMode/contentType/scriptType/elements/isFallback等)
   * AC-7: SchemaValidationError → BaseSpecialist fallback path → agentRes.isFallback=true
   * AC-8: cost_log 由 BaseSpecialist 自动写入(eventType="specialist_call")
   */
  freeGenerate: protectedProcedure
    .input(copywritingFreeGenerateInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      const agentRes = await copywritingAgent.execute({
        accountId: activeAccountId!,
        mode: 'free',
        userInput: input,
        traceId: traceId ?? undefined,
      });

      const freeResult = agentRes.result as CopywritingFreeOutput;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'CopywritingAgent',
          agentMode: 'free',
          sourceType: 'user',
          inputSummary: input.topic.substring(0, 100),
          content: freeResult.markdown,
          contentType: 'markdown',
          scriptType: input.scriptType,
          elements: input.elements,
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed.total,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_FREE_SELECT,
      });
      return row;
    }),

  /**
   * PRD-6 US-012 AC-1: acquisitionGenerate — /generate acquisition mode 后端
   * 沿用 D-026 命名规则 · 不破坏 generate / freeGenerate
   * AC-2: history.create agentId='CopywritingAgent' · agentMode='acquisition' · contentType='markdown'
   * AC-3: explicit accountId 双层防护 (LD-009)
   * AC-4: post-validate CTA grep('关注|私信|点击|获取|领取') · 缺失则 retry 1 次
   * AC-5: cost_log 由 BaseSpecialist 自动写入(callType='specialist_call')
   */
  acquisitionGenerate: protectedProcedure
    .input(acquisitionCopywritingInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      let agentRes = await copywritingAgent.execute({
        accountId: activeAccountId!,
        mode: 'acquisition',
        userInput: { scriptType: input.scriptType, elements: input.elements, conversionGoal: input.conversionGoal, topic: input.topic },
        traceId: traceId ?? undefined,
      });

      // AC-4: post-validate CTA — retry once if CTA keyword missing (not fallback path)
      if (!agentRes.isFallback) {
        const firstMarkdown = (agentRes.result as CopywritingAcquisitionOutput).markdown;
        if (!markdownHasCTA(firstMarkdown)) {
          agentRes = await copywritingAgent.execute({
            accountId: activeAccountId!,
            mode: 'acquisition',
            userInput: { scriptType: input.scriptType, elements: input.elements, conversionGoal: input.conversionGoal, topic: input.topic },
            traceId: traceId ?? undefined,
          });
        }
      }

      const acquisitionResult = agentRes.result as CopywritingAcquisitionOutput;
      const row = await prisma.history.create({
        data: {
          accountId: activeAccountId!,
          agentId: 'CopywritingAgent',
          agentMode: 'acquisition',
          sourceType: 'user',
          inputSummary: input.topic.substring(0, 100),
          content: acquisitionResult.markdown,
          contentType: 'markdown',
          scriptType: input.scriptType,
          elements: input.elements,
          isFallback: agentRes.isFallback,
          tokensUsed: agentRes.tokensUsed.total,
          modelUsed: agentRes.modelUsed,
          durationMs: agentRes.durationMs,
          traceId: traceId ?? null,
        },
        select: HISTORY_FREE_SELECT,
      });
      return row;
    }),
});
