// PRD-14 US-012 + US-014 · adminRouter.featureFlags
// US-014: 8 procedures · 配置中心 UI API
// SHIELD: emergencyToggleSystemConfig super_admin only · incidentId 必填(server 双校验)
// SHIELD: 3 关键开关 stop_trending_scraper / stop_evolution_agent / enable_fallback_prompt
// SHIELD: LD-A11 单点写操作 · 走 _updateSystemConfigInTx 不绕过

import { TRPCError } from '@trpc/server';
import { z } from 'zod';


import { prisma } from '@/lib/prisma';
import { requestApproval } from '@/services/admin/approval/approvalGateService';
import {
  emergencyToggleSystemConfig,
  toggleFeatureFlag,
  rolloutConfigSchema,
} from '@/services/admin/feature-flag/feature-flag.service';
import { adminProcedure } from '@/trpc/procedures/admin';
import { adminTrpcRouter } from '@/trpc/trpc-admin';

import type { Prisma } from '@prisma/client';

// 3 关键紧急开关 keys · US-011 seed
const EMERGENCY_SWITCH_KEYS = [
  'stop_trending_scraper',
  'stop_evolution_agent',
  'enable_fallback_prompt',
] as const;

// SHIELD: 敏感配置(API key/secret/token)服务端脱敏 · 防 super_admin 经 Network Tab 读取明文(R-001 精神)。
// LLM gateway 从 DB 直接读 key(loadLlmKey · 不经此 query),故脱敏不影响功能;UI 仅显示打码版,编辑时输新值覆盖。
const SECRET_CONFIG_KEY_RE = /API_KEY|SECRET|TOKEN|PASSWORD/i;
function maskSecretConfigValue(configKey: string, value: Prisma.JsonValue): Prisma.JsonValue {
  // 仅对「字符串型」敏感配置脱敏;布尔/数值/对象型(如开关、限流参数)原样返回。
  if (typeof value !== 'string' || value.length === 0 || !SECRET_CONFIG_KEY_RE.test(configKey)) return value;
  return value.length <= 8 ? '******' : `${value.slice(0, 6)}******`;
}

function guardSuperAdmin(ctx: { activeAdminUser?: { role?: string } | null }): void {
  if (ctx.activeAdminUser?.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'super_admin only' });
  }
}

/** Bulk-fetch admin emails by ID list */
async function adminEmailMap(ids: (number | null | undefined)[]): Promise<Record<number, string>> {
  const uniqueIds = [...new Set(ids.filter((id): id is number => id != null))];
  if (uniqueIds.length === 0) return {};
  const admins = await prisma.adminUser.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, email: true },
  });
  return Object.fromEntries(admins.map((a) => [a.id, a.email]));
}

export const featureFlagsRouter = adminTrpcRouter({
  /**
   * 1. getKpiStats — 4 KPI 数字
   * AC-10: 总 flag 数 + 启用 flag 数 + 7 天变更次数 + 紧急开关激活数
   */
  getKpiStats: adminProcedure.query(async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalFlags, enabledFlags, recentChanges, emergencyActivations] = await Promise.all([
      prisma.featureFlag.count(),
      prisma.featureFlag.count({ where: { enabled: true } }),
      prisma.adminAuditLog.count({
        where: {
          eventType: { in: ['toggle_feature_flag', 'update_system_config'] },
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.adminAuditLog.count({
        where: { eventType: 'emergency_switch_triggered' },
      }),
    ]);

    return { totalFlags, enabledFlags, recentChanges, emergencyActivations };
  }),

  /**
   * 2. listEmergencySwitches — system_config with isEmergency=true
   * AC-3: 紧急开关 Tab 数据源
   */
  listEmergencySwitches: adminProcedure.query(async () => {
    const configs = await prisma.systemConfig.findMany({
      where: { isEmergency: true },
      orderBy: { updatedAt: 'desc' },
    });

    const emailMap = await adminEmailMap(configs.map((c) => c.updatedByAdminId));

    return configs.map((c) => ({
      id: c.id,
      configKey: c.configKey,
      configValue: maskSecretConfigValue(c.configKey, c.configValue),
      description: c.description,
      isEmergency: c.isEmergency,
      updatedByAdminId: c.updatedByAdminId,
      updatedByEmail: emailMap[c.updatedByAdminId] ?? null,
      updatedAt: c.updatedAt,
    }));
  }),

  /**
   * 3. listFeatureFlags — feature_flags table
   * AC-6: 通用 flags Tab 数据源
   */
  listFeatureFlags: adminProcedure.query(async () => {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const emailMap = await adminEmailMap(flags.map((f) => f.updatedByAdminId));

    return flags.map((f) => ({
      id: f.id,
      flagKey: f.flagKey,
      description: f.description,
      flagType: f.flagType,
      defaultValue: f.defaultValue,
      rolloutConfig: f.rolloutConfig,
      enabled: f.enabled,
      updatedByAdminId: f.updatedByAdminId,
      updatedByEmail: emailMap[f.updatedByAdminId] ?? null,
      updatedAt: f.updatedAt,
    }));
  }),

  /**
   * 4. listSystemConfig — system_config non-emergency
   * AC-8: 系统配置 Tab 数据源
   */
  listSystemConfig: adminProcedure.query(async () => {
    const configs = await prisma.systemConfig.findMany({
      where: { isEmergency: false },
      orderBy: { updatedAt: 'desc' },
    });

    const emailMap = await adminEmailMap(configs.map((c) => c.updatedByAdminId));

    return configs.map((c) => ({
      id: c.id,
      configKey: c.configKey,
      configValue: maskSecretConfigValue(c.configKey, c.configValue),
      description: c.description,
      isEmergency: c.isEmergency,
      updatedByAdminId: c.updatedByAdminId,
      updatedByEmail: emailMap[c.updatedByAdminId] ?? null,
      updatedAt: c.updatedAt,
    }));
  }),

  /**
   * 5. toggle — dual approval for feature flags
   * AC-7: 编辑弹 EditFlagModal · 走 dual approval · toast '已发起 Approval #X'
   */
  toggle: adminProcedure
    .input(
      z.object({
        flagKey: z.string().min(1),
        enabled: z.boolean(),
        rolloutConfig: rolloutConfigSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.activeAdminUser!.id as unknown as number;
      const result = await toggleFeatureFlag(
        input.flagKey,
        input.enabled,
        adminId,
        input.rolloutConfig as Prisma.InputJsonValue | undefined,
      );
      return result;
    }),

  /**
   * 6. updateSystemConfig — dual approval for system_config (non-emergency)
   * AC-8: 系统配置 Tab 编辑弹 EditConfigModal · 走 dual approval
   */
  updateSystemConfig: adminProcedure
    .input(
      z.object({
        configKey: z.string().min(1),
        configValue: z.unknown(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.activeAdminUser!.id as unknown as number;

      const config = await prisma.systemConfig.findUnique({ where: { configKey: input.configKey } });
      if (!config) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `system_config '${input.configKey}' not found` });
      }

      const approvalReq = await requestApproval({
        actionType: 'update_system_config',
        requesterAdminId: adminId,
        requesterRole: (ctx.activeAdminUser!.role ?? 'admin') as 'admin' | 'super_admin' | 'system',
        actionPayload: { configKey: input.configKey, configValue: input.configValue } as Prisma.InputJsonValue,
        riskLevel: 'medium',
        requireDualApproval: true,
      });

      return { approvalRequestId: approvalReq.id };
    }),

  /**
   * 7. listPostReview — emergency_switch_triggered 需后置复核
   * AC-9: 后置复核 Tab(super_admin only) · postReviewRequired=true && postReviewedAt=null && decidedAt > 6h ago
   */
  listPostReview: adminProcedure.query(async ({ ctx }) => {
    guardSuperAdmin(ctx);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const rows = await prisma.approvalRequest.findMany({
      where: {
        actionType: 'update_system_config',
        postReviewRequired: true,
        postReviewedAt: null,
        decidedAt: { lte: sixHoursAgo },
      },
      orderBy: { decidedAt: 'asc' },
      take: 50,
    });

    const emailMap = await adminEmailMap(
      rows.flatMap((r) => [r.requesterAdminId, r.approverAdminId]),
    );

    return rows.map((r) => ({
      id: r.id,
      actionType: r.actionType,
      actionPayload: r.actionPayload as Record<string, unknown>,
      decidedAt: r.decidedAt,
      postReviewRequired: r.postReviewRequired,
      postReviewedAt: r.postReviewedAt,
      approverAdminId: r.approverAdminId,
      firstApproverEmail: r.approverAdminId != null ? (emailMap[r.approverAdminId] ?? null) : null,
      requesterAdminId: r.requesterAdminId,
      requesterEmail: emailMap[r.requesterAdminId] ?? null,
    }));
  }),

  /**
   * 8. emergencyToggleSystemConfig — super_admin 1 click · incidentId 必填
   * AC-4: EmergencyTriggerModal 提交走此 mutation
   * SHIELD: incidentId 客户端 + 服务端双校验
   * SHIELD: super_admin only · admin/readonly_admin 操作按钮 disabled
   */
  emergencyToggleSystemConfig: adminProcedure
    .input(
      z.object({
        configKey: z.enum(EMERGENCY_SWITCH_KEYS),
        incidentId: z.string().min(1, 'incidentId is required'),
        reason: z.string().min(1, '决策理由不能为空'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      guardSuperAdmin(ctx);
      const { configKey, incidentId, reason } = input;
      const superAdminId = ctx.activeAdminUser!.id as unknown as number;
      return emergencyToggleSystemConfig(configKey, true, superAdminId, incidentId, reason);
    }),
});
