// PRD-11 US-012 · adminRouter.cost — 5 procedures
// aggregate/top10/specialistBreakdown/alerts/exportCsv · all money-critical
// SHIELD: Prisma.Decimal 全程 · 不允许 .toNumber() 精度丢失
// SHIELD: Prisma.raw 限白名单 + template literal 防注入 · 不允许字符串拼接 raw SQL

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { logAdminAction } from '@/services/admin/admin-audit-service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

// ── Constants ──────────────────────────────────────────────────────────────

const COST_ALERT_THRESHOLD = new Prisma.Decimal('5'); // $5/24h per user
const COST_CSV_MAX_ROWS = 500_000;
const COST_CSV_CHUNK = 1_000;
const COST_CSV_HEADER = 'timestamp,userId,email,specialistId,model,provider,costUsd,traceId';

// Whitelist maps — safe for Prisma.raw injection (防 SQL injection)
const DIMENSION_COLUMN: Record<string, string> = {
  user: 'user_id',
  specialist: 'agent_id',
  model: 'model_used',
  provider: 'provider',
};

const TRUNC_INTERVAL: Record<string, string> = {
  day: 'day',
  week: 'week',
  month: 'month',
};

// ── Input schemas ──────────────────────────────────────────────────────────

const aggregateInput = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  dimension: z.enum(['user', 'specialist', 'model', 'provider']),
  groupBy: z.enum(['day', 'week', 'month']),
});

const exportCsvInput = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// ── Helpers ────────────────────────────────────────────────────────────────

function validateDateRange(start: Date, end: Date): void {
  if (start > end) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'startDate must be before endDate' });
  }
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 365) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'date range too large' });
  }
}

function alertSeverity(spent: Prisma.Decimal): 'high' | 'medium' | 'low' {
  if (spent.gte(new Prisma.Decimal('15'))) return 'high';
  if (spent.gte(new Prisma.Decimal('10'))) return 'medium';
  return 'low';
}

function escapeCsvField(value: string | number | boolean | Date | null | undefined): string {
  if (value == null) return '';
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getIp(ctx: { req: Request }): string {
  return (
    ctx.req.headers.get('x-forwarded-for') ??
    ctx.req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

// ── Router ──────────────────────────────────────────────────────────────────

export const costRouter = adminTrpcRouter({
  // # $ money-critical: true
  /** aggregate · 4-dimension × 3-granularity cost rollup · Prisma.raw whitelist 防注入 (AC-2) */
  aggregate: adminProcedure.input(aggregateInput).query(async ({ input, ctx }) => {
    const { startDate, endDate, dimension, groupBy } = input;
    validateDateRange(startDate, endDate);

    const db = ctx.adminPrisma ?? ctx.prisma;
    const dimCol = DIMENSION_COLUMN[dimension]!;
    const truncBy = TRUNC_INTERVAL[groupBy]!;

    interface AggRow {
      time_bucket: Date;
      dimension_value: string | null;
      total_cost: string;
      call_count: bigint;
    }

    const rows = await db.$queryRaw<AggRow[]>`
      SELECT
        DATE_TRUNC(${truncBy}, created_at) AS time_bucket,
        ${Prisma.raw(dimCol)}::text AS dimension_value,
        COALESCE(SUM(cost_usd), 0)::text AS total_cost,
        COUNT(*)::bigint AS call_count
      FROM cost_log
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY 1, 2
      ORDER BY 1 DESC
    `;

    let totalCost = new Prisma.Decimal('0');
    const aggregations = rows.map(r => {
      const cost = new Prisma.Decimal(r.total_cost);
      totalCost = totalCost.plus(cost);
      return {
        timeBucket: r.time_bucket,
        dimensionValue: r.dimension_value,
        totalCost: cost.toString(),
        callCount: Number(r.call_count),
      };
    });

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_query',
      eventType: 'cost_aggregate',
      payload: { dimension, groupBy, startDate, endDate },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return {
      aggregations,
      summary: { totalCost: aggregations.length === 0 ? '0.00' : totalCost.toString() },
    };
  }),

  // # $ money-critical: true
  /** top10 · highest-spending users + accounts all-time (AC-3) */
  top10: adminProcedure.query(async ({ ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;

    const [userTop10, accountTop10] = await Promise.all([
      db.costLog.groupBy({
        by: ['userId'],
        _sum: { costUsd: true },
        _count: { _all: true },
        orderBy: { _sum: { costUsd: 'desc' } },
        take: 10,
        where: { userId: { not: null } },
      }),
      db.costLog.groupBy({
        by: ['accountId'],
        _sum: { costUsd: true },
        _count: { _all: true },
        orderBy: { _sum: { costUsd: 'desc' } },
        take: 10,
        where: { accountId: { not: null } },
      }),
    ]);

    return {
      userTop10: userTop10.map(r => ({
        userId: r.userId!,
        totalCost: (r._sum.costUsd ?? new Prisma.Decimal('0')).toString(),
        callCount: r._count._all,
      })),
      accountTop10: accountTop10.map(r => ({
        accountId: r.accountId!,
        totalCost: (r._sum.costUsd ?? new Prisma.Decimal('0')).toString(),
        callCount: r._count._all,
      })),
    };
  }),

  // # $ money-critical: true
  /** specialistBreakdown · per-agentId cost breakdown (AC-4) */
  specialistBreakdown: adminProcedure.query(async ({ ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;

    const rows = await db.costLog.groupBy({
      by: ['agentId'],
      _sum: { costUsd: true },
      _count: { _all: true },
      orderBy: { _sum: { costUsd: 'desc' } },
    });

    return rows.map(r => {
      const totalCost = r._sum.costUsd ?? new Prisma.Decimal('0');
      const callCount = r._count._all;
      const avgCostPerCall = callCount > 0
        ? totalCost.div(new Prisma.Decimal(callCount)).toString()
        : '0';
      return {
        specialistId: r.agentId,
        totalCost: totalCost.toString(),
        callCount,
        avgCostPerCall,
      };
    });
  }),

  // # $ money-critical: true
  /** alerts · users exceeding $5/24h cost threshold (AC-5) */
  alerts: adminProcedure.query(async ({ ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const spends = await db.costLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since }, userId: { not: null } },
      _sum: { costUsd: true },
      orderBy: { _sum: { costUsd: 'desc' } },
    });

    const aboveThreshold = spends.filter(u => {
      const sum = u._sum.costUsd;
      return sum !== null && sum.greaterThan(COST_ALERT_THRESHOLD);
    });

    if (aboveThreshold.length === 0) return [];

    const userIds = aboveThreshold.map(u => u.userId!);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const emailMap = new Map(users.map(u => [u.id, u.email]));

    return aboveThreshold.map(u => {
      const spent = u._sum.costUsd!;
      return {
        userId: u.userId!,
        email: emailMap.get(u.userId!) ?? '',
        dailySpent: spent.toString(),
        threshold: COST_ALERT_THRESHOLD.toString(),
        severity: alertSeverity(spent),
      };
    });
  }),

  // # $ money-critical: true
  /** exportCsv · chunked cost log CSV export ≤500k rows · 防 OOM (AC-6) */
  exportCsv: adminProcedure.input(exportCsvInput).query(async ({ input, ctx }) => {
    const { startDate, endDate } = input;
    validateDateRange(startDate, endDate);

    const db = ctx.adminPrisma ?? ctx.prisma;
    const where = { createdAt: { gte: startDate, lte: endDate } };

    const rowCount = await db.costLog.count({ where });
    if (rowCount > COST_CSV_MAX_ROWS) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'export rows > 500000' });
    }

    void logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'export',
      eventType: 'export_cost_csv',
      payload: { startDate, endDate, rowCount },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    const lines: string[] = [COST_CSV_HEADER];
    let skip = 0;
    while (true) {
      const chunk = await db.costLog.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take: COST_CSV_CHUNK,
        select: {
          createdAt: true,
          userId: true,
          agentId: true,
          modelUsed: true,
          provider: true,
          costUsd: true,
          traceId: true,
          user: { select: { email: true } },
        },
      });
      if (chunk.length === 0) break;
      for (const row of chunk) {
        lines.push([
          row.createdAt.toISOString(),
          row.userId ?? '',
          escapeCsvField(row.user?.email),
          escapeCsvField(row.agentId),
          escapeCsvField(row.modelUsed),
          escapeCsvField(row.provider),
          row.costUsd.toString(),
          escapeCsvField(row.traceId),
        ].join(','));
      }
      if (chunk.length < COST_CSV_CHUNK) break;
      skip += COST_CSV_CHUNK;
    }

    return { csv: lines.join('\n'), rowCount };
  }),
});
