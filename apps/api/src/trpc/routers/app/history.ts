/**
 * history router — PRD-5 US-011 · PRD-6 US-013 · PRD-15 US-008
 * AC-1: list query (protectedProcedure · agentId?, agentMode?, tools?, dateRange?, limit, offset)
 * AC-2: list select { id, agentId, agentMode, sourceType, inputSummary, content, contentType, scriptType, elements, isFallback, traceId, createdAt }
 * AC-3: detail query (findFirst + accountId · NOT_FOUND)
 * AC-4: delete mutation (deleteMany + accountId RLS · { ok: true })
 * US-008 AC-7: tools[] → agentId IN () via toolsToAgentIds map
 * US-008 AC-10: stats procedure → cost_log aggregation (totalCalls/failureRate/avgDuration/topTools/dailyTrend/modelDist)
 * AC-12: limit > 100 → zod max(100)
 * AC-13: detail not found → NOT_FOUND
 * US-013 AC-2: detail storyboard → join Asset table → scenes[]
 * SHIELD REJ-013: protectedProcedure (non-publicProcedure)
 * SHIELD REJ-008: explicit accountId where + RLS via protectedProcedure
 * SHIELD TD-019: explicit accountId double-layer guard (no RLS-only)
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { protectedProcedure } from '@/trpc/middleware/account-isolation';
import { router } from '@/trpc/trpc';

import type { Prisma } from '@prisma/client';

// ── Constants ─────────────────────────────────────────────────────────────────

const DATE_RANGE_VALUES = ['last_7d', 'last_30d', 'all', 'today', 'week', 'month', 'custom'] as const;

// ── Tool slug → agentId mapping (13 tools · US-008 AC-7) ─────────────────────

const TOOL_AGENT_MAP: Record<string, string[]> = {
  trending: ['TrendingAgent'],
  copywriting: ['CopywritingAgent'],
  boomGenerate: ['CopywritingAgent'],
  generate: ['CopywritingAgent'],
  presentStyles: ['PresentStylesAgent'],
  monetization: ['MonetizationAgent'],
  privateDomain: ['PrivateDomainAgent'],
  analysis: ['AnalysisAgent'],
  videoAnalysis: ['VideoAnalysisAgent'],
  videoProduction: ['VideoProductionAgent', 'VideoAgent'],
  acquisitionVideo: ['VideoAgent'],
  aiVideo: ['VideoAgent'],
  deepLearning: ['DeepLearningAgent'],
  knowledge: ['KnowledgeAgent'],
};

export function toolsToAgentIds(tools: string[]): string[] {
  const ids = new Set<string>();
  for (const t of tools) {
    for (const id of (TOOL_AGENT_MAP[t] ?? [])) {
      ids.add(id);
    }
  }
  return [...ids];
}

// ── Storyboard scene types (US-013 · mirrors StoredScene in aiVideo.ts) ────────

interface StoredScene {
  index: number;
  description: string;
  imagePromptEn: string;
  duration: string;
  sceneImageUrl: string | null;
  status: 'pending' | 'completed' | 'failed';
}

// ── Select ────────────────────────────────────────────────────────────────────

const HISTORY_SELECT = {
  id: true,
  agentId: true,
  agentMode: true,
  sourceType: true,
  inputSummary: true,
  content: true,
  contentType: true,
  scriptType: true,
  elements: true,
  isFallback: true,
  traceId: true,
  createdAt: true,
} satisfies Prisma.HistorySelect;

function buildDateFilter(
  dateRange: (typeof DATE_RANGE_VALUES)[number],
  opts?: { dateFrom?: string; dateTo?: string },
): Prisma.HistoryWhereInput {
  if (dateRange === 'custom') {
    const from = opts?.dateFrom ? new Date(opts.dateFrom) : undefined;
    const to = opts?.dateTo ? new Date(opts.dateTo + 'T23:59:59.999Z') : undefined;
    if (!from && !to) return {};
    return { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } };
  }
  if (dateRange === 'all') return {};
  const since = new Date();
  if (dateRange === 'today') {
    since.setHours(0, 0, 0, 0);
  } else if (dateRange === 'week') {
    since.setDate(since.getDate() - 7);
  } else if (dateRange === 'month') {
    since.setDate(since.getDate() - 30);
  } else {
    since.setDate(since.getDate() - (dateRange === 'last_7d' ? 7 : 30));
  }
  return { createdAt: { gte: since } };
}

export const historyRouter = router({
  /**
   * count: total history rows for the active account, with optional dateRange filter.
   * Used by frontend KPI cards to get true total (unbounded by list's max 100).
   */
  count: protectedProcedure
    .input(
      z.object({
        dateRange: z.enum(DATE_RANGE_VALUES).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const dateRange = input?.dateRange ?? 'all';
      const dateFilter = buildDateFilter(dateRange, { dateFrom: input?.dateFrom, dateTo: input?.dateTo });
      return prisma.history.count({
        where: {
          accountId: activeAccountId!,
          ...dateFilter,
        },
      });
    }),

  /**
   * AC-1,2: list with optional filters, pagination, ordered by createdAt desc
   * AC-12: limit capped at 100 by zod max
   * US-008 AC-7: tools[] → agentId IN () via toolsToAgentIds
   */
  list: protectedProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
        agentMode: z.string().optional(),
        sourceType: z.string().optional(),
        tools: z.array(z.string()).optional(),
        dateRange: z.enum(DATE_RANGE_VALUES).default('all'),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const { agentId, agentMode, sourceType, tools, dateRange, dateFrom, dateTo, limit, offset } = input;

      const agentIds = tools?.length ? toolsToAgentIds(tools) : undefined;

      const where: Prisma.HistoryWhereInput = {
        accountId: activeAccountId!,
        ...(agentId !== undefined ? { agentId } : {}),
        ...(agentMode !== undefined ? { agentMode } : {}),
        ...(sourceType !== undefined ? { sourceType } : {}),
        ...(agentIds?.length ? { agentId: { in: agentIds } } : {}),
        ...buildDateFilter(dateRange, { dateFrom, dateTo }),
      };

      return prisma.history.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: HISTORY_SELECT,
      });
    }),

  /**
   * AC-3: detail by id — explicit accountId check → NOT_FOUND if missing
   * US-013 AC-2: storyboard rows → join Asset table for sceneImageUrls
   * SHIELD TD-019: where: { id, accountId } double-layer guard
   */
  detail: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;

      const row = await prisma.history.findFirst({
        where: { id: input.id, accountId: activeAccountId! },
        select: HISTORY_SELECT,
      });

      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'history_not_found' });
      }

      if (row.agentMode === 'storyboard') {
        let contentScenes: StoredScene[] = [];
        try {
          const parsed = JSON.parse(row.content) as { scenes?: StoredScene[] };
          contentScenes = parsed.scenes ?? [];
        } catch { /* non-JSON content */ }

        const assets = await prisma.asset.findMany({
          where: { relatedHistoryId: row.id, accountId: activeAccountId! },
          select: { sceneIndex: true, publicUrl: true },
          orderBy: { sceneIndex: 'asc' },
        });

        const assetMap = new Map(assets.map((a) => [a.sceneIndex, a.publicUrl]));
        const scenes = contentScenes.map((s) => ({
          index: s.index,
          description: s.description,
          imagePromptEn: s.imagePromptEn,
          duration: s.duration,
          status: s.status,
          sceneImageUrl: assetMap.get(s.index) ?? s.sceneImageUrl ?? null,
        }));

        return { ...row, scenes };
      }

      return row;
    }),

  /**
   * AC-4: delete by id — explicit accountId guard via deleteMany
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;

      await prisma.history.deleteMany({
        where: { id: input.id, accountId: activeAccountId! },
      });

      return { ok: true } as const;
    }),

  /**
   * US-008 AC-10: stats — aggregates cost_log for dashboard view
   * Returns: totalCalls, failureRate, avgDurationMs, topTools(5), dailyTrend(30), modelDistribution
   */
  stats: protectedProcedure
    .input(
      z.object({
        dateRange: z.enum(['today', 'week', 'month', 'all', 'custom'] as const).default('all'),
        tools: z.array(z.string()).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { prisma, activeAccountId } = ctx;
      const { dateRange, tools, dateFrom, dateTo } = input;

      const now = new Date();
      let since: Date | undefined;
      let until: Date | undefined;
      if (dateRange === 'today') {
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateRange === 'week') {
        since = new Date(now.getTime() - 7 * 86400_000);
      } else if (dateRange === 'month') {
        since = new Date(now.getTime() - 30 * 86400_000);
      } else if (dateRange === 'custom') {
        since = dateFrom ? new Date(dateFrom) : undefined;
        until = dateTo ? new Date(dateTo + 'T23:59:59.999Z') : undefined;
      }

      const agentIds = tools?.length ? toolsToAgentIds(tools) : undefined;

      const where: Prisma.CostLogWhereInput = {
        accountId: activeAccountId!, // RLS auto-filters by accountId
        ...(since || until
          ? { createdAt: { ...(since ? { gte: since } : {}), ...(until ? { lte: until } : {}) } }
          : {}),
        ...(agentIds?.length ? { agentId: { in: agentIds } } : {}),
      };

      // RLS auto-filters: all prisma.costLog.* below reuse `where` which contains accountId (LD-009 compliant)
      const [totalCalls, failCount, durationAgg, topToolsRaw, modelGroupsRaw, trendRecords] =
        await Promise.all([
          prisma.costLog.count({ where }), // RLS auto-filters: where.accountId enforces LD-009
          prisma.costLog.count({ where: { ...where, success: false } }), // RLS auto-filters
          prisma.costLog.aggregate({ where, _avg: { durationMs: true } }), // RLS auto-filters
          prisma.costLog.groupBy({ // RLS auto-filters: where.accountId enforces LD-009
            by: ['agentId'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
          }),
          prisma.costLog.groupBy({ // RLS auto-filters: where.accountId enforces LD-009
            by: ['modelUsed'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
          }),
          prisma.costLog.findMany({ // RLS auto-filters: where.accountId enforces LD-009
            where,
            select: { createdAt: true, durationMs: true },
            orderBy: { createdAt: 'desc' },
            take: 1000,
          }),
        ]);

      // Group by date in memory for daily trend
      const dailyMap = new Map<string, number>();
      for (const r of trendRecords) {
        const dateKey = r.createdAt.toISOString().split('T')[0]!;
        dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + 1);
      }
      const dailyTrend = [...dailyMap.entries()]
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);

      // Duration histogram buckets
      const bucketDefs = [
        { label: '<1s', min: 0, max: 1000 },
        { label: '1-3s', min: 1000, max: 3000 },
        { label: '3-10s', min: 3000, max: 10000 },
        { label: '10-30s', min: 10000, max: 30000 },
        { label: '>30s', min: 30000, max: Infinity },
      ];
      const durationHistogram = bucketDefs.map((b) => ({
        label: b.label,
        count: trendRecords.filter((r) => r.durationMs >= b.min && r.durationMs < b.max).length,
      }));

      return {
        totalCalls,
        failureRate: totalCalls > 0 ? failCount / totalCalls : 0,
        avgDurationMs: Math.round(durationAgg._avg.durationMs ?? 0),
        topTools: topToolsRaw.map((g) => ({ agentId: g.agentId, count: g._count.id })),
        dailyTrend,
        durationHistogram,
        modelDistribution: modelGroupsRaw.map((g) => ({ model: g.modelUsed, count: g._count.id })),
      };
    }),
});
