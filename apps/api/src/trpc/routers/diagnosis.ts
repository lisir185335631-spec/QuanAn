/**
 * diagnosis router — PRD-2 US-005
 * AC-2: 3 procedures (generate/history/latest) · mock
 * AC-7: generate mutation writes DiagnosisReport row with trace_id
 * AC-8: no LLM call — DiagnosisAgent 留 PRD-6+
 */

import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { router } from '@/trpc/trpc';
import { protectedProcedure } from '@/trpc/middleware/account-isolation';

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
  createdAt: true,
} satisfies Prisma.DiagnosisReportSelect;

export const diagnosisRouter = router({
  /** Run 8-step questionnaire diagnosis (P1 mock — DiagnosisAgent 留 PRD-6+) */
  generate: protectedProcedure
    .input(generateDiagnosisInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, traceId } = ctx;
      const report = await prisma.diagnosisReport.create({
        data: {
          accountId: activeAccountId!,
          answers: input.answers as unknown as Prisma.InputJsonValue,
          dimensions: {} as Prisma.InputJsonValue,
          overallScore: 0,
          inferredStage: 'starter',
          topPriority: '[mock]',
          recommendedSteps: [],
          agentId: 'DiagnosisAgent',
          traceId: traceId ?? null,
          isFallback: true,
        },
        select: DIAGNOSIS_SELECT,
      });
      return report;
    }),

  /** List past diagnosis reports for the current account (RLS auto-filters) */
  history: protectedProcedure
    .input(historyDiagnosisInput)
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      return prisma.diagnosisReport.findMany({
        select: DIAGNOSIS_SELECT,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  /** Get the latest diagnosis report for the current account (RLS auto-filters) */
  latest: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;
    return prisma.diagnosisReport.findFirst({
      select: DIAGNOSIS_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }),
});
