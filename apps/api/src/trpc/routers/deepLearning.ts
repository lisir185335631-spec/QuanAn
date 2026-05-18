/**
 * deepLearning router — PRD-2 US-005, PRD-15 US-003
 * AC-4: procedures (list/create/createFromFile/learn/delete/parse/applyFormula)
 * PRD-15 US-003 AC-6: parse + applyFormula (mock — DeepLearnAgent 留 PRD-7+)
 * PRD-15 US-003: list returns DeepLearnReviewQueue entries for immediate UI visibility
 * LD-A-5: no direct archive create — only admin review flow may create archive entries
 */

import { z } from 'zod';

import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';


const listInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
  onlyActive: z.boolean().default(true),
});

const createInput = z.object({
  sample: z.string().min(1).max(10000),
  userTitle: z.string().max(100).optional(),
  userTags: z.array(z.string().max(32)).max(10).default([]),
});

const createFromFileInput = z.object({
  fileUrl: z.string().url(),
  userTitle: z.string().max(100).optional(),
  userTags: z.array(z.string().max(32)).max(10).default([]),
});

const learnInput = z.object({
  archiveId: z.number().int().positive(),
});

const deleteInput = z.object({
  archiveId: z.number().int().positive(),
});

// PRD-15 US-003: parse + applyFormula
const parseInput = z.object({
  sample: z.string().min(100).max(10000),
  sourcePlatform: z.string().min(1).max(32),
});

const applyFormulaInput = z.object({
  queueId: z.number().int().positive(),
  newTopic: z.string().min(1).max(500),
});

/** Mock DeepLearnAgent analysis — PRD-15 P1, real agent留 PRD-7+ */
function mockAnalysis(sample: string) {
  const words = sample.slice(0, 200);
  return {
    coreFormula: '痛点-解决方案-信任背书',
    hookType: '问题引发共鸣',
    structurePattern: '开头悬念 → 中段铺陈 → 结尾行动号召',
    emotionalArc: '焦虑 → 共鸣 → 希望 → 行动',
    keywords: words
      .split(/[\s,，。！？,.!?]+/)
      .filter((w) => w.length >= 2 && w.length <= 6)
      .slice(0, 6),
  };
}

export const deepLearningRouter = router({
  /**
   * PRD-15 US-003: list returns DeepLearnReviewQueue for immediate visibility.
   * Maps autoScanResult JSON to structured queue item format.
   */
  list: protectedProcedure
    .input(listInput)
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const rows = await prisma.deepLearnReviewQueue.findMany({
        where: {
          accountId: activeAccountId!,
          ...(input.onlyActive ? { status: { not: 'cancelled' } } : {}),
        },
        orderBy: { uploadedAt: 'desc' },
        take: input.limit,
        skip: input.offset,
        select: {
          id: true,
          fileName: true,
          fileMime: true,
          autoScanResult: true,
          status: true,
          uploadedAt: true,
        },
      });

      return rows.map((r) => {
        const meta = (r.autoScanResult ?? {}) as Record<string, unknown>;
        const analysis = (meta.analysis ?? {}) as Record<string, unknown>;
        const sample =
          typeof meta.redactedTextPreview === 'string' ? meta.redactedTextPreview : r.fileName;
        return {
          id: r.id,
          sample,
          sourcePlatform: typeof meta.sourcePlatform === 'string' ? meta.sourcePlatform : '未知',
          coreFormula:
            typeof analysis.coreFormula === 'string' ? analysis.coreFormula : '待解析',
          status: r.status,
          createdAt: r.uploadedAt,
        };
      });
    }),

  /** Submit a text sample to the deep learn review queue (P1 mock — LD-A-5: no direct archive.create) */
  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, user } = ctx;
      const hash = Buffer.from(input.sample.slice(0, 64)).toString('base64url');
      const queue = await prisma.deepLearnReviewQueue.create({
        data: {
          userId: user!.id,
          accountId: activeAccountId!,
          fileName: input.userTitle ?? 'text-sample',
          fileMime: 'text/plain',
          fileSize: Buffer.byteLength(input.sample, 'utf8'),
          fileUrl: `mock-s3://text-sample/${hash}`,
          autoScanResult: { note: 'p1-mock-text-upload', redactedTextPreview: input.sample.slice(0, 200) },
          autoVerdict: 'needs_review',
          status: 'pending',
        },
        select: { id: true, status: true, autoVerdict: true },
      });
      return { ok: true as const, queueId: queue.id, status: queue.status };
    }),

  /** Submit a file URL to the deep learn review queue (P1 mock — FileParser 留 PRD-7+, LD-A-5) */
  createFromFile: protectedProcedure
    .input(createFromFileInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, user } = ctx;
      const queue = await prisma.deepLearnReviewQueue.create({
        data: {
          userId: user!.id,
          accountId: activeAccountId!,
          fileName: input.userTitle ?? 'file-upload',
          fileMime: 'application/octet-stream',
          fileSize: 0,
          fileUrl: input.fileUrl,
          autoScanResult: { note: 'p1-mock-file-upload' },
          autoVerdict: 'needs_review',
          status: 'pending',
        },
        select: { id: true, status: true, autoVerdict: true },
      });
      return { ok: true as const, queueId: queue.id, status: queue.status };
    }),

  /** Trigger learning for an archive entry (P1 mock — DeepLearnAgent 留 PRD-7+) */
  learn: protectedProcedure
    .input(learnInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      await prisma.deepLearningArchive.update({
        where: { id: input.archiveId },
        data: { learningStatus: 'pending' },
      });
      return { ok: true, status: 'queued' as const };
    }),

  /** Soft-cancel a deep learn queue entry */
  delete: protectedProcedure
    .input(deleteInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      await prisma.deepLearnReviewQueue.update({
        where: { id: input.archiveId, accountId: activeAccountId! },
        data: { status: 'cancelled' },
      });
      return { ok: true };
    }),

  /**
   * PRD-15 US-003 AC-2: parse text sample → structured analysis (mock for P1)
   * Creates a DeepLearnReviewQueue entry with analysis stored in autoScanResult.
   * LD-A-5: no direct archive creation — goes through review queue only
   */
  parse: protectedProcedure
    .input(parseInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId, user } = ctx;
      const analysis = mockAnalysis(input.sample);
      const hash = Buffer.from(input.sample.slice(0, 64)).toString('base64url');
      const queue = await prisma.deepLearnReviewQueue.create({
        data: {
          userId: user!.id,
          accountId: activeAccountId!,
          fileName: `parse-${input.sourcePlatform}-${Date.now()}`,
          fileMime: 'text/plain',
          fileSize: Buffer.byteLength(input.sample, 'utf8'),
          fileUrl: `mock-s3://text-sample/${hash}`,
          autoScanResult: {
            note: 'prd15-parse',
            sourcePlatform: input.sourcePlatform,
            redactedTextPreview: input.sample.slice(0, 200),
            analysis,
          },
          autoVerdict: 'needs_review',
          status: 'pending',
        },
        select: { id: true },
      });
      return { queueId: queue.id, analysis };
    }),

  /**
   * PRD-15 US-003 AC-4: apply formula from a queue entry to generate new copywriting
   * Uses queue entry's analysis as formula prompt injection (mock P1)
   */
  applyFormula: protectedProcedure
    .input(applyFormulaInput)
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const entry = await prisma.deepLearnReviewQueue.findFirst({
        where: { id: input.queueId, accountId: activeAccountId! },
        select: { autoScanResult: true },
      });
      const meta = (entry?.autoScanResult ?? {}) as Record<string, unknown>;
      const analysis = (meta.analysis ?? {}) as Record<string, unknown>;
      const formula = typeof analysis.coreFormula === 'string' ? analysis.coreFormula : '痛点-解决方案-信任背书';
      const structure = typeof analysis.structurePattern === 'string' ? analysis.structurePattern : '';

      const content = `# ${input.newTopic}\n\n（基于公式「${formula}」生成）\n\n${structure ? `结构：${structure}\n\n` : ''}这是根据您选择的文案公式为「${input.newTopic}」主题生成的内容。真实 AI 生成能力将在 PRD-7 DeepLearnAgent 上线后启用。`;
      return { content };
    }),
});
