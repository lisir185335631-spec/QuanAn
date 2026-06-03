/**
 * diagnosis router — PRD-25 US-001
 * AC-3: generate mutation 改 P1 mock → 真调 diagnosisAgent.execute
 * AC-14: cost_log 写入 (由 BaseSpecialist 自动处理)
 */

import { z } from 'zod';

import { diagnosisAgent } from '@/specialists/DiagnosisAgent';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';
import type { DiagnosisAnswer } from '@quanan/schemas/specialist-io';

// answers/dimensions 是 Json 列,但形状确定:answers=诊断输入(DiagnosisAnswer[]),
// dimensions=DiagnosisAgent 输出(每维 score/issues/suggestions)。收窄回域类型,对齐前端读取。
type DiagnosisDimensions = Record<string, { score: number; issues: string[]; suggestions: string[] }>;
const shapeDiagnosis = <T extends { answers: unknown; dimensions: unknown }>(r: T) => ({
  ...r,
  answers: r.answers as DiagnosisAnswer[],
  dimensions: r.dimensions as DiagnosisDimensions,
});

const generateDiagnosisInput = z.object({
  answers: z
    .array(
      z.object({
        dimension: z.string().min(1).max(64),
        score: z.number().int().min(0).max(10),
        comment: z.string().max(200).optional(),
      }),
    )
    .length(8),
  inferredStage: z.string().max(32).optional(),
});

const historyDiagnosisInput = z.object({
  limit: z.number().int().min(1).max(20).default(10),
  offset: z.number().int().min(0).default(0),
});

const DIAGNOSIS_SELECT = {
  id: true,
  answers: true,
  dimensions: true,
  overallScore: true,
  inferredStage: true,
  topPriority: true,
  recommendedSteps: true,
  agentId: true,
  traceId: true,
  isFallback: true,
  modelUsed: true,
  tokensUsed: true,
  durationMs: true,
  createdAt: true,
} satisfies Prisma.DiagnosisReportSelect;

export const diagnosisRouter = router({
  /** Run 8-step questionnaire → DiagnosisAgent LLM → DiagnosisReport (AC-3) */
  generate: protectedProcedure
    .input(generateDiagnosisInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;

      // AC-3: 真调 diagnosisAgent.execute
      const agentResponse = await diagnosisAgent.execute({
        accountId: activeAccountId!,
        userInput: { answers: input.answers },
        traceId: traceId ?? undefined,
        stepKey: 'diagnosis',
      });

      const result = agentResponse.result;
      const topPriority = result.priority[0] ?? '';
      const recommendedSteps = result.priority;

      const report = await prisma.diagnosisReport.create({
        data: {
          accountId: activeAccountId!,
          answers: input.answers as unknown as Prisma.InputJsonValue,
          dimensions: result.dimensions as unknown as Prisma.InputJsonValue,
          overallScore: Math.round(result.overallScore),
          inferredStage: input.inferredStage ?? 'starter',
          topPriority,
          recommendedSteps,
          agentId: 'DiagnosisAgent',
          traceId: agentResponse.traceId,
          isFallback: agentResponse.isFallback,
          modelUsed: agentResponse.modelUsed,
          tokensUsed: agentResponse.tokensUsed.total,
          durationMs: agentResponse.durationMs,
        },
        select: DIAGNOSIS_SELECT,
      });

      return shapeDiagnosis(report);
    }),

  /** List past diagnosis reports for the current account (RLS auto-filters) */
  history: protectedProcedure
    .input(historyDiagnosisInput)
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const rows = await prisma.diagnosisReport.findMany({
        select: DIAGNOSIS_SELECT,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
      return rows.map(shapeDiagnosis);
    }),

  /** Get the latest diagnosis report for the current account (RLS auto-filters) */
  latest: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;
    const report = await prisma.diagnosisReport.findFirst({
      select: DIAGNOSIS_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return report ? shapeDiagnosis(report) : null;
  }),
});
