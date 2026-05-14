// PRD-13 US-005 · quota-adjustment.service — admin 配额调整单点
// AC-4: _adjustQuotaInTx 原子写 user_quota + quota_adjustment_log + admin_audit_log
// AC-5: adjustUserQuota · delta > 500 → requireDualApproval=true (D-093)
// AC-6: listUserQuotas + getUserQuotaTimeline (cost_log 聚合 24h × N 天)
// SHIELD: _adjustQuotaInTx 内部用 tx 确保原子性 (AC-4 教训)
// SHIELD: whitelist_add 触发 whitelistExpiresAt = now() + 24h (AC-4)
import { randomBytes } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

import { logAdminAction } from '@/services/admin/admin-audit-service';
import { requestApproval } from '@/services/admin/approval/approvalGateService';
import { prisma } from '@/lib/prisma';

export type QuotaAdjustmentType = 'increase_daily' | 'increase_monthly' | 'whitelist_add';

export interface AdjustQuotaTxParams {
  userId: number;
  adminId: number;
  adjustmentType: QuotaAdjustmentType;
  delta: number;
  reason: string;
  approvalRequestId: number;
  adminMode?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
}

// field mapping: adjustmentType → schema field name
const FIELD_MAP: Record<QuotaAdjustmentType, string> = {
  increase_daily: 'dailyQuota',
  increase_monthly: 'monthlyQuota',
  whitelist_add: 'whitelist',
};

export async function _adjustQuotaInTx(
  tx: Prisma.TransactionClient,
  params: AdjustQuotaTxParams,
): Promise<number> {
  const {
    userId,
    adminId,
    adjustmentType,
    delta,
    reason,
    approvalRequestId,
    adminMode,
    ip = 'system',
    userAgent = 'system',
    sessionId = 'system',
  } = params;

  const quota = await tx.userQuota.findUnique({ where: { userId } });
  if (!quota) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `user_quota not found for userId=${userId}` });
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  let oldValue: number | null = null;
  let newValue: number | null = null;

  if (adjustmentType === 'whitelist_add') {
    oldValue = quota.whitelistExpiresAt ? quota.whitelistExpiresAt.getTime() : null;
    newValue = expiresAt.getTime();
    await tx.userQuota.update({
      where: { userId },
      data: { isOnWhitelist: true, whitelistExpiresAt: expiresAt },
    });
  } else if (adjustmentType === 'increase_daily') {
    oldValue = quota.dailyQuota;
    newValue = quota.dailyQuota + delta;
    await tx.userQuota.update({
      where: { userId },
      data: { dailyQuota: { increment: delta } },
    });
  } else {
    oldValue = quota.monthlyQuota;
    newValue = quota.monthlyQuota + delta;
    await tx.userQuota.update({
      where: { userId },
      data: { monthlyQuota: { increment: delta } },
    });
  }

  const log = await tx.quotaAdjustmentLog.create({
    data: {
      userQuotaId: quota.id,
      userId,
      adminId,
      adminMode,
      field: FIELD_MAP[adjustmentType],
      oldValue,
      newValue,
      delta: adjustmentType === 'whitelist_add' ? null : delta,
      reason,
      expiresAt,
      approvalRequestId,
    },
  });

  const traceId = randomBytes(8).toString('hex');
  await logAdminAction({
    actorAdminId: adminId,
    actorRole: adminMode ?? 'admin',
    eventCategory: 'quota_management',
    eventType: `quota_${adjustmentType}`,
    payload: { userId, adjustmentType, delta, approvalRequestId, field: FIELD_MAP[adjustmentType] },
    traceId,
    ip,
    userAgent,
    sessionId,
    success: true,
    targetUserId: userId,
    approvalRequestId,
  });

  return log.id;
}

export interface AdjustUserQuotaParams {
  userId: number;
  adminId: number;
  adminRole: 'admin' | 'super_admin';
  adjustmentType: QuotaAdjustmentType;
  delta: number;
  reason: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AdjustUserQuotaResult {
  adjustmentLogId?: number;
  approvalRequestId?: number;
  needsApproval: boolean;
}

// D-093: delta > 500 → dual-approval; whitelist → always dual (adjust_quota / whitelist_user)
export async function adjustUserQuota(
  params: AdjustUserQuotaParams,
): Promise<AdjustUserQuotaResult> {
  const {
    userId,
    adminId,
    adminRole,
    adjustmentType,
    delta,
    reason,
    ip = 'system',
    userAgent = 'system',
    sessionId = 'system',
  } = params;

  const needsDual =
    adjustmentType === 'whitelist_add' || delta > 500;

  const actionType =
    adjustmentType === 'whitelist_add' ? 'whitelist_user' : 'adjust_quota';

  const approval = await requestApproval({
    actionType: needsDual ? actionType : 'quota_adjust_small',
    requesterAdminId: adminId,
    requesterRole: adminRole,
    actionPayload: { userId, adjustmentType, delta, reason } as Prisma.InputJsonValue,
    riskLevel: delta > 500 ? 'high' : 'medium',
    requireDualApproval: needsDual,
  });

  if (needsDual) {
    return { approvalRequestId: approval.id, needsApproval: true };
  }

  // single-approval: execute immediately
  const logId = await prisma.$transaction(async (tx) => {
    return _adjustQuotaInTx(tx, {
      userId,
      adminId,
      adjustmentType,
      delta,
      reason,
      approvalRequestId: approval.id,
      ip,
      userAgent,
      sessionId,
    });
  });

  return { adjustmentLogId: logId, approvalRequestId: approval.id, needsApproval: false };
}

export interface ListUserQuotasInput {
  cursor?: number;
  limit?: number;
  plan?: 'free' | 'pro' | 'enterprise';
  search?: string;
}

export async function listUserQuotas(input: ListUserQuotasInput) {
  const { cursor, limit = 20, plan, search } = input;

  const where: Prisma.UserQuotaWhereInput = {};
  if (plan) where.plan = plan;
  if (cursor) where.id = { gt: cursor };

  if (search) {
    where.userId = {
      in: await prisma.user
        .findMany({
          where: { email: { contains: search, mode: 'insensitive' } },
          select: { id: true },
          take: 100,
        })
        .then((users) => users.map((u) => u.id)),
    };
  }

  const items = await prisma.userQuota.findMany({
    where,
    take: limit + 1,
    orderBy: { id: 'asc' },
    include: { adjustments: { where: { isExpired: false }, orderBy: { createdAt: 'desc' }, take: 3 } },
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;

  return {
    items: data,
    nextCursor: hasMore ? data[data.length - 1]?.id : undefined,
  };
}

export interface QuotaTimelineEntry {
  date: string;
  callCount: number;
  costUsd: number;
}

export async function getUserQuotaTimeline(
  userId: number,
  days = 7,
): Promise<QuotaTimelineEntry[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<Array<{ date: string; call_count: bigint; cost_usd: unknown }>>`
    SELECT
      TO_CHAR(DATE_TRUNC('day', "created_at" AT TIME ZONE 'Asia/Shanghai'), 'YYYY-MM-DD') AS date,
      COUNT(*)::bigint AS call_count,
      SUM("cost_usd") AS cost_usd
    FROM cost_log
    WHERE "user_id" = ${userId}
      AND "created_at" >= ${since}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  return rows.map((r) => ({
    date: r.date,
    callCount: Number(r.call_count),
    costUsd: Number(r.cost_usd ?? 0),
  }));
}
