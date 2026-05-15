// PRD-14 US-011 · feature-flag.service.ts
// LD-A11 单点保护: feature_flags + system_config 写操作仅由本文件的 2 个 _InTx 函数发起
// SHIELD: _toggleFeatureFlagInTx + _updateSystemConfigInTx 分开 · 不合并(字段不同)
// SHIELD: emergencyToggleSystemConfig 复用 PRD-13 US-002 emergencyApprove · 不重写
// SHIELD: getFeatureFlagValue 3 flagType 路由 · boolean / percentage / targeted
// PRD-14 US-012: getFeatureFlagValue + getSystemConfigValue 5s TTL cache(Map+setInterval 防 hot path)
// PRD-14 US-012: emergencyToggleSystemConfig 写 security_alert audit + 钉钉(isMock=true)
// PRD-14 US-013: rolloutConfigSchema discriminatedUnion + upsert 支持任意 flagKey + hash 修正 userId:flagKey

import { createHash } from 'node:crypto';

import { z } from 'zod';

import { TRPCError } from '@trpc/server';

import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/services/admin/admin-audit-service';
import {
  requestApproval,
  emergencyApprove,
} from '@/services/admin/approval/approvalGateService';
import { DingtalkService } from '@/services/admin/notifications/dingtalk.service';

import type { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// PRD-14 US-013 · rolloutConfig zod discriminatedUnion schema
// AC-3: 3 flagType 分支 · boolean / percentage(0-100) / targeted(users+plans)
// SHIELD: 不允许 accept Record<string, unknown> · 必须 discriminatedUnion 严格分支
// ---------------------------------------------------------------------------

export const rolloutConfigSchema = z.discriminatedUnion('flagType', [
  z.object({ flagType: z.literal('boolean') }),
  z.object({
    flagType: z.literal('percentage'),
    percentage: z.number().min(0).max(100),
  }),
  z.object({
    flagType: z.literal('targeted'),
    target_users: z.number().int().array().optional(),
    target_plans: z.enum(['free', 'pro', 'enterprise']).array().optional(),
  }),
]);

export type RolloutConfig = z.infer<typeof rolloutConfigSchema>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToggleFeatureFlagInTxParams {
  flagKey: string;
  enabled: boolean;
  rolloutConfig?: Prisma.InputJsonValue;
  /** flagType for upsert create — defaults to 'boolean' when not provided (US-013 AC-4) */
  flagType?: 'boolean' | 'percentage' | 'targeted';
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
// PRD-14 US-012 · 5s TTL cache (Map + setInterval) · 防 hot path 频繁查 DB
// SHIELD: 每次调用直查 DB 大并发崩溃 → 改用 short cache
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const featureFlagCache = new Map<string, CacheEntry<boolean>>();
const systemConfigCache = new Map<string, CacheEntry<unknown>>();

// Periodic cleanup — remove stale entries every 30s
const _ffCleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of featureFlagCache.entries()) {
    if (entry.expiresAt < now) featureFlagCache.delete(key);
  }
  for (const [key, entry] of systemConfigCache.entries()) {
    if (entry.expiresAt < now) systemConfigCache.delete(key);
  }
}, 30_000);
// Allow process to exit even if interval is running
if (typeof _ffCleanup.unref === 'function') _ffCleanup.unref();

/** Invalidate cache for a specific flag/config key after a write */
export function invalidateFeatureFlagCache(flagKey: string): void {
  for (const key of featureFlagCache.keys()) {
    if (key.startsWith(`${flagKey}:`)) featureFlagCache.delete(key);
  }
}

export function invalidateSystemConfigCache(configKey: string): void {
  systemConfigCache.delete(configKey);
}

/** Clear all caches — for testing only */
export function _clearAllCachesForTesting(): void {
  featureFlagCache.clear();
  systemConfigCache.clear();
}

// ---------------------------------------------------------------------------
// LD-A11 单点函数 · _toggleFeatureFlagInTx
// ---------------------------------------------------------------------------

export async function _toggleFeatureFlagInTx(
  tx: Prisma.TransactionClient,
  params: ToggleFeatureFlagInTxParams,
): Promise<void> {
  const { flagKey, enabled, rolloutConfig, flagType = 'boolean', adminId, approvalRequestId } = params;

  // AC-4: upsert — creates new flag if flagKey not in seed · updates existing
  await tx.featureFlag.upsert({
    where: { flagKey },
    update: {
      enabled,
      flagType,
      ...(rolloutConfig !== undefined ? { rolloutConfig } : {}),
      updatedByAdminId: adminId,
    },
    create: {
      flagKey,
      enabled,
      flagType,
      defaultValue: enabled,
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

  // Invalidate cache after write
  invalidateSystemConfigCache(configKey);

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
  // AC-4: supports arbitrary flagKey (upsert) — no longer throws NOT_FOUND for unknown keys
  // AC-3: validate rolloutConfig with discriminatedUnion schema when provided
  if (rolloutConfig !== undefined) {
    rolloutConfigSchema.parse(rolloutConfig);
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
// PRD-14 US-012 AC-5/6/7: 写 security_alert audit + 钉钉(isMock=true)
// ---------------------------------------------------------------------------

export async function emergencyToggleSystemConfig(
  configKey: string,
  configValue: Prisma.InputJsonValue,
  superAdminId: number,
  incidentId: string,
  reason: string,
): Promise<{ approvalRequestId: number }> {
  if (!incidentId.trim()) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'incidentId is required' });
  }
  if (!reason.trim()) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: '决策理由不能为空' });
  }

  const config = await prisma.systemConfig.findUnique({ where: { configKey } });
  if (!config) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `system_config '${configKey}' not found` });
  }

  // Step 1: create approval request
  const approvalReq = await requestApproval({
    actionType: 'update_system_config',
    requesterAdminId: superAdminId,
    requesterRole: 'super_admin',
    actionPayload: { configKey, configValue, incidentId, reason },
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

  // AC-6: 写 security_alert audit log · 必含 configKey + incidentId
  await logAdminAction({
    actorAdminId: superAdminId,
    actorRole: 'super_admin',
    eventCategory: 'security_alert',
    eventType: 'emergency_switch_triggered',
    payload: { configKey, configValue, incidentId, reason, approvalRequestId: approvalReq.id },
    traceId: createHash('md5')
      .update(`emergency:${configKey}:${incidentId}:${Date.now()}`)
      .digest('hex')
      .slice(0, 16),
    ip: '0.0.0.0',
    userAgent: 'emergency-switch-service',
    sessionId: 'system',
    success: true,
  }).catch(() => {});

  // AC-7: 钉钉告警 D-077 isMock=true 默认
  const dingtalk = new DingtalkService();
  await dingtalk
    .send(
      `[紧急开关触发] configKey=${configKey} · incidentId=${incidentId} · adminId=${superAdminId} · approvalRequestId=${approvalReq.id}`,
    )
    .catch(() => {});

  return { approvalRequestId: approvalReq.id };
}

// ---------------------------------------------------------------------------
// getFeatureFlagValue — 3 flagType 路由 · boolean / percentage / targeted
// PRD-14 US-012 AC-10: 5s TTL cache(Map + setInterval)防 hot path 频繁查 DB
// ---------------------------------------------------------------------------

export async function getFeatureFlagValue(
  flagKey: string,
  userId?: number,
  plan?: string,
): Promise<boolean> {
  const cacheKey = `${flagKey}:${userId ?? ''}:${plan ?? ''}`;
  const cached = featureFlagCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const flag = await prisma.featureFlag.findUnique({ where: { flagKey } });
  if (!flag || !flag.enabled) {
    featureFlagCache.set(cacheKey, { value: false, expiresAt: Date.now() + CACHE_TTL_MS });
    return false;
  }

  const flagType = flag.flagType as 'boolean' | 'percentage' | 'targeted';
  let result = false;

  if (flagType === 'boolean') {
    result = Boolean(flag.defaultValue);
  } else if (flagType === 'percentage') {
    const cfg = flag.rolloutConfig as { percentage?: number } | null;
    const pct = cfg?.percentage ?? 0;
    if (userId === undefined) {
      result = false;
    } else {
      // AC-1: md5 hash 分流: hash(userId:flagKey) → 0-99 · deterministic · SHIELD: userId 在前
      const hash = createHash('md5').update(`${userId}:${flagKey}`).digest('hex');
      const bucket = parseInt(hash.slice(0, 8), 16) % 100;
      result = bucket < pct;
    }
  } else if (flagType === 'targeted') {
    const cfg = flag.rolloutConfig as {
      target_users?: number[];
      target_plans?: string[];
    } | null;

    if (userId !== undefined && cfg?.target_users?.includes(userId)) {
      result = true;
    } else if (plan !== undefined && cfg?.target_plans?.includes(plan)) {
      result = true;
    } else {
      result = false;
    }
  }

  featureFlagCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

// ---------------------------------------------------------------------------
// getSystemConfigValue — read system_config · 5s TTL cache
// PRD-14 US-012: used by EvolutionAgent + ContextAssembler for emergency bypass
// ---------------------------------------------------------------------------

export async function getSystemConfigValue(configKey: string): Promise<unknown> {
  const cached = systemConfigCache.get(configKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const config = await prisma.systemConfig.findUnique({ where: { configKey } });
  const value = config?.configValue ?? null;

  systemConfigCache.set(configKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
