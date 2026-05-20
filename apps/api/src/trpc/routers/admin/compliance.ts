// PRD-13 US-010 · adminRouter.compliance
// Data source: admin_audit_log eventCategory='compliance'
// 4 procedures: getKpiStats, getIndustryBreakdown, getTrend, listEvents
// SHIELD: payload redacted (LD-A-3) — only expose eventType + industry, never raw content/PII
// SHIELD: no raw payload fields that may contain user-generated text or PII

import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

import type { Prisma } from '@prisma/client';

// ── Constants ──────────────────────────────────────────────────────────────

const COMPLIANCE_CATEGORY = 'compliance';

// ── Helpers ────────────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Router ─────────────────────────────────────────────────────────────────

export const complianceRouter = adminTrpcRouter({
  /**
   * 4 KPI stats for compliance dashboard header.
   * Queries admin_audit_log eventCategory='compliance'.
   */
  getKpiStats: adminProcedure.query(async () => {
    const today = startOfToday();
    const sevenDaysAgo = daysAgo(7);
    const thirtyDaysAgo = daysAgo(30);

    // SHIELD: Promise.all 并行 · 不串行
    const [
      todayDisclaimerRows,
      bannedWordRows,
      piiRows,
      industryTop5Rows,
      bannedWordTrendRows,
      piiTrendRows,
    ] = await Promise.all([
      // KPI-1: 今日触发免责声明数 by industry
      prisma.$queryRaw<Array<{ industry: string | null; cnt: bigint }>>`
        SELECT "payload"->>'industry' AS industry, COUNT(*)::bigint AS cnt
        FROM "admin_audit_log"
        WHERE "eventCategory" = ${COMPLIANCE_CATEGORY}
          AND "eventType" = 'industry_disclaimer_triggered'
          AND "createdAt" >= ${today}
        GROUP BY "payload"->>'industry'
        ORDER BY cnt DESC
      `,
      // KPI-2: 命中违禁词次数 7天
      prisma.$queryRaw<Array<{ cnt: bigint }>>`
        SELECT COUNT(*)::bigint AS cnt
        FROM "admin_audit_log"
        WHERE "eventCategory" = ${COMPLIANCE_CATEGORY}
          AND "eventType" = 'banned_word_hit'
          AND "createdAt" >= ${sevenDaysAgo}
      `,
      // KPI-3: PII命中率 today
      prisma.$queryRaw<Array<{ pii_count: bigint; total_count: bigint }>>`
        SELECT
          COUNT(*) FILTER (WHERE "eventType" = 'pii_redacted')::bigint AS pii_count,
          COUNT(*)::bigint AS total_count
        FROM "admin_audit_log"
        WHERE "eventCategory" = ${COMPLIANCE_CATEGORY}
          AND "createdAt" >= ${today}
      `,
      // KPI-4: 行业 Top 5 (30天)
      prisma.$queryRaw<Array<{ industry: string | null; cnt: bigint }>>`
        SELECT "payload"->>'industry' AS industry, COUNT(*)::bigint AS cnt
        FROM "admin_audit_log"
        WHERE "eventCategory" = ${COMPLIANCE_CATEGORY}
          AND "createdAt" >= ${thirtyDaysAgo}
        GROUP BY "payload"->>'industry'
        ORDER BY cnt DESC
        LIMIT 5
      `,
      // 违禁词7天趋势
      prisma.$queryRaw<Array<{ date: Date; cnt: bigint }>>`
        SELECT DATE_TRUNC('day', "createdAt") AS date, COUNT(*)::bigint AS cnt
        FROM "admin_audit_log"
        WHERE "eventCategory" = ${COMPLIANCE_CATEGORY}
          AND "eventType" = 'banned_word_hit'
          AND "createdAt" >= ${sevenDaysAgo}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `,
      // PII7天趋势
      prisma.$queryRaw<Array<{ date: Date; pii_count: bigint; total_count: bigint }>>`
        SELECT
          DATE_TRUNC('day', "createdAt") AS date,
          COUNT(*) FILTER (WHERE "eventType" = 'pii_redacted')::bigint AS pii_count,
          COUNT(*)::bigint AS total_count
        FROM "admin_audit_log"
        WHERE "eventCategory" = ${COMPLIANCE_CATEGORY}
          AND "createdAt" >= ${sevenDaysAgo}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `,
    ]);

    const todayDisclaimerCount = todayDisclaimerRows.reduce((s, r) => s + Number(r.cnt), 0);
    const disclaimerByIndustry = todayDisclaimerRows.map((r) => ({
      industry: r.industry ?? 'unknown',
      count: Number(r.cnt),
    }));
    const bannedWordCount = Number(bannedWordRows[0]?.cnt ?? 0);
    const piiCount = Number(piiRows[0]?.pii_count ?? 0);
    const totalParsed = Number(piiRows[0]?.total_count ?? 0);
    const piiHitRate =
      totalParsed > 0 ? Math.round((piiCount / totalParsed) * 1000) / 10 : 0;
    const industryTop5 = industryTop5Rows.map((r) => ({
      industry: r.industry ?? 'unknown',
      count: Number(r.cnt),
    }));
    const bannedWordTrend = bannedWordTrendRows.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
      count: Number(r.cnt),
    }));
    const piiTrend = piiTrendRows.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
      piiCount: Number(r.pii_count),
      totalCount: Number(r.total_count),
      rate:
        Number(r.total_count) > 0
          ? Math.round((Number(r.pii_count) / Number(r.total_count)) * 1000) / 10
          : 0,
    }));

    return {
      todayDisclaimerCount,
      disclaimerByIndustry,
      bannedWordCount,
      bannedWordTrend,
      piiHitRate,
      piiCount,
      totalParsed,
      piiTrend,
      industryTop5,
    };
  }),

  /**
   * 56-industry breakdown for pie chart.
   * Returns top 10 industries + 'other' bucket for PieChart rendering.
   */
  getIndustryBreakdown: adminProcedure
    .input(
      z
        .object({
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const startDate = input?.startDate ?? daysAgo(30);
      const endDate = input?.endDate ?? new Date();

      const rows = await prisma.$queryRaw<Array<{ industry: string | null; cnt: bigint }>>`
        SELECT "payload"->>'industry' AS industry, COUNT(*)::bigint AS cnt
        FROM "admin_audit_log"
        WHERE "eventCategory" = ${COMPLIANCE_CATEGORY}
          AND "createdAt" BETWEEN ${startDate} AND ${endDate}
        GROUP BY "payload"->>'industry'
        ORDER BY cnt DESC
        LIMIT 100
      `;

      const all = rows.map((r) => ({
        industry: r.industry ?? 'unknown',
        count: Number(r.cnt),
      }));

      const top10 = all.slice(0, 10);
      const rest = all.slice(10);
      const otherCount = rest.reduce((s, r) => s + r.count, 0);
      const pieData = rest.length > 0 ? [...top10, { industry: '其他', count: otherCount }] : top10;

      return { all, pieData };
    }),

  /**
   * Time trend per industry (line chart).
   * Supports day/week/month groupBy + optional industry multi-select filter.
   */
  getTrend: adminProcedure
    .input(
      z.object({
        groupBy: z.enum(['day', 'week', 'month']).default('day'),
        industries: z.array(z.string()).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      const startDate = input.startDate ?? daysAgo(30);
      const endDate = input.endDate ?? new Date();
      const truncFn = input.groupBy;

      if (input.industries && input.industries.length > 0) {
        const rows = await prisma.$queryRaw<
          Array<{ date: Date; industry: string | null; cnt: bigint }>
        >`
          SELECT
            DATE_TRUNC(${truncFn}, "createdAt") AS date,
            "payload"->>'industry' AS industry,
            COUNT(*)::bigint AS cnt
          FROM "admin_audit_log"
          WHERE "eventCategory" = ${COMPLIANCE_CATEGORY}
            AND "createdAt" BETWEEN ${startDate} AND ${endDate}
            AND "payload"->>'industry' = ANY(${input.industries})
          GROUP BY DATE_TRUNC(${truncFn}, "createdAt"), "payload"->>'industry'
          ORDER BY date ASC, industry ASC
        `;

        return rows.map((r) => ({
          date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
          industry: r.industry ?? 'unknown',
          count: Number(r.cnt),
        }));
      }

      const rows = await prisma.$queryRaw<Array<{ date: Date; cnt: bigint }>>`
        SELECT
          DATE_TRUNC(${truncFn}, "createdAt") AS date,
          COUNT(*)::bigint AS cnt
        FROM "admin_audit_log"
        WHERE "eventCategory" = ${COMPLIANCE_CATEGORY}
          AND "createdAt" BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE_TRUNC(${truncFn}, "createdAt")
        ORDER BY date ASC
      `;

      return rows.map((r) => ({
        date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
        industry: null as string | null,
        count: Number(r.cnt),
      }));
    }),

  /**
   * Paginated compliance event list with optional grouping.
   * SHIELD: payload field is redacted — only payloadSummary (eventType + industry) is exposed.
   * SHIELD: userId is masked as "user-{id}" — never exposes raw email or PII.
   */
  listEvents: adminProcedure
    .input(
      z.object({
        cursor: z.number().int().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        grouping: z.enum(['none', 'eventType', 'industry']).default('none'),
        industryFilter: z.string().optional(),
        eventTypeFilter: z
          .enum(['pii_redacted', 'banned_word_hit', 'industry_disclaimer_triggered'])
          .optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { cursor, limit, industryFilter, eventTypeFilter, startDate, endDate } = input;

      const where: Prisma.AdminAuditLogWhereInput = {
        eventCategory: COMPLIANCE_CATEGORY,
        ...(cursor ? { id: { lt: cursor } } : {}),
        ...(eventTypeFilter ? { eventType: eventTypeFilter } : {}),
        ...(startDate ?? endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      };

      const rawItems = await prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        select: {
          id: true,
          eventCategory: true,
          eventType: true,
          targetUserId: true,
          createdAt: true,
          payload: true,
          success: true,
        },
      });

      // Extract industry from payload, apply JS filter
      let items = rawItems.map((r) => {
        const payload = r.payload as Record<string, unknown> | null;
        const industry = typeof payload?.industry === 'string' ? payload.industry : null;
        return {
          id: r.id,
          eventCategory: r.eventCategory,
          eventType: r.eventType,
          // SHIELD: LD-A-3 · userId masked · never expose raw email or PII detail
          userId: r.targetUserId != null ? `user-${r.targetUserId}` : null,
          targetUserId: r.targetUserId,
          industry,
          createdAt: r.createdAt,
          // SHIELD: payloadSummary only — not raw payload content
          payloadSummary: `${r.eventType}${industry ? ` · ${industry}` : ''}`,
          success: r.success,
        };
      });

      if (industryFilter) {
        items = items.filter((i) => i.industry === industryFilter);
      }

      const hasMore = items.length > limit;
      if (hasMore) items.pop();
      const nextCursor = hasMore ? (items[items.length - 1]?.id ?? undefined) : undefined;

      if (input.grouping === 'none') {
        return { items, nextCursor, grouped: undefined };
      }

      const grouped: Record<string, typeof items> = {};
      for (const item of items) {
        const key =
          input.grouping === 'eventType' ? item.eventType : (item.industry ?? 'unknown');
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      }

      return { items, nextCursor, grouped };
    }),
});
