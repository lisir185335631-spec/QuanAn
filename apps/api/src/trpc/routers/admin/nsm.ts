// PRD-11 US-003 · NSM router — 5 procedures from kpi_snapshots
// AC-1: all 5 procedures use adminProcedure (6 gates · adminRLS injects ctx.adminPrisma)
// AC-2: getOverview · latest + previous daily · delta comparison · audit data_query/nsm_overview
// AC-3: getFunnel · funnelData by date + granularity
// AC-4: getDistributions · 3 pie distributions from latest snapshot
// AC-5: getAlerts · last 3 daily · consecutive deterioration · audit
// AC-6/8: triggerSnapshot · super_admin only · computeSnapshot · audit high_risk_action
// AC-9: empty table → getOverview returns null (no error)

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { logAdminAction } from '@/services/admin/admin-audit-service';
import { computeSnapshot } from '@/services/admin/nsm/kpi-snapshot.service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

import type { KpiSnapshot } from '@prisma/client';

type AlertSeverity = 'high' | 'medium' | 'low';

interface Alert {
  metric: string;
  severity: AlertSeverity;
  deltaPct: number;
}

const NSM_METRICS: Array<keyof Pick<
  KpiSnapshot,
  'activeAccounts7d' | 'step9CompleteRate' | 'feedbackRate' | 'evolutionUpgradeRate' | 'd30Retention'
>> = ['activeAccounts7d', 'step9CompleteRate', 'feedbackRate', 'evolutionUpgradeRate', 'd30Retention'];

function getMetricValue(snapshot: KpiSnapshot, metric: (typeof NSM_METRICS)[number]): number {
  const v = snapshot[metric];
  return typeof v === 'object' ? Number(v) : (v);
}

function alertSeverity(deltaPct: number): AlertSeverity {
  const abs = Math.abs(deltaPct);
  if (abs >= 20) return 'high';
  if (abs >= 10) return 'medium';
  return 'low';
}

function calculateAlerts(snapshots: KpiSnapshot[]): Alert[] {
  if (snapshots.length < 2) return [];
  const [s0, s1, s2] = snapshots; // s0 = most recent
  const alerts: Alert[] = [];

  for (const metric of NSM_METRICS) {
    const v0 = getMetricValue(s0!, metric);
    const v1 = getMetricValue(s1!, metric);
    const isDet01 = v0 < v1;

    // Require consecutive deterioration when 3 snapshots available
    const isConsecutive = s2 ? isDet01 && getMetricValue(s1!, metric) < getMetricValue(s2, metric) : isDet01;

    if (isConsecutive && v1 > 0) {
      const deltaPct = Math.round(((v0 - v1) / v1) * 10000) / 100;
      alerts.push({ metric, severity: alertSeverity(deltaPct), deltaPct });
    }
  }

  return alerts;
}

function getIp(ctx: { req: Request }): string {
  return (
    ctx.req.headers.get('x-forwarded-for') ??
    ctx.req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

function serializeSnapshot(s: KpiSnapshot) {
  return {
    ...s,
    step9CompleteRate: Number(s.step9CompleteRate),
    feedbackRate: Number(s.feedbackRate),
    evolutionUpgradeRate: Number(s.evolutionUpgradeRate),
    d30Retention: Number(s.d30Retention),
    // Json 列 → 具体形状(与 getFunnel/getDistributions 的 cast 一致):前端图表按此索引
    funnelData: s.funnelData as number[],
    industryDistribution: s.industryDistribution as Record<string, number>,
    platformDistribution: s.platformDistribution as Record<string, number>,
    userPersonaDistribution: s.userPersonaDistribution as Record<string, number>,
  };
}

export const nsmRouter = adminTrpcRouter({
  // AC-2: latest + previous daily snapshot with delta comparison
  getOverview: adminProcedure.query(async ({ ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;
    const ip = getIp(ctx);
    const userAgent = ctx.req.headers.get('user-agent') ?? '';
    const sessionId = ctx.adminSession?.id ?? '';

    const latest = await db.kpiSnapshot.findFirst({
      where: { granularity: 'day' },
      orderBy: { snapshotDate: 'desc' },
    });

    // AC-9: empty table → null, no error
    if (!latest) {
      await logAdminAction({
        actorAdminId: ctx.activeAdminUser!.id,
        actorRole: ctx.activeAdminUser!.role,
        eventCategory: 'data_query',
        eventType: 'nsm_overview',
        payload: { result: 'no_data' },
        traceId: ctx.traceId,
        ip,
        userAgent,
        sessionId,
        success: true,
      });
      return null;
    }

    const previous = await db.kpiSnapshot.findFirst({
      where: { granularity: 'day', snapshotDate: { lt: latest.snapshotDate } },
      orderBy: { snapshotDate: 'desc' },
    });

    const deltas = previous
      ? {
          activeAccounts7d: latest.activeAccounts7d - previous.activeAccounts7d,
          step9CompleteRate: Number(latest.step9CompleteRate) - Number(previous.step9CompleteRate),
          feedbackRate: Number(latest.feedbackRate) - Number(previous.feedbackRate),
          evolutionUpgradeRate:
            Number(latest.evolutionUpgradeRate) - Number(previous.evolutionUpgradeRate),
          d30Retention: Number(latest.d30Retention) - Number(previous.d30Retention),
        }
      : null;

    await logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_query',
      eventType: 'nsm_overview',
      payload: {
        snapshotDate: latest.snapshotDate.toISOString(),
        hasPrevious: !!previous,
      },
      traceId: ctx.traceId,
      ip,
      userAgent,
      sessionId,
      success: true,
    });

    return {
      latest: serializeSnapshot(latest),
      previous: previous ? serializeSnapshot(previous) : null,
      deltas,
    };
  }),

  // AC-3: funnel data by date + granularity
  getFunnel: adminProcedure
    .input(
      z.object({
        date: z.string().datetime().optional(),
        granularity: z.enum(['day', 'week', 'month']).default('day'),
      }),
    )
    .query(async ({ input, ctx }) => {
      const db = ctx.adminPrisma ?? ctx.prisma;

      const where = input.date
        ? { snapshotDate: new Date(input.date), granularity: input.granularity }
        : { granularity: input.granularity };

      const snapshot = await db.kpiSnapshot.findFirst({
        where,
        orderBy: { snapshotDate: 'desc' },
        select: { funnelData: true },
      });

      if (!snapshot) return [] as number[];
      return snapshot.funnelData as number[];
    }),

  // AC-4: 3 pie chart distributions from latest daily snapshot
  getDistributions: adminProcedure.query(async ({ ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;

    const latest = await db.kpiSnapshot.findFirst({
      where: { granularity: 'day' },
      orderBy: { snapshotDate: 'desc' },
      select: {
        industryDistribution: true,
        platformDistribution: true,
        userPersonaDistribution: true,
      },
    });

    if (!latest) return null;

    return {
      industryDistribution: latest.industryDistribution as Record<string, number>,
      platformDistribution: latest.platformDistribution as Record<string, number>,
      userPersonaDistribution: latest.userPersonaDistribution as Record<string, number>,
    };
  }),

  // AC-5: last 3 daily snapshots · consecutive deterioration
  getAlerts: adminProcedure.query(async ({ ctx }) => {
    const db = ctx.adminPrisma ?? ctx.prisma;

    const snapshots = await db.kpiSnapshot.findMany({
      where: { granularity: 'day' },
      orderBy: { snapshotDate: 'desc' },
      take: 3,
    });

    const alerts = calculateAlerts(snapshots);

    await logAdminAction({
      actorAdminId: ctx.activeAdminUser!.id,
      actorRole: ctx.activeAdminUser!.role,
      eventCategory: 'data_query',
      eventType: 'nsm_alerts',
      payload: { alertCount: alerts.length, snapshotCount: snapshots.length },
      traceId: ctx.traceId,
      ip: getIp(ctx),
      userAgent: ctx.req.headers.get('user-agent') ?? '',
      sessionId: ctx.adminSession?.id ?? '',
      success: true,
    });

    return alerts;
  }),

  // AC-6: super_admin only · computeSnapshot · audit high_risk_action/manual_snapshot_trigger
  // AC-8: non-super_admin → 403 + audit privilege_escalation (manual check for audit write)
  triggerSnapshot: adminProcedure.mutation(async ({ ctx }) => {
    const ip = getIp(ctx);
    const userAgent = ctx.req.headers.get('user-agent') ?? '';
    const sessionId = ctx.adminSession?.id ?? '';

    // AC-8: non-super_admin path — write privilege_escalation audit before throwing 403
    if (ctx.activeAdminUser?.role !== 'super_admin') {
      await logAdminAction({
        actorAdminId: ctx.activeAdminUser?.id ?? 0,
        actorRole: ctx.activeAdminUser?.role ?? 'unknown',
        eventCategory: 'security_alert',
        eventType: 'privilege_escalation',
        payload: { attemptedAction: 'manual_snapshot_trigger' },
        traceId: ctx.traceId,
        ip,
        userAgent,
        sessionId,
        success: false,
        errorCode: 'FORBIDDEN',
        errorMessage: 'privilege_escalation',
      });
      throw new TRPCError({ code: 'FORBIDDEN', message: 'privilege_escalation' });
    }

    const result = await computeSnapshot(new Date(), 'day');

    await logAdminAction({
      actorAdminId: ctx.activeAdminUser.id,
      actorRole: ctx.activeAdminUser.role,
      eventCategory: 'high_risk_action',
      eventType: 'manual_snapshot_trigger',
      payload: {
        snapshotDate: result.snapshotDate.toISOString(),
        granularity: result.granularity,
      },
      traceId: ctx.traceId,
      ip,
      userAgent,
      sessionId,
      success: true,
    });

    return {
      success: true,
      snapshotDate: result.snapshotDate,
      granularity: result.granularity,
    };
  }),
});
