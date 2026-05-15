// PRD-14 US-011 · feature-flag.service.ts
// LD-A11 单点保护: feature_flags + system_config 写操作仅由本文件的 2 个 _InTx 函数发起
// SHIELD: _toggleFeatureFlagInTx + _updateSystemConfigInTx 分开 · 不合并(字段不同)
// SHIELD: emergencyToggleSystemConfig 复用 PRD-13 US-002 emergencyApprove · 不重写
// SHIELD: getFeatureFlagValue 3 flagType 路由 · boolean / percentage / targeted

import { createHash } from 'node:crypto';

import { TRPCError } from '@trpc/server';

import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/services/admin/admin-audit-service';
import {
  requestApproval,
  emergencyApprove,
} from '@/services/admin/approval/approvalGateService';

import type { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToggleFeatureFlagInTxParams {
  flagKey: string;
  enabled: boolean;
  rolloutConfig?: Prisma.InputJsonValue;
  adminId: number;
  approvalRequestId?: number;
}

export interface UpdateSystemConfigInTxParams {
  configKey: string;
  configValue: Prisma.InputJsonValue;
  adminId: number;
  approvalRequestId?: number;
}

// ---------------------------------------------------------------------------
// LD-A11 单点函数 · _toggleFeatureFlagInTx
// ---------------------------------------------------------------------------

export async function _toggleFeatureFlagInTx(
  tx: Prisma.TransactionClient,
  params: ToggleFeatureFlagInTxParams,
): Promise<void> {
  const { flagKey, enabled, rolloutConfig, adminId, approvalRequestId } = params;

  await tx.featureFlag.update({
    where: { flagKey },
    data: {
      enabled,
      ...(rolloutConfig !== undefined ? { rolloutConfig } : {}),
      updatedByAdminId: adminId,
    },
  });

  await logAdminAction({
    actorAdminId: adminId,
    actorRole: 'admin',
    eventCategory: 'config_change',
    eventType: 'toggle_feature_flag',
    payload: { flagKey, enabled, rolloutConfig, approvalRequestId },
    traceId: createHash('md5').update(`toggle:${flagKey}:${adminId}:${Date.now()}`).digest('hex').slice(0, 16),
    ip: '0.0.0.0',
    userAgent: 'feature-flag-service',
    sessionId: 'system',
    success: true,
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// LD-A11 单点函数 · _updateSystemConfigInTx
// ---------------------------------------------------------------------------

export async function _updateSystemConfigInTx(
  tx: Prisma.TransactionClient,
  params: UpdateSystemConfigInTxParams,
): Promise<void> {
  const { configKey, configValue, adminId, approvalRequestId } = params;

  await tx.systemConfig.update({
    where: { configKey },
    data: {
      configValue,
      updatedByAdminId: adminId,
    },
  });

  await logAdminAction({
    actorAdminId: adminId,
    actorRole: 'admin',
    eventCategory: 'config_change',
    eventType: 'update_system_config',
    payload: { configKey, configValue, approvalRequestId },
    traceId: createHash('md5').update(`sysconfig:${configKey}:${adminId}:${Date.now()}`).digest('hex').slice(0, 16),
    ip: '0.0.0.0',
    userAgent: 'feature-flag-service',
    sessionId: 'system',
    success: true,
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// toggleFeatureFlag — dual approval (actionType='toggle_feature_flag')
// ---------------------------------------------------------------------------

export async function toggleFeatureFlag(
  flagKey: string,
  enabled: boolean,
  adminId: number,
  rolloutConfig?: Prisma.InputJsonValue,
): Promise<{ approvalRequestId: number }> {
  const flag = await prisma.featureFlag.findUnique({ where: { flagKey } });
  if (!flag) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `feature_flag '${flagKey}' not found` });
  }

  const approvalReq = await requestApproval({
    actionType: 'toggle_feature_flag',
    requesterAdminId: adminId,
    requesterRole: 'admin',
    actionPayload: { flagKey, enabled, rolloutConfig },
    riskLevel: 'medium',
    requireDualApproval: true,
  });

  return { approvalRequestId: approvalReq.id };
}

// ---------------------------------------------------------------------------
// emergencyToggleSystemConfig — super_admin 1 人 · 复用 PRD-13 US-002 emergencyApprove
// ---------------------------------------------------------------------------

export async function emergencyToggleSystemConfig(
  configKey: string,
  configValue: Prisma.InputJsonValue,
  superAdminId: number,
  incidentId: string,
): Promise<{ approvalRequestId: number }> {
  const config = await prisma.systemConfig.findUnique({ where: { configKey } });
  if (!config) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `system_config '${configKey}' not found` });
  }

  // Step 1: create approval request
  const approvalReq = await requestApproval({
    actionType: 'update_system_config',
    requesterAdminId: superAdminId,
    requesterRole: 'super_admin',
    actionPayload: { configKey, configValue, incidentId },
    riskLevel: 'high',
    emergencyMode: true,
    emergencyIncidentId: incidentId,
  });

  // Step 2: emergencyApprove — super_admin 1 人 · postReviewRequired=true (PRD-13 US-002 pattern)
  await emergencyApprove(approvalReq.id, superAdminId, incidentId);

  // Step 3: apply the config change in tx
  await prisma.$transaction(async (tx) => {
    await _updateSystemConfigInTx(tx, {
      configKey,
      configValue,
      adminId: superAdminId,
      approvalRequestId: approvalReq.id,
    });
  });

  return { approvalRequestId: approvalReq.id };
}

// ---------------------------------------------------------------------------
// getFeatureFlagValue — 3 flagType 路由 · boolean / percentage / targeted
// ---------------------------------------------------------------------------

export async function getFeatureFlagValue(
  flagKey: string,
  userId?: number,
  plan?: string,
): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({ where: { flagKey } });
  if (!flag || !flag.enabled) return false;

  const flagType = flag.flagType as 'boolean' | 'percentage' | 'targeted';

  if (flagType === 'boolean') {
    return Boolean(flag.defaultValue);
  }

  if (flagType === 'percentage') {
    const cfg = flag.rolloutConfig as { percentage?: number } | null;
    const pct = cfg?.percentage ?? 0;
    if (userId === undefined) return false;
    // md5 hash 分流: hash(flagKey + userId) → 0-99
    const hash = createHash('md5').update(`${flagKey}:${userId}`).digest('hex');
    const bucket = parseInt(hash.slice(0, 8), 16) % 100;
    return bucket < pct;
  }

  if (flagType === 'targeted') {
    const cfg = flag.rolloutConfig as {
      target_users?: number[];
      target_plans?: string[];
    } | null;

    if (userId !== undefined && cfg?.target_users?.includes(userId)) return true;
    if (plan !== undefined && cfg?.target_plans?.includes(plan)) return true;
    return false;
  }

  return false;
}
