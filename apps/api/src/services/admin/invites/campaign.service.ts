// PRD-11 US-019 · invite_campaigns CRUD + getCampaignFunnel
// AC-5: all DB ops use SET LOCAL adminRLS bypass (SHIELD: SET LOCAL not SET)
// AC-6: campaignKey @unique → service layer catch + friendly CampaignKeyConflictError
// AC-7: totalQuota = 0 → ValidationError
// AC-8: endsAt < startsAt → ValidationError('endsAt must be > startsAt')
// AC-9: status transitions — ended→active forbidden

import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CampaignKeyConflictError extends Error {
  constructor(campaignKey: string) {
    super(`Campaign key "${campaignKey}" already exists`);
    this.name = 'CampaignKeyConflictError';
  }
}

export class CampaignNotFoundError extends Error {
  constructor(campaignKey: string) {
    super(`Campaign "${campaignKey}" not found`);
    this.name = 'CampaignNotFoundError';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended';

export interface CreateCampaignInput {
  campaignKey: string;
  name: string;
  description?: string;
  createdByAdminId: number;
  totalQuota: number;
  startsAt: Date;
  endsAt: Date;
  status?: CampaignStatus;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  totalQuota?: number;
  startsAt?: Date;
  endsAt?: Date;
  status?: CampaignStatus;
}

export interface CampaignFunnel {
  campaignKey: string;
  stages: {
    registered: number;    // Stage 1: 创建 — users who registered via this campaign
    activated: number;     // Stage 2: 激活 — isActivated = true
    step9Completed: number; // Stage 3: 9步完成 — step9 status='completed'
    d30Retained: number;   // Stage 4: D30留存 — last_signed_in within 30d of created_at
  };
}

// ---------------------------------------------------------------------------
// Status transition allowlist
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['active', 'paused', 'ended'],
  active: ['paused', 'ended'],
  paused: ['active', 'ended'],
  ended: [],   // AC-9: ended → anything is forbidden
};

function assertValidTransition(from: CampaignStatus, to: CampaignStatus): void {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ValidationError(
      `Status transition "${from}" → "${to}" is not allowed`,
    );
  }
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateQuota(totalQuota: number): void {
  // AC-7: totalQuota = 0 → ValidationError
  if (totalQuota <= 0) {
    throw new ValidationError('totalQuota must be > 0');
  }
}

function validateDateRange(startsAt: Date, endsAt: Date): void {
  // AC-8: endsAt < startsAt → ValidationError
  if (endsAt <= startsAt) {
    throw new ValidationError('endsAt must be > startsAt');
  }
}

// ---------------------------------------------------------------------------
// Admin RLS bypass helper
// ---------------------------------------------------------------------------

async function withAdminRole<T>(fn: () => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // SHIELD: SET LOCAL (not SET) — scoped to current transaction only
    await (tx as unknown as { $executeRawUnsafe: (s: string) => Promise<unknown> })
      .$executeRawUnsafe("SET LOCAL app.role = 'admin'");
    return fn();
  }) as Promise<T>;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createCampaign(input: CreateCampaignInput) {
  validateQuota(input.totalQuota);
  validateDateRange(input.startsAt, input.endsAt);

  return withAdminRole(async () => {
    try {
      return await prisma.inviteCampaign.create({
        data: {
          campaignKey: input.campaignKey,
          name: input.name,
          description: input.description,
          createdByAdminId: input.createdByAdminId,
          totalQuota: input.totalQuota,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: input.status ?? 'draft',
        },
      });
    } catch (err) {
      // AC-6: @unique constraint violation → friendly error
      if (
        err instanceof Error &&
        err.message.includes('Unique constraint') &&
        err.message.includes('campaignKey')
      ) {
        throw new CampaignKeyConflictError(input.campaignKey);
      }
      // Prisma error codes: P2002 = unique constraint violation
      const prismaErr = err as { code?: string; meta?: { target?: string[] } };
      if (prismaErr.code === 'P2002') {
        throw new CampaignKeyConflictError(input.campaignKey);
      }
      throw err;
    }
  });
}

export async function getCampaign(campaignKey: string) {
  return withAdminRole(async () => {
    const campaign = await prisma.inviteCampaign.findUnique({
      where: { campaignKey },
    });
    if (!campaign) throw new CampaignNotFoundError(campaignKey);
    return campaign;
  });
}

export async function listCampaigns(filters?: {
  status?: CampaignStatus;
  createdByAdminId?: number;
}) {
  return withAdminRole(async () => {
    return prisma.inviteCampaign.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.createdByAdminId ? { createdByAdminId: filters.createdByAdminId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  });
}

export async function updateCampaign(campaignKey: string, input: UpdateCampaignInput) {
  if (input.totalQuota !== undefined) validateQuota(input.totalQuota);

  return withAdminRole(async () => {
    const existing = await prisma.inviteCampaign.findUnique({ where: { campaignKey } });
    if (!existing) throw new CampaignNotFoundError(campaignKey);

    // AC-9: validate status transition
    if (input.status && input.status !== existing.status) {
      assertValidTransition(existing.status as CampaignStatus, input.status);
    }

    const startsAt = input.startsAt ?? existing.startsAt;
    const endsAt = input.endsAt ?? existing.endsAt;
    validateDateRange(startsAt, endsAt);

    return prisma.inviteCampaign.update({
      where: { campaignKey },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.totalQuota !== undefined ? { totalQuota: input.totalQuota } : {}),
        ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
        ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
  });
}

export async function deleteCampaign(campaignKey: string) {
  return withAdminRole(async () => {
    const existing = await prisma.inviteCampaign.findUnique({ where: { campaignKey } });
    if (!existing) throw new CampaignNotFoundError(campaignKey);
    return prisma.inviteCampaign.delete({ where: { campaignKey } });
  });
}

// ---------------------------------------------------------------------------
// getCampaignFunnel — 转化漏斗 4 阶段
// Stage 1: 创建 — users who registered via invite_codes.campaign = campaignKey
// Stage 2: 激活 — isActivated = true
// Stage 3: 9步完成 — completed step_data for step9
// Stage 4: D30留存 — last_signed_in within 30 days of user.created_at
// ---------------------------------------------------------------------------

export async function getCampaignFunnel(campaignKey: string): Promise<CampaignFunnel> {
  return withAdminRole(async () => {
    const existing = await prisma.inviteCampaign.findUnique({ where: { campaignKey } });
    if (!existing) throw new CampaignNotFoundError(campaignKey);

    const rows = await prisma.$queryRaw<
      [{ registered: bigint; activated: bigint; step9_completed: bigint; d30_retained: bigint }]
    >`
      WITH campaign_users AS (
        SELECT u.id,
               u.is_activated,
               u.last_signed_in,
               u.created_at
        FROM invite_codes ic
        JOIN users u ON u.id = ic.used_by_id
        WHERE ic.campaign = ${campaignKey}
          AND ic.used_by_id IS NOT NULL
      ),
      step9_users AS (
        SELECT DISTINCT cu.id
        FROM campaign_users cu
        JOIN step_data sd ON sd.account_id IN (
          SELECT ia.id FROM ip_accounts ia WHERE ia.user_id = cu.id
        )
        WHERE sd.step_key = 'step9' AND sd.status = 'completed'
      )
      SELECT
        COUNT(DISTINCT cu.id)::bigint AS registered,
        COUNT(DISTINCT CASE WHEN cu.is_activated THEN cu.id END)::bigint AS activated,
        COUNT(DISTINCT s9.id)::bigint AS step9_completed,
        COUNT(DISTINCT CASE
          WHEN cu.last_signed_in IS NOT NULL
           AND cu.last_signed_in >= cu.created_at
           AND cu.last_signed_in <= cu.created_at + INTERVAL '30 days'
          THEN cu.id
        END)::bigint AS d30_retained
      FROM campaign_users cu
      LEFT JOIN step9_users s9 ON s9.id = cu.id
    `;

    const r = rows[0] ?? { registered: 0n, activated: 0n, step9_completed: 0n, d30_retained: 0n };

    return {
      campaignKey,
      stages: {
        registered: Number(r.registered),
        activated: Number(r.activated),
        step9Completed: Number(r.step9_completed),
        d30Retained: Number(r.d30_retained),
      },
    };
  });
}
