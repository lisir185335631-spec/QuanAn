// PRD-11 US-001 · NSM kpi_snapshots schema + computeSnapshot service
// AC-4/5: prisma.$transaction + SET LOCAL app.role='admin' · 7 $queryRaw template literal SQLs
// AC-6: upsert on @@unique([snapshotDate, granularity])
// AC-7: date > NOW() → ValidationError · invalid granularity → ValidationError · empty feedback → 0.0000
// AC-8: adminRLS bypass failure → AdminRLSBypassError · >60s → SnapshotComputationTimeout

import { Decimal } from '@prisma/client/runtime/library';

import { prisma } from '@/lib/prisma';

import type { Prisma, PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Custom Errors
// ---------------------------------------------------------------------------

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AdminRLSBypassError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminRLSBypassError';
  }
}

export class SnapshotComputationTimeout extends Error {
  constructor() {
    super('Snapshot computation exceeded 60s timeout');
    this.name = 'SnapshotComputationTimeout';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Granularity = 'day' | 'week' | 'month';

export interface KpiSnapshotData {
  snapshotDate: Date;
  granularity: Granularity;
  activeAccounts7d: number;
  step9CompleteRate: Decimal;
  feedbackRate: Decimal;
  evolutionUpgradeRate: Decimal;
  d30Retention: Decimal;
  userPersonaDistribution: Record<string, number>;
  industryDistribution: Record<string, number>;
  platformDistribution: Record<string, number>;
  funnelData: [number, number, number, number, number, number];
}

const VALID_GRANULARITIES: Granularity[] = ['day', 'week', 'month'];
const MS_PER_DAY = 86_400_000;

// ---------------------------------------------------------------------------
// Decimal helpers
// ---------------------------------------------------------------------------

function makeDec(value: string): Decimal {
  return new Decimal(value);
}

function safeDivDec(numerator: bigint, denominator: bigint): Decimal {
  if (denominator === 0n) return makeDec('0.0000');
  const ratio = Number(numerator) / Number(denominator);
  const clamped = Math.min(1, Math.max(0, ratio));
  return makeDec(clamped.toFixed(4));
}

// ---------------------------------------------------------------------------
// SQL-1: active accounts in last 7 days before snapshotDate
// ---------------------------------------------------------------------------
async function queryActiveAccounts7d(tx: PrismaClient, date: Date): Promise<number> {
  const cutoff = new Date(date.getTime() - 7 * MS_PER_DAY);
  const rows = await tx.$queryRaw<[{ cnt: bigint }]>`
    SELECT COUNT(DISTINCT ia.id)::bigint AS cnt
    FROM ip_accounts ia
    JOIN users u ON u.id = ia.user_id
    WHERE u.last_signed_in >= ${cutoff}
      AND u.last_signed_in <= ${date}
      AND ia.is_active = true
  `;
  return Number(rows[0]?.cnt ?? 0n);
}

// ---------------------------------------------------------------------------
// SQL-2: step9 completion rate (cumulative)
// ---------------------------------------------------------------------------
async function queryStep9CompleteRate(tx: PrismaClient): Promise<Decimal> {
  const rows = await tx.$queryRaw<[{ total: bigint; completed: bigint }]>`
    SELECT
      COUNT(DISTINCT ia.id)::bigint AS total,
      COUNT(DISTINCT sd.account_id)::bigint AS completed
    FROM ip_accounts ia
    LEFT JOIN step_data sd
      ON sd.account_id = ia.id
      AND sd.step_key = 'step9'
      AND sd.status = 'completed'
    WHERE ia.is_active = true
  `;
  const { total = 0n, completed = 0n } = rows[0] ?? {};
  return safeDivDec(completed, total);
}

// ---------------------------------------------------------------------------
// SQL-3: feedback rate (accounts with ≥1 feedback / total · empty table → 0.0000)
// ---------------------------------------------------------------------------
async function queryFeedbackRate(tx: PrismaClient): Promise<Decimal> {
  const rows = await tx.$queryRaw<[{ total: bigint; with_feedback: bigint }]>`
    SELECT
      COUNT(DISTINCT ia.id)::bigint AS total,
      COUNT(DISTINCT fl.account_id)::bigint AS with_feedback
    FROM ip_accounts ia
    LEFT JOIN feedback_logs fl ON fl.account_id = ia.id
    WHERE ia.is_active = true
  `;
  const { total = 0n, with_feedback = 0n } = rows[0] ?? {};
  // empty feedback_log → with_feedback = 0 → returns 0.0000 · no division by zero (AC-7)
  return safeDivDec(with_feedback, total);
}

// ---------------------------------------------------------------------------
// SQL-4: evolution upgrade rate within granularity window
// ---------------------------------------------------------------------------
async function queryEvolutionUpgradeRate(
  tx: PrismaClient,
  date: Date,
  granularity: Granularity,
): Promise<Decimal> {
  const windowMs =
    granularity === 'day' ? MS_PER_DAY : granularity === 'week' ? 7 * MS_PER_DAY : 30 * MS_PER_DAY;
  const windowStart = new Date(date.getTime() - windowMs);
  const rows = await tx.$queryRaw<[{ total: bigint; upgraded: bigint }]>`
    SELECT
      COUNT(DISTINCT ia.id)::bigint AS total,
      COUNT(DISTINCT ep.account_id)::bigint AS upgraded
    FROM ip_accounts ia
    LEFT JOIN evolution_profiles ep
      ON ep.account_id = ia.id
      AND ep.last_upgraded_at >= ${windowStart}
      AND ep.last_upgraded_at <= ${date}
    WHERE ia.is_active = true
  `;
  const { total = 0n, upgraded = 0n } = rows[0] ?? {};
  return safeDivDec(upgraded, total);
}

// ---------------------------------------------------------------------------
// SQL-5: d30 retention (users signed in within 30 days / total users)
// ---------------------------------------------------------------------------
async function queryD30Retention(tx: PrismaClient, date: Date): Promise<Decimal> {
  const cutoff = new Date(date.getTime() - 30 * MS_PER_DAY);
  const rows = await tx.$queryRaw<[{ total: bigint; retained: bigint }]>`
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(
        CASE WHEN u.last_signed_in >= ${cutoff} AND u.last_signed_in <= ${date} THEN 1 END
      )::bigint AS retained
    FROM users u
  `;
  const { total = 0n, retained = 0n } = rows[0] ?? {};
  return safeDivDec(retained, total);
}

// ---------------------------------------------------------------------------
// SQL-6 (3 sub-queries): userPersona + industry + platform distributions
// ---------------------------------------------------------------------------
async function queryDistributions(tx: PrismaClient): Promise<{
  userPersonaDistribution: Record<string, number>;
  industryDistribution: Record<string, number>;
  platformDistribution: Record<string, number>;
}> {
  const [personaRows, industryRows, platformRows] = await Promise.all([
    tx.$queryRaw<Array<{ bucket: string; cnt: bigint }>>`
      SELECT
        CASE
          WHEN stage = 'advanced'     THEN 'mcn'
          WHEN stage = 'established'  THEN 'ipBuilder'
          WHEN stage = 'grower'       THEN 'opc'
          ELSE                             'traditional'
        END AS bucket,
        COUNT(*)::bigint AS cnt
      FROM ip_accounts
      WHERE is_active = true
      GROUP BY bucket
    `,
    tx.$queryRaw<Array<{ industry: string; cnt: bigint }>>`
      SELECT industry, COUNT(*)::bigint AS cnt
      FROM ip_accounts
      WHERE is_active = true
        AND industry IS NOT NULL AND industry <> ''
      GROUP BY industry
    `,
    tx.$queryRaw<Array<{ platform: string; cnt: bigint }>>`
      SELECT platform, COUNT(*)::bigint AS cnt
      FROM ip_accounts
      WHERE is_active = true
        AND platform IS NOT NULL AND platform <> ''
      GROUP BY platform
    `,
  ]);

  const userPersonaDistribution: Record<string, number> = {
    ipBuilder: 0,
    opc: 0,
    traditional: 0,
    mcn: 0,
  };
  for (const row of personaRows) {
    userPersonaDistribution[row.bucket] = Number(row.cnt);
  }

  const industryDistribution: Record<string, number> = {};
  for (const row of industryRows) {
    industryDistribution[row.industry] = Number(row.cnt);
  }

  const platformDistribution: Record<string, number> = {};
  for (const row of platformRows) {
    platformDistribution[row.platform] = Number(row.cnt);
  }

  return { userPersonaDistribution, industryDistribution, platformDistribution };
}

// ---------------------------------------------------------------------------
// SQL-7: funnel data [register, step1, step3, step3b, step7, feedback]
// ---------------------------------------------------------------------------
async function queryFunnelData(
  tx: PrismaClient,
): Promise<[number, number, number, number, number, number]> {
  const rows = await tx.$queryRaw<
    [
      {
        total: bigint;
        step1: bigint;
        step3: bigint;
        step3b: bigint;
        step7: bigint;
        feedback: bigint;
      },
    ]
  >`
    SELECT
      COUNT(DISTINCT ia.id)::bigint           AS total,
      COUNT(DISTINCT sd1.account_id)::bigint  AS step1,
      COUNT(DISTINCT sd3.account_id)::bigint  AS step3,
      COUNT(DISTINCT sd3b.account_id)::bigint AS step3b,
      COUNT(DISTINCT sd7.account_id)::bigint  AS step7,
      COUNT(DISTINCT fl.account_id)::bigint   AS feedback
    FROM ip_accounts ia
    LEFT JOIN step_data sd1
      ON sd1.account_id = ia.id AND sd1.step_key = 'step1' AND sd1.status = 'completed'
    LEFT JOIN step_data sd3
      ON sd3.account_id = ia.id AND sd3.step_key = 'step3' AND sd3.status = 'completed'
    LEFT JOIN step_data sd3b
      ON sd3b.account_id = ia.id AND sd3b.step_key = 'step3b' AND sd3b.status = 'completed'
    LEFT JOIN step_data sd7
      ON sd7.account_id = ia.id AND sd7.step_key = 'step7' AND sd7.status = 'completed'
    LEFT JOIN feedback_logs fl ON fl.account_id = ia.id
    WHERE ia.is_active = true
  `;
  const r = rows[0];
  if (!r) return [0, 0, 0, 0, 0, 0];
  return [
    Number(r.total),
    Number(r.step1),
    Number(r.step3),
    Number(r.step3b),
    Number(r.step7),
    Number(r.feedback),
  ];
}

// ---------------------------------------------------------------------------
// Public: computeSnapshot
// ---------------------------------------------------------------------------

export async function computeSnapshot(
  date: Date,
  granularity: string,
): Promise<KpiSnapshotData> {
  // AC-7: invalid granularity → ValidationError
  if (!VALID_GRANULARITIES.includes(granularity as Granularity)) {
    throw new ValidationError(
      `Invalid granularity: "${granularity}". Must be one of: ${VALID_GRANULARITIES.join(', ')}`,
    );
  }

  // AC-7: date > NOW() → ValidationError
  if (date > new Date()) {
    throw new ValidationError(
      `snapshotDate ${date.toISOString()} is in the future. Cannot compute future snapshots.`,
    );
  }

  const gran = granularity as Granularity;

  const compute = async (): Promise<KpiSnapshotData> => {
    return prisma.$transaction(async (tx) => {
      // AC-4 / SHIELD: adminRLS bypass via SET LOCAL (not SET — SET leaks across connections)
      try {
        await (tx as unknown as { $executeRawUnsafe: (s: string) => Promise<unknown> }).$executeRawUnsafe(
          "SET LOCAL app.role = 'admin'",
        );
      } catch (e) {
        throw new AdminRLSBypassError(
          `Failed to bypass admin RLS: ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      const client = tx as unknown as PrismaClient;

      // 7 aggregation SQLs executed in parallel (AC-5)
      const [
        activeAccounts7d,
        step9CompleteRate,
        feedbackRate,
        evolutionUpgradeRate,
        d30Retention,
        distributions,
        funnelData,
      ] = await Promise.all([
        queryActiveAccounts7d(client, date),
        queryStep9CompleteRate(client),
        queryFeedbackRate(client),
        queryEvolutionUpgradeRate(client, date, gran),
        queryD30Retention(client, date),
        queryDistributions(client),
        queryFunnelData(client),
      ]);

      // AC-6: upsert — second run with same (date, granularity) → UPDATE, no duplicate error
      await prisma.kpiSnapshot.upsert({
        where: { snapshotDate_granularity: { snapshotDate: date, granularity: gran } },
        update: {
          activeAccounts7d,
          step9CompleteRate,
          feedbackRate,
          evolutionUpgradeRate,
          d30Retention,
          userPersonaDistribution: distributions.userPersonaDistribution as unknown as Prisma.InputJsonValue,
          industryDistribution: distributions.industryDistribution as unknown as Prisma.InputJsonValue,
          platformDistribution: distributions.platformDistribution as unknown as Prisma.InputJsonValue,
          funnelData: funnelData as unknown as Prisma.InputJsonValue,
          computedAt: new Date(),
        },
        create: {
          snapshotDate: date,
          granularity: gran,
          activeAccounts7d,
          step9CompleteRate,
          feedbackRate,
          evolutionUpgradeRate,
          d30Retention,
          userPersonaDistribution: distributions.userPersonaDistribution as unknown as Prisma.InputJsonValue,
          industryDistribution: distributions.industryDistribution as unknown as Prisma.InputJsonValue,
          platformDistribution: distributions.platformDistribution as unknown as Prisma.InputJsonValue,
          funnelData: funnelData as unknown as Prisma.InputJsonValue,
        },
      });

      return {
        snapshotDate: date,
        granularity: gran,
        activeAccounts7d,
        step9CompleteRate,
        feedbackRate,
        evolutionUpgradeRate,
        d30Retention,
        ...distributions,
        funnelData,
      };
    });
  };

  // AC-8: race against 60s timeout → SnapshotComputationTimeout
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new SnapshotComputationTimeout()), 60_000),
  );

  return Promise.race([compute(), timeout]);
}
